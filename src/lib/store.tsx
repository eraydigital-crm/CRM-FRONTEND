/**
 * Application data, backed by the Symfony API.
 *
 * `useCRM()` keeps the array + setter shape the screens were written against
 * (`setClients([newClient, ...clients])`), but each setter now diffs the array
 * and pushes the change to the backend - see `useSyncedCollection`.
 *
 * Reads happen once per collection and are cached by React Query; every write
 * is optimistic and reconciled with the server response.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  activitiesApi,
  authApi,
  clientsApi,
  opportunitiesApi,
  projectTasksApi,
  projectsApi,
  usersApi,
} from "@/lib/api/endpoints";
import { UNAUTHORIZED_EVENT, session } from "@/lib/api/http";
import type { ApiUser } from "@/lib/api/types";
import {
  roleSlug,
  splitFullName,
  toActivity,
  toActivityPayload,
  toClient,
  toClientEvent,
  toClientPayload,
  toDeal,
  toMember,
  toOpportunityPayload,
  toProject,
  toProjectPayload,
  toProjectTask,
  toProjectTaskPayload,
} from "@/lib/api/mappers";
import {
  clientHistorySummary as computeHistorySummary,
  eventsForClient as computeEventsForClient,
  projectForCompany as computeProjectForCompany,
  projectsForCompany as computeProjectsForCompany,
} from "@/lib/crm-data";
import type { Activity, Client, ClientEvent, Deal, Member, Project } from "@/lib/crm-data";
import { numericId, useSyncedCollection } from "@/lib/use-synced-collection";

type CRMContextType = {
  clients: Client[];
  setClients: Dispatch<SetStateAction<Client[]>>;
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  deals: Deal[];
  setDeals: Dispatch<SetStateAction<Deal[]>>;
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  clientEvents: ClientEvent[];
  setClientEvents: Dispatch<SetStateAction<ClientEvent[]>>;
  members: Member[];
  setMembers: Dispatch<SetStateAction<Member[]>>;
  currentUser: ApiUser | null;
  isLoading: boolean;
  refreshAll: () => void;
  eventsForClient: (name: string) => ReturnType<typeof computeEventsForClient>;
  clientHistorySummary: (name: string) => ReturnType<typeof computeHistorySummary>;
  projectsForCompany: (company: string) => Project[];
  projectForCompany: (company: string) => Project | undefined;
};

const CRMContext = createContext<CRMContextType | null>(null);

/** Thrown when a form references a client the API does not know about. */
function missingClient(name: string): Error {
  return new Error(
    `Client "${name}" introuvable : choisissez un client existant dans la liste.`,
  );
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authenticated = session.isAuthenticated;

  // A rejected token anywhere in the app sends the user back to the login page.
  useEffect(() => {
    const onUnauthorized = () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [navigate, queryClient]);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: authenticated,
    staleTime: 5 * 60_000,
  });
  const currentUser = meQuery.data ?? null;

  // Keep the cached display name in sync with the profile.
  useEffect(() => {
    if (currentUser) session.patch({ role: currentUser.role, name: currentUser.fullName });
  }, [currentUser]);

  /* -------------------- clients -------------------- */

  const clientsRef = useRef<Client[]>([]);
  const clientIdFor = useCallback((name: string, hint?: number): number | null => {
    if (hint) return hint;
    const match = clientsRef.current.find((c) => c.name === name)
      ?? clientsRef.current.find((c) => c.company === name)
      ?? clientsRef.current.find((c) => c.name.toLowerCase() === name?.toLowerCase());
    return match ? numericId(match.id) : null;
  }, []);

  const clientsAdapter = useMemo(
    () => ({
      key: "clients",
      labels: {
        create: "Impossible de créer le client",
        update: "Impossible de mettre à jour le client",
        remove: "Impossible de désactiver le client",
      },
      fetch: async (signal?: AbortSignal) => (await clientsApi.list(signal)).map(toClient),
      create: async (client: Client) => toClient(await clientsApi.create(toClientPayload(client))),
      update: async (client: Client) => {
        const id = numericId(client.id);
        if (!id) throw new Error("Client non encore enregistré.");
        return toClient(await clientsApi.update(id, toClientPayload(client)));
      },
      remove: async (client: Client) => {
        const id = numericId(client.id);
        if (id) await clientsApi.remove(id);
      },
    }),
    [],
  );

  const clients = useSyncedCollection<Client>(clientsAdapter, authenticated);
  clientsRef.current = clients.items;

  /* -------------------- activities -------------------- */

  const activitiesAdapter = useMemo(
    () => ({
      key: "activities",
      labels: {
        create: "Impossible de créer l'activité",
        update: "Impossible de mettre à jour l'activité",
        remove: "Impossible de supprimer l'activité",
      },
      fetch: async (signal?: AbortSignal) => (await activitiesApi.list(signal)).map(toActivity),
      create: async (activity: Activity) => {
        const clientId = clientIdFor(activity.client, activity.clientId);
        if (!clientId) throw missingClient(activity.client);
        return toActivity(await activitiesApi.create(toActivityPayload(activity, clientId)));
      },
      update: async (activity: Activity) => {
        const id = numericId(activity.id);
        if (!id) throw new Error("Activité non encore enregistrée.");
        const clientId = clientIdFor(activity.client, activity.clientId);
        if (!clientId) throw missingClient(activity.client);
        return toActivity(await activitiesApi.update(id, toActivityPayload(activity, clientId)));
      },
      remove: async (activity: Activity) => {
        const id = numericId(activity.id);
        if (id) await activitiesApi.remove(id);
      },
    }),
    [clientIdFor],
  );

  const activities = useSyncedCollection<Activity>(activitiesAdapter, authenticated);

  /* -------------------- opportunities -------------------- */

  const dealsAdapter = useMemo(
    () => ({
      key: "opportunities",
      labels: {
        create: "Impossible de créer l'opportunité",
        update: "Impossible de mettre à jour l'opportunité",
        remove: "Impossible de supprimer l'opportunité",
      },
      fetch: async (signal?: AbortSignal) => (await opportunitiesApi.list(signal)).map(toDeal),
      create: async (deal: Deal) => {
        const clientId = clientIdFor(deal.client, deal.clientId) ?? clientIdFor(deal.company);
        if (!clientId) throw missingClient(deal.client);
        return toDeal(await opportunitiesApi.create(toOpportunityPayload(deal, clientId)));
      },
      update: async (deal: Deal) => {
        const id = numericId(deal.id);
        if (!id) throw new Error("Opportunité non encore enregistrée.");
        const clientId = clientIdFor(deal.client, deal.clientId) ?? clientIdFor(deal.company);
        if (!clientId) throw missingClient(deal.client);
        return toDeal(await opportunitiesApi.update(id, toOpportunityPayload(deal, clientId)));
      },
      remove: async (deal: Deal) => {
        const id = numericId(deal.id);
        if (id) await opportunitiesApi.remove(id);
      },
    }),
    [clientIdFor],
  );

  const deals = useSyncedCollection<Deal>(dealsAdapter, authenticated);

  /* -------------------- projects (+ their tasks) -------------------- */

  const membersRef = useRef<Member[]>([]);
  const memberIdFor = useCallback((initialsOrName: string | undefined): number | null => {
    if (!initialsOrName) return null;
    const needle = initialsOrName.toLowerCase();
    const match = membersRef.current.find((m) => m.initials.toLowerCase() === needle)
      ?? membersRef.current.find((m) => m.name.toLowerCase() === needle);
    return match ? numericId(match.id) : null;
  }, []);

  /** Tasks live behind their own endpoints: replay the diff of the nested list. */
  const syncProjectTasks = useCallback(
    async (projectId: number, previous: Project["tasks"], next: Project["tasks"]) => {
      const previousById = new Map(previous.map((task) => [task.id, task]));
      const nextIds = new Set(next.map((task) => task.id));

      for (const task of previous) {
        if (nextIds.has(task.id)) continue;
        const taskId = numericId(task.id);
        if (taskId) await projectTasksApi.remove(projectId, taskId);
      }

      const saved: Project["tasks"] = [];
      for (const task of next) {
        const payload = toProjectTaskPayload({
          ...task,
          assigneeId: task.assigneeId ?? memberIdFor(task.assignee) ?? undefined,
        });
        const before = previousById.get(task.id);
        const taskId = numericId(task.id);

        if (!before || !taskId) {
          saved.push(toProjectTask(await projectTasksApi.create(projectId, payload)));
        } else if (JSON.stringify(before) !== JSON.stringify(task)) {
          saved.push(toProjectTask(await projectTasksApi.update(projectId, taskId, payload)));
        } else {
          saved.push(task);
        }
      }
      return saved;
    },
    [memberIdFor],
  );

  const projectsAdapter = useMemo(
    () => ({
      key: "projects",
      labels: {
        create: "Impossible de créer le projet",
        update: "Impossible de mettre à jour le projet",
        remove: "Impossible de supprimer le projet",
      },
      fetch: async (signal?: AbortSignal) => {
        const apiProjects = await projectsApi.list(signal);
        const tasks = await Promise.all(
          apiProjects.map((project) => projectTasksApi.list(project.id, signal)),
        );
        return apiProjects.map((project, index) => toProject(project, tasks[index]));
      },
      create: async (project: Project) => {
        const clientId = clientIdFor(project.client, project.clientId);
        if (!clientId) throw missingClient(project.client);
        const created = await projectsApi.create(toProjectPayload(project, clientId));
        const tasks = await syncProjectTasks(created.id, [], project.tasks);
        return { ...toProject(created, []), tasks };
      },
      update: async (project: Project, previous: Project) => {
        const id = numericId(project.id);
        if (!id) throw new Error("Projet non encore enregistré.");
        const clientId = clientIdFor(project.client, project.clientId);
        if (!clientId) throw missingClient(project.client);
        const updated = await projectsApi.update(id, toProjectPayload(project, clientId));
        const tasks = await syncProjectTasks(id, previous.tasks, project.tasks);
        return { ...toProject(updated, []), tasks };
      },
      remove: async (project: Project) => {
        const id = numericId(project.id);
        if (id) await projectsApi.remove(id);
      },
    }),
    [clientIdFor, syncProjectTasks],
  );

  const projects = useSyncedCollection<Project>(projectsAdapter, authenticated);

  /* -------------------- team members -------------------- */

  const membersAdapter = useMemo(
    () => ({
      key: "users",
      labels: {
        create: "Impossible d'inviter ce membre",
        update: "Impossible de mettre à jour ce membre",
        remove: "Impossible de modifier ce membre",
      },
      fetch: async (signal?: AbortSignal) => (await usersApi.list(signal)).map(toMember),
      create: async (member: Member) => {
        const fallback = splitFullName(member.name);
        return toMember(
          await usersApi.invite({
            firstName: member.firstName || fallback.firstName,
            lastName: member.lastName || fallback.lastName,
            email: member.email,
            role: roleSlug(member.role),
            team: member.team && member.team !== "Non assigné" ? member.team : null,
          }),
        );
      },
      update: async (member: Member, previous: Member) => {
        const id = numericId(member.id);
        if (!id) throw new Error("Membre non encore enregistré.");

        let updated = await usersApi.update(id, {
          role: roleSlug(member.role),
          team: member.team && member.team !== "Non assigné" ? member.team : null,
        });

        // The backend never deletes a user - activation is a separate endpoint.
        if (member.status !== previous.status && member.status !== "Invité") {
          updated = await usersApi.setStatus(id, member.status === "Actif" ? "active" : "disabled");
        }
        return toMember(updated);
      },
    }),
    [],
  );

  const members = useSyncedCollection<Member>(membersAdapter, authenticated);
  membersRef.current = members.items;

  /* -------------------- derived data -------------------- */

  // The client history shown on a client sheet is the activity feed, grouped
  // by channel - there is no separate "events" resource in the API.
  const clientEvents = useMemo(() => activities.items.map(toClientEvent), [activities.items]);

  // Kept for API compatibility with the screens: events are derived, so writing
  // to them is a no-op - create an activity instead.
  const setClientEvents = useCallback<Dispatch<SetStateAction<ClientEvent[]>>>(() => {}, []);

  const refreshAll = useCallback(() => {
    clients.refresh();
    activities.refresh();
    deals.refresh();
    projects.refresh();
    members.refresh();
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [clients, activities, deals, projects, members, queryClient]);

  const value = useMemo<CRMContextType>(
    () => ({
      clients: clients.items,
      setClients: clients.setItems,
      activities: activities.items,
      setActivities: activities.setItems,
      deals: deals.items,
      setDeals: deals.setItems,
      projects: projects.items,
      setProjects: projects.setItems,
      clientEvents,
      setClientEvents,
      members: members.items,
      setMembers: members.setItems,
      currentUser,
      isLoading:
        clients.isLoading || activities.isLoading || deals.isLoading || projects.isLoading || members.isLoading,
      refreshAll,
      eventsForClient: (name: string) => computeEventsForClient(clientEvents, name),
      clientHistorySummary: (name: string) => computeHistorySummary(clientEvents, name),
      projectsForCompany: (company: string) => computeProjectsForCompany(projects.items, company),
      projectForCompany: (company: string) => computeProjectForCompany(projects.items, company),
    }),
    [clients, activities, deals, projects, members, clientEvents, setClientEvents, currentUser, refreshAll],
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within CRMProvider");
  return context;
}

/** Display name of the signed-in user, available before /api/me resolves. */
export function useCurrentUserName(): string {
  const { currentUser } = useCRM();
  return currentUser?.fullName ?? session.name ?? "Utilisateur";
}
