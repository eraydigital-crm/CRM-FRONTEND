/**
 * Mirrors of the backend response DTOs (CGA-BACKEND/src/Dto/Response).
 * Field names and enum values are copied verbatim from PHP - keep them in sync.
 */

export type ApiRole = "admin" | "manager" | "commercial";
export type ApiUserStatus = "active" | "invited" | "disabled";

export type ApiUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: ApiRole;
  phone: string | null;
  team: string | null;
  photo: string | null;
  status: ApiUserStatus;
  isVerified: boolean;
};

export type ApiClientStatus = "prospect" | "actif" | "inactif" | "vip";
export type ApiPriority = "low" | "medium" | "high";

export type ApiClient = {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  email: string;
  phone: string;
  city: string | null;
  sector: string | null;
  ownerId: number;
  ownerName: string;
  ownerPhoto: string | null;
  status: ApiClientStatus;
  priority: ApiPriority;
  tags: string[];
  value: number;
  lastContactAt: string | null;
  initials: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiOpportunity = {
  id: number;
  clientId: number;
  clientName: string;
  company: string | null;
  ownerId: number;
  ownerName: string;
  ownerPhoto: string | null;
  amount: number;
  probability: number;
  stage: string;
  isWon: boolean;
  isLost: boolean;
  lastActivityAt: string | null;
  nextAction: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiActivityType =
  | "call" | "meeting" | "email" | "quote" | "contract"
  | "visit" | "note" | "follow-up" | "task" | "whatsapp";

export type ApiActivityStatus = "planifié" | "terminé" | "en retard" | "à faire";

export type ApiActivity = {
  id: number;
  type: ApiActivityType;
  title: string;
  clientId: number;
  clientName: string;
  ownerId: number;
  ownerName: string;
  ownerPhoto: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  status: ApiActivityStatus;
  priority: ApiPriority;
  summary: string | null;
  result: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiProjectStatus = "En cours" | "En attente" | "Suspendu" | "Terminé";
export type ApiTaskStatus = "À faire" | "En cours" | "Terminé" | "En retard";

export type ApiProject = {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  ownerId: number;
  ownerName: string;
  ownerPhoto: string | null;
  startDate: string;
  endDate: string | null;
  progress: number;
  status: ApiProjectStatus;
  teamMembers: Array<{ id: number; name: string; photo: string | null }>;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiProjectTask = {
  id: number;
  projectId: number;
  label: string;
  status: ApiTaskStatus;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneePhoto: string | null;
  dueDate: string | null;
  priority: ApiPriority;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiDashboardStatistics = {
  totalClients: number;
  prospects: number;
  activeClients: number;
  totalOpportunityValue: number;
  wonOpportunities: number;
  lostOpportunities: number;
  upcomingActivities: number;
  overdueTasks: number;
  revenueByMonth: Record<string, number>;
  clientsByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
};

export type ApiNotification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type LoginResponse = {
  token: string;
  role: ApiRole;
  user: ApiUser;
};

/* -------------------- request payloads -------------------- */

export type ClientPayload = {
  name: string;
  company?: string | null;
  role?: string | null;
  email: string;
  phone: string;
  city?: string | null;
  sector?: string | null;
  status: ApiClientStatus;
  priority: ApiPriority;
  tags?: string[];
  value: number;
  ownerId?: number | null;
};

export type OpportunityPayload = {
  clientId: number;
  amount: number;
  probability: number;
  stage: string;
  nextAction?: string | null;
  closeDate?: string | null;
  ownerId?: number | null;
};

export type ActivityPayload = {
  type: ApiActivityType;
  title: string;
  clientId: number;
  scheduledAt: string;
  durationMinutes?: number | null;
  status: ApiActivityStatus;
  priority: ApiPriority;
  summary?: string | null;
  result?: string | null;
  reminderAt?: string | null;
  ownerId?: number | null;
};

export type ProjectPayload = {
  name: string;
  clientId: number;
  startDate: string;
  endDate?: string | null;
  progress: number;
  status: ApiProjectStatus;
  teamMemberIds?: number[];
  ownerId?: number | null;
};

export type ProjectTaskPayload = {
  label: string;
  status: ApiTaskStatus;
  assigneeId?: number | null;
  dueDate?: string | null;
  priority: ApiPriority;
  description?: string | null;
};

export type UserInvitePayload = {
  firstName: string;
  lastName: string;
  email: string;
  role: ApiRole;
  team?: string | null;
};

export type MeUpdatePayload = {
  firstName: string;
  lastName: string;
  phone?: string | null;
  team?: string | null;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string | null;
};
