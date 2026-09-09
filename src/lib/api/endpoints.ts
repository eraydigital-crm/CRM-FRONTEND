/**
 * One function per backend route. Nothing here knows about the UI types -
 * conversion lives in ./mappers.
 */
import { apiRequest, fetchAllPages, session } from "./http";
import type {
  ActivityPayload,
  ApiActivity,
  ApiClient,
  ApiDashboardStatistics,
  ApiNotification,
  ApiOpportunity,
  ApiProject,
  ApiProjectTask,
  ApiUser,
  ApiUserStatus,
  ClientPayload,
  LoginResponse,
  MeUpdatePayload,
  OpportunityPayload,
  ProjectPayload,
  ProjectTaskPayload,
  RegisterPayload,
  UserInvitePayload,
} from "./types";

export const authApi = {
  async login(email: string, password: string, remember: boolean): Promise<LoginResponse> {
    const data = await apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password, remember },
    });
    session.save(
      { token: data.token, role: data.role, name: data.user.fullName },
      remember,
    );
    return data;
  },

  register(payload: RegisterPayload): Promise<ApiUser> {
    return apiRequest<ApiUser>("/api/auth/register", { method: "POST", body: payload });
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<null>("/api/auth/logout", { method: "POST" });
    } finally {
      session.clear();
    }
  },

  me(signal?: AbortSignal): Promise<ApiUser> {
    return apiRequest<ApiUser>("/api/me", { signal });
  },

  updateMe(payload: MeUpdatePayload): Promise<ApiUser> {
    return apiRequest<ApiUser>("/api/me", { method: "PATCH", body: payload });
  },

  requestPasswordReset(email: string): Promise<null> {
    return apiRequest<null>("/api/auth/password-reset", { method: "POST", body: { email } });
  },

  confirmPasswordReset(token: string, password: string): Promise<null> {
    return apiRequest<null>("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token, password },
    });
  },
};

export const clientsApi = {
  list(signal?: AbortSignal): Promise<ApiClient[]> {
    return fetchAllPages<ApiClient>("/api/clients", { sort: "createdAt", dir: "desc" }, signal);
  },
  get(id: number): Promise<ApiClient> {
    return apiRequest<ApiClient>(`/api/clients/${id}`);
  },
  create(payload: ClientPayload): Promise<ApiClient> {
    return apiRequest<ApiClient>("/api/clients", { method: "POST", body: payload });
  },
  update(id: number, payload: ClientPayload): Promise<ApiClient> {
    return apiRequest<ApiClient>(`/api/clients/${id}`, { method: "PUT", body: payload });
  },
  /** Soft delete: the backend deactivates the client, it is not erased. */
  remove(id: number): Promise<null> {
    return apiRequest<null>(`/api/clients/${id}`, { method: "DELETE" });
  },
};

export const opportunitiesApi = {
  list(signal?: AbortSignal): Promise<ApiOpportunity[]> {
    return fetchAllPages<ApiOpportunity>("/api/opportunities", { sort: "createdAt", dir: "desc" }, signal);
  },
  create(payload: OpportunityPayload): Promise<ApiOpportunity> {
    return apiRequest<ApiOpportunity>("/api/opportunities", { method: "POST", body: payload });
  },
  update(id: number, payload: OpportunityPayload): Promise<ApiOpportunity> {
    return apiRequest<ApiOpportunity>(`/api/opportunities/${id}`, { method: "PUT", body: payload });
  },
  remove(id: number): Promise<null> {
    return apiRequest<null>(`/api/opportunities/${id}`, { method: "DELETE" });
  },
};

export const activitiesApi = {
  list(signal?: AbortSignal): Promise<ApiActivity[]> {
    return fetchAllPages<ApiActivity>("/api/activities", { sort: "scheduledAt", dir: "desc" }, signal);
  },
  create(payload: ActivityPayload): Promise<ApiActivity> {
    return apiRequest<ApiActivity>("/api/activities", { method: "POST", body: payload });
  },
  update(id: number, payload: ActivityPayload): Promise<ApiActivity> {
    return apiRequest<ApiActivity>(`/api/activities/${id}`, { method: "PUT", body: payload });
  },
  remove(id: number): Promise<null> {
    return apiRequest<null>(`/api/activities/${id}`, { method: "DELETE" });
  },
};

export const projectsApi = {
  list(signal?: AbortSignal): Promise<ApiProject[]> {
    return fetchAllPages<ApiProject>("/api/projects", {}, signal);
  },
  create(payload: ProjectPayload): Promise<ApiProject> {
    return apiRequest<ApiProject>("/api/projects", { method: "POST", body: payload });
  },
  update(id: number, payload: ProjectPayload): Promise<ApiProject> {
    return apiRequest<ApiProject>(`/api/projects/${id}`, { method: "PUT", body: payload });
  },
  remove(id: number): Promise<null> {
    return apiRequest<null>(`/api/projects/${id}`, { method: "DELETE" });
  },
};

export const projectTasksApi = {
  list(projectId: number, signal?: AbortSignal): Promise<ApiProjectTask[]> {
    return apiRequest<ApiProjectTask[]>(`/api/projects/${projectId}/tasks`, { signal });
  },
  create(projectId: number, payload: ProjectTaskPayload): Promise<ApiProjectTask> {
    return apiRequest<ApiProjectTask>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: payload,
    });
  },
  update(projectId: number, taskId: number, payload: ProjectTaskPayload): Promise<ApiProjectTask> {
    return apiRequest<ApiProjectTask>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      body: payload,
    });
  },
  remove(projectId: number, taskId: number): Promise<null> {
    return apiRequest<null>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
  },
};

export const usersApi = {
  list(signal?: AbortSignal): Promise<ApiUser[]> {
    return apiRequest<ApiUser[]>("/api/users", { signal });
  },
  invite(payload: UserInvitePayload): Promise<ApiUser> {
    return apiRequest<ApiUser>("/api/users/invite", { method: "POST", body: payload });
  },
  update(id: number, payload: { role: string; team?: string | null }): Promise<ApiUser> {
    return apiRequest<ApiUser>(`/api/users/${id}`, { method: "PUT", body: payload });
  },
  setStatus(id: number, status: Extract<ApiUserStatus, "active" | "disabled">): Promise<ApiUser> {
    return apiRequest<ApiUser>(`/api/users/${id}/status`, { method: "PATCH", body: { status } });
  },
};

export const dashboardApi = {
  statistics(signal?: AbortSignal): Promise<ApiDashboardStatistics> {
    return apiRequest<ApiDashboardStatistics>("/api/dashboard/statistics", { signal });
  },
};

export const notificationsApi = {
  list(signal?: AbortSignal): Promise<ApiNotification[]> {
    return fetchAllPages<ApiNotification>("/api/notifications", {}, signal);
  },
  unreadCount(signal?: AbortSignal): Promise<{ count: number }> {
    return apiRequest<{ count: number }>("/api/notifications/unread-count", { signal });
  },
  markRead(id: number): Promise<ApiNotification> {
    return apiRequest<ApiNotification>(`/api/notifications/${id}/read`, { method: "PATCH" });
  },
  markAllRead(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>("/api/notifications/read-all", { method: "PATCH" });
  },
};
