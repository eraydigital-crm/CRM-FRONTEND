import seedData from "@/data/crm-seed.json";

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
  status: ClientStatus;
  priority: Priority;
  tags: string[];
  value: number;
  lastContact: string;
  initials: string;
  color: string;
};

export const clients = seedData.clients as Client[];
export const kpis = seedData.kpis;

export type Activity = {
  id: string;
  type: "call" | "meeting" | "email" | "quote" | "contract" | "visit" | "note" | "follow-up" | "task" | "whatsapp";
  title: string;
  client: string;
  owner: string;
  date: string;
  time: string;
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
  date: string; // ex. "08/07/2026"
  time: string; // ex. "14:30"
  direction: "past" | "upcoming";
  summary?: string;
};

export const clientEvents = seedData.clientEvents as ClientEvent[];

export function eventsForClient(name: string) {
  const list = clientEvents.filter((e) => e.client === name);
  return {
    past: list.filter((e) => e.direction === "past"),
    upcoming: list.filter((e) => e.direction === "upcoming"),
    all: list,
  };
}

export function clientHistorySummary(name: string) {
  const { past, upcoming } = eventsForClient(name);
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

export const activities = seedData.activities as Activity[];

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

export type Deal = {
  id: string;
  client: string;
  company: string;
  amount: number;
  probability: number;
  owner: string;
  lastActivity: string;
  nextAction: string;
  closeDate: string;
  stage: Stage;
};

export const deals = seedData.deals as Deal[];

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

export type TaskStatus = "À faire" | "En cours" | "Terminé" | "En retard";
export type ProjectTask = { id: string; label: string; status: TaskStatus; assignee: string; due: string };

export type Project = {
  id: string;
  name: string;
  client: string;
  owner: string;
  start: string;
  end: string;
  progress: number;
  status: "En cours" | "En attente" | "Suspendu" | "Terminé";
  team: string[]; // initials
  tasks: ProjectTask[];
};

export const projects = seedData.projects as Project[];

export function projectsForCompany(company: string): Project[] {
  const c = company.toLowerCase();
  return projects.filter(
    (p) => c.includes(p.client.toLowerCase()) || p.client.toLowerCase().includes(c),
  );
}

export function projectForCompany(company: string): Project | undefined {
  return projectsForCompany(company)[0];
}

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
};

export const members = seedData.members as Member[];
export const revenueSeries = seedData.revenueSeries;
