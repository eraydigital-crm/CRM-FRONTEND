import { Plus, Bell, Mail, MessageSquare, Laptop } from "lucide-react";

const REMINDER_PRESETS = [
  { value: "Aucun", label: "Aucun" },
  { value: "0 min", label: "Au moment de l'événement" },
  { value: "5 min avant", label: "5 minutes avant" },
  { value: "10 min avant", label: "10 minutes avant" },
  { value: "15 min avant", label: "15 minutes avant" },
  { value: "30 min avant", label: "30 minutes avant" },
  { value: "1 h avant", label: "1 heure avant" },
  { value: "2 h avant", label: "2 heures avant" },
  { value: "1 jour avant", label: "1 jour avant" },
  { value: "2 jours avant", label: "2 jours avant" },
  { value: "1 semaine avant", label: "1 semaine avant" },
  { value: "custom", label: "Personnalisé…" },
];
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ReactNode, FormEvent } from "react";
import { useState } from "react";
import { useCRM } from "@/lib/store";
import type { Activity, Stage, Client, Project, Deal, ClientEvent } from "@/lib/crm-data";

type BaseProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onAdd?: (data: any) => void;
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-card";
const selectCls = inputCls;
const textareaCls =
  "w-full min-h-[80px] rounded-lg border border-input p-3 text-sm focus:border-ring outline-none bg-card";

/* -------------------- NEW CLIENT -------------------- */
export function NewClientDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { clients, setClients } = useCRM();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const firstName = fd.get("firstName")?.toString().trim() || "Nouveau";
    const lastName = fd.get("lastName")?.toString().trim() || "Client";
    const fullName = `${firstName} ${lastName}`;
    
    const newClient: Client = {
      id: `c_${Date.now()}`,
      name: fullName,
      company: fd.get("company")?.toString() || "Entreprise Inconnue",
      role: fd.get("role")?.toString() || "Contact",
      email: fd.get("email")?.toString() || "contact@client.com",
      phone: fd.get("phone")?.toString() || "+33 6 00 00 00 00",
      status: (fd.get("status")?.toString() as any) || "prospect",
      priority: (fd.get("priority")?.toString() as any) || "medium",
      owner: fd.get("owner")?.toString() || "Léa Martin",
      city: fd.get("address")?.toString() || "Paris",
      sector: "B2B Services",
      value: Number(fd.get("value")) || 0,
      tags: ["Nouveau"],
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      color: "from-blue-500 to-indigo-600",
      lastContact: "Aujourd'hui"
    };

    setClients([newClient, ...clients]);
    props.onAdd?.(newClient);
    setOpen(false);
    toast.success("Client créé avec succès", { description: `${fullName} a été ajouté à la base de données.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom"><input name="firstName" className={inputCls} required placeholder="Jean" /></Field>
            <Field label="Nom"><input name="lastName" className={inputCls} required placeholder="Dupont" /></Field>
            <Field label="Entreprise"><input name="company" className={inputCls} placeholder="Ex: TechCorp" required /></Field>
            <Field label="Fonction"><input name="role" className={inputCls} placeholder="Ex : Directeur Informatique" /></Field>
            <Field label="Email"><input name="email" type="email" className={inputCls} placeholder="jean.dupont@techcorp.com" required /></Field>
            <Field label="Téléphone"><input name="phone" className={inputCls} placeholder="+33 6 12 34 56 78" /></Field>
            <Field label="Statut">
              <select name="status" className={selectCls} defaultValue="prospect">
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="vip">VIP</option>
                <option value="inactif">Inactif</option>
              </select>
            </Field>
            <Field label="Priorité">
              <select name="priority" className={selectCls} defaultValue="medium">
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </Field>
            <Field label="Valeur estimée (MGA)">
              <input name="value" type="number" className={inputCls} placeholder="0" defaultValue="25000" />
            </Field>
            <Field label="Responsable">
              <input name="owner" className={inputCls} defaultValue="Léa Martin" />
            </Field>
            <Field label="Adresse / Ville" className="col-span-2">
              <input name="address" className={inputCls} placeholder="Paris, France" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-brand text-white border-0">Créer le client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW PROJECT -------------------- */
export function NewProjectDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { projects, setProjects } = useCRM();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };
  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const projectName = fd.get("name")?.toString().trim() || "Nouveau projet";
    const clientName = fd.get("client")?.toString().trim() || "Client général";

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: projectName,
      client: clientName,
      owner: fd.get("owner")?.toString() || "Léa Martin",
      start: fd.get("start")?.toString() || today,
      end: fd.get("end")?.toString() || "2026-12-31",
      progress: 0,
      status: (fd.get("status")?.toString() as any) || "En cours",
      team: ["LM", "AR"],
      tasks: [
        { id: `t_${Date.now()}_1`, label: "Cadrage du projet", status: "Terminé", assignee: "LM", due: today },
        { id: `t_${Date.now()}_2`, label: "Spécifications fonctionnelles", status: "En cours", assignee: "AR", due: "2026-08-20" },
      ]
    };

    setProjects([newProject, ...projects]);
    props.onAdd?.(newProject);
    setOpen(false);
    toast.success("Projet créé", { description: `Le projet "${projectName}" est désormais actif.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Nom du projet"><input name="name" className={inputCls} required placeholder="Ex : Refonte du portail web" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><input name="client" className={inputCls} placeholder="Société ou client..." required /></Field>
            <Field label="Chef de projet"><input name="owner" className={inputCls} defaultValue="Léa Martin" /></Field>
            <Field label="Date de début"><input name="start" type="date" className={inputCls} defaultValue={today} /></Field>
            <Field label="Date de fin estimée"><input name="end" type="date" className={inputCls} defaultValue="2026-12-31" /></Field>
            <Field label="Statut" className="col-span-2">
              <select name="status" className={selectCls} defaultValue="En cours">
                <option value="En cours">En cours</option>
                <option value="En attente">En attente</option>
                <option value="Suspendu">Suspendu</option>
                <option value="Terminé">Terminé</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-brand text-white border-0">Créer le projet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW OPPORTUNITY -------------------- */
const stagesList: Stage[] = [
  "Nouveau lead", "Premier contact", "Qualification", "Rendez-vous planifié",
  "Analyse des besoins", "Démonstration", "Devis envoyé", "Négociation",
  "Relance 1", "Relance 2", "Relance finale", "Contrat signé", "Vente gagnée", "Vente perdue", "Ambassadeur",
];

export function NewOpportunityDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { deals, setDeals } = useCRM();
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientName = fd.get("client")?.toString().trim() || "Nouveau Lead";
    const companyName = fd.get("company")?.toString().trim() || "Société Inconnue";
    const amountVal = Number(fd.get("amount")) || 15000;

    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      client: clientName,
      company: companyName,
      amount: amountVal,
      probability: Number(fd.get("probability")) || 50,
      owner: fd.get("owner")?.toString() || "Léa Martin",
      lastActivity: "Création opportunité",
      nextAction: "Rendez-vous de découverte",
      closeDate: fd.get("closeDate")?.toString() || "15/09/2026",
      stage: (fd.get("stage")?.toString() as Stage) || "Nouveau lead",
    };

    setDeals([newDeal, ...deals]);
    props.onAdd?.(newDeal);
    setOpen(false);
    toast.success("Opportunité créée", { description: `L'opportunité de ${amountVal.toLocaleString("fr")} MGA a été ajoutée au pipeline.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Opportunité
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer une opportunité</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du client / contact"><input name="client" className={inputCls} required placeholder="Ex : Sophie Laurent" /></Field>
            <Field label="Entreprise"><input name="company" className={inputCls} required placeholder="Ex : Acme SAS" /></Field>
            <Field label="Montant potentiel (MGA)"><input name="amount" type="number" className={inputCls} placeholder="50000" required defaultValue="45000" /></Field>
            <Field label="Probabilité (%)"><input name="probability" type="number" min={0} max={100} className={inputCls} defaultValue={50} /></Field>
            <Field label="Responsable"><input name="owner" className={inputCls} defaultValue="Léa Martin" /></Field>
            <Field label="Étape du pipeline">
              <select name="stage" className={selectCls} defaultValue="Nouveau lead">
                {stagesList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Date de clôture prévue" className="col-span-2">
              <input name="closeDate" className={inputCls} defaultValue="15/09/2026" placeholder="JJ/MM/AAAA" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-brand text-white border-0">Créer l'opportunité</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- NEW EVENT -------------------- */
export function NewEventDialog(props: BaseProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    props.onOpenChange?.(o);
  };

  const [type, setType] = useState("Rendez-vous");
  const { activities, setActivities, deals, setDeals, clientEvents, setClientEvents } = useCRM();
  const today = new Date().toISOString().slice(0, 10);

  const [reminderPreset, setReminderPreset] = useState("Aucun");
  const [customVal, setCustomVal] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");
  const [customChannels, setCustomChannels] = useState<string[]>(["notification"]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const typeMapping: Record<string, Activity["type"]> = {
      "Appel": "call",
      "Rendez-vous": "meeting",
      "Relance": "follow-up",
      "Tâche": "task"
    };

    const clientName = fd.get("client")?.toString().trim() || "Client commercial";
    const titleText = fd.get("title")?.toString().trim() || "Nouvel événement";
    const eventTime = fd.get("time")?.toString() || "10:00";
    const eventDate = fd.get("date")?.toString() || today;

    let reminderText = reminderPreset;
    if (reminderPreset === "custom") {
      const channelLabels = customChannels.map(c => {
        if (c === "notification") return "Notification UI";
        if (c === "email") return "Email";
        if (c === "sms") return "SMS";
        return c;
      }).join(" & ");
      
      const unitLabel = customUnit === "minutes" ? "min" : customUnit === "heures" ? "h" : customUnit === "jours" ? "j" : "sem.";
      reminderText = `${customVal} ${unitLabel} avant (${channelLabels})`;
    }

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: typeMapping[type] || "meeting",
      title: titleText,
      client: clientName,
      owner: "Léa Martin",
      date: eventDate,
      time: eventTime,
      duration: fd.get("duration")?.toString() || "1 heure",
      status: "planifié",
      priority: "medium",
      summary: fd.get("notes")?.toString() || "",
      reminder: reminderText !== "Aucun" ? reminderText : undefined,
    };

    setActivities([newAct, ...activities]);

    const newEventItem: ClientEvent = {
      id: `ce_${Date.now()}`,
      channel: (typeMapping[type] === "call" ? "call" : typeMapping[type] === "meeting" ? "meeting" : "note") as any,
      title: titleText,
      client: clientName,
      owner: "Léa Martin",
      date: eventDate,
      time: eventTime,
      direction: "upcoming",
      summary: fd.get("notes")?.toString() || ""
    };
    setClientEvents([newEventItem, ...clientEvents]);

    props.onAdd?.(newAct);
    setOpen(false);
    toast.success("Événement ajouté au calendrier", {
      description: `L'événement "${titleText}" avec ${clientName} a été planifié.`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0 h-9">
            <Plus className="h-4 w-4 mr-1" /> Événement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un événement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Type d'action">
            <div className="grid grid-cols-4 gap-1.5">
              {["Appel", "Rendez-vous", "Relance", "Tâche"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-9 rounded-lg border text-xs font-medium transition ${
                    type === t 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Titre de la réunion / action">
            <input name="title" className={inputCls} required placeholder="Ex : Démo commerciale & Présentation" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client / Prospect">
              <input name="client" className={inputCls} placeholder="Nom du client" required />
            </Field>
            <Field label="Durée">
              <select name="duration" className={selectCls} defaultValue="1 heure">
                <option value="30 min">30 min</option>
                <option value="1 heure">1 heure</option>
                <option value="1 h 30">1 h 30</option>
                <option value="2 heures">2 heures</option>
              </select>
            </Field>
            <Field label="Date">
              <input name="date" type="date" className={inputCls} defaultValue={today} required />
            </Field>
            <Field label="Heure">
              <input name="time" type="time" className={inputCls} defaultValue="10:00" required />
            </Field>
          </div>
          <div className="border-t border-border/60 my-2 pt-3">
            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" /> Rappel
            </label>
            <select
              value={reminderPreset}
              onChange={(e) => setReminderPreset(e.target.value)}
              className={selectCls}
            >
              {REMINDER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            {reminderPreset === "custom" && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Valeur</label>
                    <input
                      type="number"
                      min="1"
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input px-2 text-sm outline-none focus:border-ring bg-card"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Unité</label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="mt-1 w-full h-9 rounded-md border border-input px-2 text-sm outline-none focus:border-ring bg-card"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="heures">Heures</option>
                      <option value="jours">Jours</option>
                      <option value="semaines">Semaines</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                    Canaux de rappel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "notification", label: "In-App", icon: Laptop },
                      { id: "email", label: "Email", icon: Mail },
                      { id: "sms", label: "SMS", icon: MessageSquare },
                    ].map((channel) => {
                      const Icon = channel.icon;
                      const active = customChannels.includes(channel.id);
                      return (
                        <button
                          type="button"
                          key={channel.id}
                          onClick={() => {
                            if (active) {
                              setCustomChannels(customChannels.filter((c) => c !== channel.id));
                            } else {
                              setCustomChannels([...customChannels, channel.id]);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition ${
                            active
                              ? "border-primary bg-primary/10 text-primary border-primary/30"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {channel.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Field label="Notes / Ordre du jour">
            <textarea name="notes" className={textareaCls} placeholder="Objectifs de l'échange..." />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-brand text-white border-0">Créer l'événement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

