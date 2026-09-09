import { Plus, Bell, Mail, MessageSquare, Laptop } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";
import { useState } from "react";
import { useCRM } from "@/lib/store";
import type { Stage, Activity } from "@/lib/crm-data";

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

type Props = {
  trigger?: ReactNode;
  defaultClient?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd?: (activity: any) => void;
};

export function NewActivityDialog({ trigger, defaultClient, open, onOpenChange, onAdd }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState("Appel");
  const { activities, setActivities, clients, members, currentUser } = useCRM();

  const [reminderPreset, setReminderPreset] = useState("Aucun");
  const [customVal, setCustomVal] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");
  const [customChannels, setCustomChannels] = useState<string[]>(["notification"]);
  
  const isOpen = open ?? internalOpen;
  const setOpen = (o: boolean) => {
    setInternalOpen(o);
    onOpenChange?.(o);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const typeMapping: Record<string, Activity["type"]> = {
      "Appel": "call",
      "RDV": "meeting",
      "Email": "email",
      "Note": "note",
      "Tâche": "task"
    };

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

    const clientId = fd.get("clientId")?.toString();
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      toast.error("Client requis", { description: "Sélectionnez le client concerné." });
      return;
    }
    const ownerId = fd.get("ownerId")?.toString();
    const owner = members.find((m) => m.id === ownerId);

    const newAct: Activity = {
      id: `act_${Date.now()}`,
      type: typeMapping[type] || "call",
      title: fd.get("title")?.toString() || "Nouvelle activité",
      client: client.name,
      clientId: Number(client.id),
      owner: owner?.name ?? currentUser?.fullName ?? "",
      ownerId: owner ? Number(owner.id) : currentUser?.id,
      date: fd.get("date")?.toString() || today,
      time: fd.get("time")?.toString() || "09:00",
      status: "à faire",
      priority: "medium",
      summary: fd.get("notes")?.toString() || "",
      reminder: reminderText !== "Aucun" ? reminderText : undefined,
    };

    setActivities([newAct, ...activities]);
    onAdd?.(newAct);

    setOpen(false);
    toast.success("Activité créée", { description: `"${newAct.title}" a été planifiée avec ${client.name}.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-1" /> Nouvelle activité
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une activité</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 mt-2"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
            <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {["Appel", "RDV", "Email", "Note", "Tâche"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-9 rounded-lg border text-xs font-medium transition ${
                    type === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Titre</label>
            <input
              name="title"
              required
              className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none"
              placeholder="Ex : Appel de qualification"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Client</label>
              <select
                name="clientId"
                required
                className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none focus:border-ring bg-card"
                defaultValue={clients.find((c) => c.name === defaultClient)?.id ?? ""}
              >
                <option value="" disabled>Sélectionnez un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Responsable</label>
              <select
                name="ownerId"
                className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none focus:border-ring bg-card"
                defaultValue={currentUser ? String(currentUser.id) : ""}
              >
                {members
                  .filter((m) => m.status !== "Désactivé")
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Date</label>
              <input
                name="date"
                type="date"
                defaultValue={today}
                className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Heure</label>
              <input
                name="time"
                type="time"
                className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none focus:border-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Bell className="h-3.5 w-3.5 text-primary" /> Rappel
            </label>
            <select
              value={reminderPreset}
              onChange={(e) => setReminderPreset(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none bg-card focus:border-ring"
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
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Notes</label>
            <textarea
              name="notes"
              className="mt-1.5 w-full min-h-[80px] rounded-lg border border-input p-3 text-sm outline-none focus:border-ring"
              placeholder="Résumé…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-brand text-white border-0">Créer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
