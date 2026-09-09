/**
 * Shapes used by every screen of the CRM.
 *
 * These are the *UI* types: they carry display-ready strings (French labels,
 * initials, avatar gradients) and are produced from the API DTOs in
 * `@/lib/api/mappers`. Each one also keeps the numeric backend ids it came
 * from (`ownerId`, `clientId`, ...) so it can be turned back into a payload.
 *
 * The data itself no longer lives here - it comes from the API through
 * `@/lib/store`.
 */

export type Priority = "low" | "medium" | "high";
export type ClientStatus = "prospect" | "actif" | "inactif" | "vip";

export type Client = {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  sector: string;
  owner: string;
  ownerId?: number;
  status: ClientStatus;
  priority: Priority;
  tags: string[];
  value: number;
  lastContact: string;
  initials: string;
  color: string;
};

export type Activity = {
  id: string;
  type: "call" | "meeting" | "email" | "quote" | "contract" | "visit" | "note" | "follow-up" | "task" | "whatsapp";
  title: string;
  client: string;
  clientId?: number;
  owner: string;
  ownerId?: number;
  date: string; // ISO day, ex. "2026-07-08"
  time: string; // "14:30"
  duration?: string;
  status: "planifié" | "terminé" | "en retard" | "à faire";
  priority: Priority;
  summary?: string;
  result?: string;
  blocked?: boolean;
  reminder?: string;
};

export type HistoryChannel = "call" | "email" | "whatsapp" | "meeting" | "visit" | "note";

export type ClientEvent = {
  id: string;
  channel: HistoryChannel;
  title: string;
  client: string;
  owner: string;
  date: string;
  time: string;
  direction: "past" | "upcoming";
  summary?: string;
};

export type Stage =
  | "Nouveau lead"
  | "Premier contact"
  | "Qualification"
  | "Rendez-vous planifié"
  | "Analyse des besoins"
  | "Démonstration"
  | "Devis envoyé"
  | "Négociation"
  | "Relance 1"
  | "Relance 2"
  | "Relance finale"
  | "Contrat signé"
  | "Vente gagnée"
  | "Vente perdue"
  | "Ambassadeur";

export const stages: Stage[] = [
  "Nouveau lead",
  "Premier contact",
  "Qualification",
  "Rendez-vous planifié",
  "Analyse des besoins",
  "Démonstration",
  "Devis envoyé",
  "Négociation",
  "Relance 1",
  "Relance 2",
  "Relance finale",
  "Contrat signé",
  "Vente gagnée",
  "Vente perdue",
  "Ambassadeur",
];

/** Stages the backend counts as won (Entity/Enum/OpportunityStage::isWon). */
export const wonStages: Stage[] = ["Contrat signé", "Vente gagnée", "Ambassadeur"];
export const lostStages: Stage[] = ["Vente perdue"];

/** Couleur associée à chaque étape — partagée entre le pipeline et le tableau de bord. */
export const stageColors: Record<Stage, string> = {
  "Nouveau lead": "bg-slate-500",
  "Premier contact": "bg-blue-500",
  "Qualification": "bg-sky-500",
  "Rendez-vous planifié": "bg-cyan-500",
  "Analyse des besoins": "bg-teal-500",
  "Démonstration": "bg-indigo-500",
  "Devis envoyé": "bg-violet-500",
  "Négociation": "bg-fuchsia-500",
  "Relance 1": "bg-amber-500",
  "Relance 2": "bg-orange-500",
  "Relance finale": "bg-rose-500",
  "Contrat signé": "bg-emerald-500",
  "Vente gagnée": "bg-emerald-600",
  "Vente perdue": "bg-slate-400",
  "Ambassadeur": "bg-yellow-500",
};

export type Deal = {
  id: string;
  client: string;
  clientId?: number;
  company: string;
  amount: number;
  probability: number;
  owner: string;
  ownerId?: number;
  lastActivity: string;
  nextAction: string;
  closeDate: string;
  stage: Stage;
};

export type TaskStatus = "À faire" | "En cours" | "Terminé" | "En retard";

export type ProjectTask = {
  id: string;
  label: string;
  status: TaskStatus;
  assignee: string; // initials
  assigneeId?: number;
  due: string;
  priority?: Priority;
  description?: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  clientId?: number;
  owner: string;
  ownerId?: number;
  start: string;
  end: string;
  progress: number;
  status: "En cours" | "En attente" | "Suspendu" | "Terminé";
  team: string[]; // initials
  teamIds?: number[];
  tasks: ProjectTask[];
};

export type Member = {
  id: string;
  name: string;
  role: "Administrateur" | "Manager" | "Commercial";
  email: string;
  phone: string;
  team: string;
  status: "Actif" | "Invité" | "Désactivé";
  initials: string;
  lastActive: string;
  photo?: string;
  firstName?: string;
  lastName?: string;
};

/* -------------------- pure helpers -------------------- */
/* The store (`@/lib/store`) exposes these already bound to the live data. */

export function eventsForClient(events: ClientEvent[], name: string) {
  const list = events.filter((e) => e.client === name);
  return {
    past: list.filter((e) => e.direction === "past"),
    upcoming: list.filter((e) => e.direction === "upcoming"),
    all: list,
  };
}

export function clientHistorySummary(events: ClientEvent[], name: string) {
  const { past, upcoming } = eventsForClient(events, name);
  return {
    lastChannel: past[0]?.channel,
    lastLabel: past[0]?.title,
    lastDate: past[0] ? `${past[0].date} ${past[0].time}` : "—",
    nextChannel: upcoming[0]?.channel,
    nextLabel: upcoming[0]?.title,
    nextDate: upcoming[0] ? `${upcoming[0].date} ${upcoming[0].time}` : "—",
    totalPast: past.length,
    totalUpcoming: upcoming.length,
  };
}

// Rattache les projets au client via clientId (clé stable partagée par les deux entités),
// plutôt que par une comparaison de texte entre le nom du contact et celui de l'entreprise
// (deux champs distincts qui ne coïncident quasiment jamais).
export function projectsForClient(projects: Project[], clientId: string | number | undefined): Project[] {
  if (clientId === undefined || clientId === null || clientId === "") return [];
  const needle = Number(clientId);
  if (Number.isNaN(needle)) return [];
  return projects.filter((p) => p.clientId === needle);
}

export function projectForClient(projects: Project[], clientId: string | number | undefined): Project | undefined {
  return projectsForClient(projects, clientId)[0];
}
