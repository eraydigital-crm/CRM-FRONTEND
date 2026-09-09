/**
 * Conversions between the backend DTOs and the UI types used across the app
 * (src/lib/crm-data.ts).
 *
 * Conventions:
 *  - every date carried in the UI store is an ISO day string ("2026-09-15"),
 *    every time is "HH:MM". Both are what the activities and calendar pages
 *    already parse, and they round-trip to the API without ambiguity;
 *  - human-readable "il y a 2 h" labels are derived at mapping time and are
 *    display-only (never sent back);
 *  - the numeric backend ids are kept alongside the string ids the UI uses,
 *    so a UI object can always be turned back into an API payload.
 */
import type {
  Activity,
  Client,
  ClientEvent,
  Deal,
  HistoryChannel,
  Member,
  Project,
  ProjectTask,
  Stage,
} from "@/lib/crm-data";
import type {
  ActivityPayload,
  ApiActivity,
  ApiActivityStatus,
  ApiActivityType,
  ApiClient,
  ApiOpportunity,
  ApiPriority,
  ApiProject,
  ApiProjectTask,
  ApiRole,
  ApiUser,
  ClientPayload,
  OpportunityPayload,
  ProjectPayload,
  ProjectTaskPayload,
} from "./types";

/* -------------------- dates -------------------- */

const RELATIVE_DAYS: Record<string, number> = {
  "aujourd'hui": 0,
  demain: 1,
  hier: -1,
  "il y a 2 j": -2,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Accepts ISO, "dd/mm/yyyy" and the French relative labels used by the UI. */
export function parseUiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const raw = value.trim();

  const relative = RELATIVE_DAYS[raw.toLowerCase()];
  if (relative !== undefined) {
    const d = new Date();
    d.setDate(d.getDate() + relative);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]), 0, 0, 0, 0);
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
  }

  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** "2026-09-15" + "14:30" -> ISO 8601 datetime accepted by the API. */
export function toApiDateTime(date: string, time: string | undefined): string {
  const day = parseUiDate(date) ?? new Date();
  const [hours, minutes] = (time || "09:00").split(":").map(Number);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day.toISOString();
}

/** ISO date-only string for the API (closeDate, startDate, dueDate...). */
export function toApiDate(value: string | null | undefined): string | null {
  const parsed = parseUiDate(value);
  return parsed ? isoDay(parsed) : null;
}

export function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  return { date: isoDay(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** "il y a 2 h", "hier", "il y a 3 j" - display only. */
export function relativeLabel(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;

  return date.toLocaleDateString("fr-FR");
}

export function durationLabel(minutes: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourPart = hours === 1 ? "1 heure" : `${hours} heures`;
  return rest ? `${hourPart} ${rest} min` : hourPart;
}

export function parseDurationLabel(label: string | undefined | null): number | null {
  if (!label) return null;
  const text = label.toLowerCase();
  const hours = text.match(/(\d+)\s*(h|heure)/);
  const minutes = text.match(/(\d+)\s*(min|minute)/);
  if (!hours && !minutes) {
    const bare = text.match(/^(\d+)$/);
    return bare ? Number(bare[1]) : null;
  }
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

/* -------------------- misc helpers -------------------- */

const GRADIENTS = [
  "from-blue-500 to-violet-500",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

/** Stable avatar gradient: the same client always gets the same colours. */
export function gradientFor(seed: string | number): string {
  const text = String(seed);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/* -------------------- clients -------------------- */

export function toClient(api: ApiClient): Client {
  return {
    id: String(api.id),
    name: api.name,
    company: api.company ?? "",
    role: api.role ?? "",
    email: api.email,
    phone: api.phone,
    city: api.city ?? "",
    sector: api.sector ?? "",
    owner: api.ownerName,
    ownerId: api.ownerId,
    status: api.status,
    priority: api.priority,
    tags: api.tags ?? [],
    value: api.value,
    lastContact: relativeLabel(api.lastContactAt),
    initials: api.initials || initialsOf(api.name),
    color: gradientFor(api.id),
  };
}

export function toClientPayload(client: Client): ClientPayload {
  return {
    name: client.name,
    company: client.company || null,
    role: client.role || null,
    email: client.email,
    phone: client.phone,
    city: client.city || null,
    sector: client.sector || null,
    status: client.status,
    priority: client.priority as ApiPriority,
    tags: client.tags ?? [],
    value: Number(client.value) || 0,
    ownerId: client.ownerId ?? null,
  };
}

/* -------------------- opportunities (UI: "deals") -------------------- */

export function toDeal(api: ApiOpportunity): Deal {
  return {
    id: String(api.id),
    client: api.clientName,
    clientId: api.clientId,
    company: api.company ?? "",
    amount: api.amount,
    probability: api.probability,
    owner: api.ownerName,
    ownerId: api.ownerId,
    lastActivity: relativeLabel(api.lastActivityAt),
    nextAction: api.nextAction ?? "",
    closeDate: api.closeDate ?? "",
    stage: api.stage as Stage,
  };
}

export function toOpportunityPayload(deal: Deal, clientId: number): OpportunityPayload {
  return {
    clientId,
    amount: Number(deal.amount) || 0,
    probability: Number(deal.probability) || 0,
    stage: deal.stage,
    nextAction: deal.nextAction || null,
    closeDate: toApiDate(deal.closeDate),
    ownerId: deal.ownerId ?? null,
  };
}

/* -------------------- activities -------------------- */

export function toActivity(api: ApiActivity): Activity {
  const { date, time } = splitDateTime(api.scheduledAt);
  return {
    id: String(api.id),
    type: api.type,
    title: api.title,
    client: api.clientName,
    clientId: api.clientId,
    owner: api.ownerName,
    ownerId: api.ownerId,
    date,
    time,
    duration: durationLabel(api.durationMinutes),
    status: api.status,
    priority: api.priority,
    summary: api.summary ?? undefined,
    result: api.result ?? undefined,
    reminder: api.reminderAt ?? undefined,
  };
}

export function toActivityPayload(activity: Activity, clientId: number): ActivityPayload {
  return {
    type: activity.type as ApiActivityType,
    title: activity.title,
    clientId,
    scheduledAt: toApiDateTime(activity.date, activity.time),
    durationMinutes: parseDurationLabel(activity.duration),
    status: activity.status as ApiActivityStatus,
    priority: activity.priority as ApiPriority,
    summary: activity.summary || null,
    result: activity.result || null,
    reminderAt: activity.reminder && activity.reminder.includes("-") ? activity.reminder : null,
    ownerId: activity.ownerId ?? null,
  };
}

/** The client detail page shows a channel-based history: activities cover it. */
const CHANNEL_BY_TYPE: Record<string, HistoryChannel> = {
  call: "call",
  email: "email",
  whatsapp: "whatsapp",
  meeting: "meeting",
  visit: "visit",
};

export function toClientEvent(activity: Activity): ClientEvent {
  const scheduled = parseUiDate(activity.date);
  const isPast = activity.status === "terminé" || (scheduled ? scheduled.getTime() < Date.now() : false);
  return {
    id: `evt_${activity.id}`,
    channel: CHANNEL_BY_TYPE[activity.type] ?? "note",
    title: activity.title,
    client: activity.client,
    owner: activity.owner,
    date: activity.date,
    time: activity.time,
    direction: isPast ? "past" : "upcoming",
    summary: activity.summary,
  };
}

/* -------------------- projects -------------------- */

export function toProject(api: ApiProject, tasks: ApiProjectTask[]): Project {
  return {
    id: String(api.id),
    name: api.name,
    client: api.clientName,
    clientId: api.clientId,
    owner: api.ownerName,
    ownerId: api.ownerId,
    start: api.startDate,
    end: api.endDate ?? "",
    progress: api.progress,
    status: api.status,
    team: api.teamMembers.map((m) => initialsOf(m.name)),
    teamIds: api.teamMembers.map((m) => m.id),
    tasks: tasks.map(toProjectTask),
  };
}

export function toProjectPayload(project: Project, clientId: number): ProjectPayload {
  return {
    name: project.name,
    clientId,
    startDate: toApiDate(project.start) ?? isoDay(new Date()),
    endDate: toApiDate(project.end),
    progress: Number(project.progress) || 0,
    status: project.status,
    teamMemberIds: project.teamIds ?? [],
    ownerId: project.ownerId ?? null,
  };
}

export function toProjectTask(api: ApiProjectTask): ProjectTask {
  return {
    id: String(api.id),
    label: api.label,
    status: api.status,
    assignee: api.assigneeName ? initialsOf(api.assigneeName) : "",
    assigneeId: api.assigneeId ?? undefined,
    due: api.dueDate ?? "",
    priority: api.priority,
    description: api.description ?? undefined,
  };
}

export function toProjectTaskPayload(task: ProjectTask): ProjectTaskPayload {
  return {
    label: task.label,
    status: task.status,
    assigneeId: task.assigneeId ?? null,
    dueDate: toApiDate(task.due),
    priority: (task.priority ?? "medium") as ApiPriority,
    description: task.description || null,
  };
}

/* -------------------- users (UI: "members") -------------------- */

const ROLE_LABELS: Record<ApiRole, Member["role"]> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};

const ROLE_SLUGS: Record<Member["role"], ApiRole> = {
  Administrateur: "admin",
  Manager: "manager",
  Commercial: "commercial",
};

const STATUS_LABELS: Record<string, Member["status"]> = {
  active: "Actif",
  invited: "Invité",
  disabled: "Désactivé",
};

export function roleSlug(label: Member["role"]): ApiRole {
  return ROLE_SLUGS[label] ?? "commercial";
}

export function toMember(api: ApiUser): Member {
  return {
    id: String(api.id),
    name: api.fullName,
    role: ROLE_LABELS[api.role] ?? "Commercial",
    email: api.email,
    phone: api.phone ?? "",
    team: api.team ?? "Non assigné",
    status: STATUS_LABELS[api.status] ?? "Actif",
    initials: initialsOf(api.fullName),
    lastActive: api.status === "invited" ? "Jamais" : "—",
    photo: api.photo ?? undefined,
    firstName: api.firstName,
    lastName: api.lastName,
  };
}
