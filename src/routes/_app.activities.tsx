import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useFilteredCollection } from "@/hooks/use-filtered-collection";
import { useVirtualizer } from "@/hooks/use-virtualizer";
import {
  Filter, Search, MoreHorizontal, Calendar as CalendarIcon,
  Eye, Edit, Trash2, X, CheckCircle2, Clock, AlertCircle,
  Lock, Loader2, ArrowRight, Plus, HelpCircle, RefreshCw,
  Shield, User, Briefcase, Bell, Mail, MessageSquare, Laptop
} from "lucide-react";
import { useCRM } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActivityIcon, StatusBadge, PriorityDot } from "@/components/crm-atoms";
import { NewActivityDialog } from "@/components/new-activity-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import type { Activity } from "@/lib/crm-data";

const types = ["Toutes", "Appel", "Rendez-vous", "Email", "Devis", "Contrat", "Visite", "Note", "Relance", "Tâche"];
const typeMap: Record<string, string> = {
  Appel: "call",
  "Rendez-vous": "meeting",
  Email: "email",
  Devis: "quote",
  Contrat: "contract",
  Visite: "visit",
  Note: "note",
  Relance: "follow-up",
  Tâche: "task",
};

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

const dateFilters = ["Toutes dates", "Aujourd'hui", "Demain", "Hier", "Cette semaine", "À venir"] as const;
type DateFilter = (typeof dateFilters)[number];

const ROW_HEIGHT = 108;

function getAbsoluteDate(dateStr: string): Date {
  const now = new Date();
  if (dateStr === "Aujourd'hui") {
    return now;
  }
  if (dateStr === "Demain") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (dateStr === "Hier") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (dateStr === "Il y a 2 j") {
    const d = new Date(now);
    d.setDate(d.getDate() - 2);
    return d;
  }
  const parsed = new Date(dateStr + "T00:00:00");
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return now;
}

function getActivityDateTime(dateStr: string, timeStr: string): Date {
  const dateObj = getAbsoluteDate(dateStr);
  const [hrs, mins] = timeStr.split(":").map(Number);
  const target = new Date(dateObj);
  target.setHours(hrs || 0, mins || 0, 0, 0);
  return target;
}

function getDayDiff(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = getAbsoluteDate(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function isGroupVisible(dateStr: string, stage: "today_tomorrow" | "this_week" | "all"): boolean {
  const diff = getDayDiff(dateStr);
  if (stage === "today_tomorrow") {
    return diff === 0 || diff === 1;
  }
  if (stage === "this_week") {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const target = getAbsoluteDate(dateStr);
    return target >= startOfWeek && target <= endOfWeek;
  }
  return true;
}

function isSameDay(a: Date | null, b: Date | null) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function matchesDate(date: string, filter: DateFilter, customDate?: string): boolean {
  if (customDate) {
    const activityDate = getAbsoluteDate(date);
    const selectedDate = getAbsoluteDate(customDate);
    return isSameDay(activityDate, selectedDate);
  }
  const activityDate = getAbsoluteDate(date);
  if (filter === "Toutes dates") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (filter === "Aujourd'hui") return isSameDay(activityDate, today);
  if (filter === "Demain") {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return isSameDay(activityDate, tomorrow);
  }
  if (filter === "Hier") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(activityDate, yesterday);
  }
  if (filter === "Cette semaine") {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return activityDate >= start && activityDate <= end;
  }
  if (filter === "À venir") return activityDate >= today;
  return true;
}

export default function ActivitiesPage() {
  usePageMeta("Activités — Eray CRM", "Suivez toutes les activités commerciales sur une timeline.");

  const parentRef = useRef<HTMLDivElement>(null);
  const { activities: activityList, setActivities: setActivityList, currentUser: sessionUser } = useCRM();

  const [dateFilter, setDateFilter] = useState<DateFilter>("Toutes dates");
  const [customDate, setCustomDate] = useState<string>("");
  const [active, setActive] = useState("Toutes");
  const [selectedAct, setSelectedAct] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"details" | "edit" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [activeSmartFilter, setActiveSmartFilter] = useState<"none" | "overdue" | "blocked" | "soon">("none");
  // The signed-in user, straight from /api/me - the API scopes the data anyway.
  const currentUser = {
    name: sessionUser?.fullName ?? "—",
    role: (sessionUser?.role === "admin" || sessionUser?.role === "manager" ? "manager" : "commercial") as
      | "manager"
      | "commercial",
  };
  const [tick, setTick] = useState(0);
  const [visibleStage, setVisibleStage] = useState<"today_tomorrow" | "this_week" | "all">("today_tomorrow");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [foldedGroups, setFoldedGroups] = useState<Record<string, boolean>>({});
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; field: "title" | "time" | "owner" } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingField, setSavingField] = useState<{ id: string; field: string } | null>(null);
  const [workflowParent, setWorkflowParent] = useState<any | null>(null);
  const [workflowActionType, setWorkflowActionType] = useState<"relance" | "rdv" | "devis" | "note" | "demo" | null>(null);
  const [workflowTitle, setWorkflowTitle] = useState("");
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [workflowDate, setWorkflowDate] = useState("");
  const [workflowTime, setWorkflowTime] = useState("");

  const [reminderPreset, setReminderPreset] = useState("Aucun");
  const [customVal, setCustomVal] = useState("15");
  const [customUnit, setCustomUnit] = useState("minutes");
  const [customChannels, setCustomChannels] = useState<string[]>(["notification"]);

  useEffect(() => {
    if (dialogType === "edit" && selectedAct) {
      const rem = selectedAct.reminder;
      if (!rem) {
        setReminderPreset("Aucun");
      } else {
        const isPreset = REMINDER_PRESETS.some(p => p.value === rem);
        if (isPreset) {
          setReminderPreset(rem);
        } else {
          setReminderPreset("custom");
          const valMatch = rem.match(/^(\d+)\s+(min|h|j|sem\.)/);
          if (valMatch) {
            setCustomVal(valMatch[1]);
            const u = valMatch[2];
            setCustomUnit(u === "min" ? "minutes" : u === "h" ? "heures" : u === "j" ? "jours" : "semaines");
          }
          const channels: string[] = [];
          if (rem.includes("Notification UI")) channels.push("notification");
          if (rem.includes("Email")) channels.push("email");
          if (rem.includes("SMS")) channels.push("sms");
          if (channels.length > 0) {
            setCustomChannels(channels);
          }
        }
      }
    }
  }, [dialogType, selectedAct?.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const canEditActivity = (activity: any) => {
    return currentUser.role === "manager" || activity.owner === currentUser.name;
  };

  const getCountdownInfo = (dateStr: string, timeStr: string, status: string) => {
    if (status === "terminé") return null;

    const targetDate = getActivityDateTime(dateStr, timeStr);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) {
        return { text: `En retard de ${absMins} min`, type: "overdue" };
      } else {
        const hrs = Math.floor(absMins / 60);
        const remainingMins = absMins % 60;
        return { text: `En retard de ${hrs}h ${remainingMins}m`, type: "overdue" };
      }
    } else if (diffMins <= 60) {
      return { text: `Dans ${diffMins} min`, type: "soon" };
    } else {
      const targetDateOnly = targetDate.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowDateOnly = tomorrow.toDateString();

      if (dateStr === "Demain" || targetDateOnly === tomorrowDateOnly) {
        return { text: "J+1", type: "tomorrow" };
      }
    }
    return null;
  };

  const filters = useMemo(() => [
    (a: any) => active === "Toutes" || a.type === typeMap[active],
    (a: any) => matchesDate(a.date, dateFilter, customDate),
    (a: any) => !selectedStatus || a.status === selectedStatus,
    (a: any) => !selectedPriority || a.priority === selectedPriority,
    (a: any) => !selectedOwner || a.owner === selectedOwner,
    (a: any) => {
      if (activeSmartFilter === "overdue") {
        let isOverdue = a.status === "en retard";
        if (a.status !== "terminé") {
          const info = getCountdownInfo(a.date, a.time, a.status);
          if (info?.type === "overdue") {
            isOverdue = true;
          }
        }
        return isOverdue;
      } else if (activeSmartFilter === "blocked") {
        return Boolean(a.blocked);
      } else if (activeSmartFilter === "soon") {
        let isSoon = false;
        if (a.status !== "terminé") {
          const info = getCountdownInfo(a.date, a.time, a.status);
          if (info?.type === "soon") {
            isSoon = true;
          }
        }
        return isSoon;
      }
      return true;
    }
  ], [active, dateFilter, customDate, selectedStatus, selectedPriority, selectedOwner, activeSmartFilter, tick]);

  const searchFields = useMemo(() => ["title" as const, "client" as const, "owner" as const, "summary" as const], []);

  const filtered = useFilteredCollection(activityList, {
    search: debouncedSearchQuery,
    searchFields,
    filters,
  });

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const groupedAndLazyFiltered = useMemo(() => {
    const res: Record<string, typeof activityList> = {};
    filtered.forEach((a) => {
      if (isGroupVisible(a.date, visibleStage)) {
        (res[a.date] ||= []).push(a);
      }
    });
    return res;
  }, [filtered, visibleStage]);

  useEffect(() => {
    if (visibleStage === "all") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleStage((prev) => {
              if (prev === "today_tomorrow") return "this_week";
              return "all";
            });
            setIsLoadingMore(false);
            toast.success("Timeline étendue", {
              description: "Chargement de la suite de la timeline effectuée.",
            });
          }, 800);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [visibleStage, isLoadingMore]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleStage((prev) => {
        if (prev === "today_tomorrow") return "this_week";
        return "all";
      });
      setIsLoadingMore(false);
      toast.success("Timeline étendue", {
        description: "Chargement de la suite de la timeline effectuée.",
      });
    }, 400);
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    if (filter !== "Toutes dates") {
      setCustomDate("");
    }
  };

  const handleCustomDateChange = (value: string) => {
    setCustomDate(value);
    if (value) {
      setDateFilter("Toutes dates");
    }
  };

  const handleDelete = (id: string) => {
    const act = activityList.find((a) => a.id === id);
    if (!act) return;
    if (!canEditActivity(act)) {
      toast.error("Accès refusé", { description: "Seul l'utilisateur assigné ou un manager peut supprimer cette activité." });
      return;
    }
    const updated = activityList.filter((a) => a.id !== id);
    setActivityList(updated);
    toast.success("Activité supprimée");
  };

  const handleEditSave = () => {
    if (selectedAct) {
      if (!canEditActivity(selectedAct)) {
        toast.error("Accès refusé", { description: "Seul l'utilisateur assigné ou un manager peut modifier cette activité." });
        return;
      }
      
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
      
      const finalReminder = reminderText !== "Aucun" ? reminderText : undefined;
      const actToSave = { ...selectedAct, reminder: finalReminder };

      const updated = activityList.map((a) => (a.id === selectedAct.id ? actToSave : a));
      setActivityList(updated);
      setDialogType(null);
      setSelectedAct(null);
      toast.success("Activité modifiée");
    }
  };

  const handleToggleStatus = (id: string, newStatus: "terminé" | "à faire" | "planifié") => {
    const act = activityList.find((a) => a.id === id);
    if (!act) return;
    if (!canEditActivity(act)) {
      toast.error("Accès refusé", {
        description: "Seul l'utilisateur assigné ou un manager peut modifier le statut de cette activité.",
      });
      return;
    }
    const updated = activityList.map((a) =>
      a.id === id ? { ...a, status: newStatus, result: newStatus === "terminé" ? "Complété" : undefined } : a
    );
    setActivityList(updated);
    toast.success(`Statut mis à jour : ${newStatus}`);
    if (newStatus === "terminé") {
      setTimeout(() => {
        setWorkflowParent(act);
      }, 100);
    }
  };

  const handleDropTarget = async (id: string, dropType: "terminé" | "à faire" | "demain" | "cette_semaine") => {
    const act = activityList.find((a) => a.id === id);
    if (!act) return;
    if (!canEditActivity(act)) {
      toast.error("Accès refusé", {
        description: "Seul l'utilisateur assigné ou un manager peut déplacer cette activité.",
      });
      return;
    }
    toast.loading("Mise à jour via API (PATCH)...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.dismiss();

    let updatedAct = { ...act };
    if (dropType === "terminé") {
      updatedAct.status = "terminé";
      updatedAct.result = "Complété via Glisser-déposer";
      setTimeout(() => {
        setWorkflowParent(act);
      }, 100);
    } else if (dropType === "à faire") {
      updatedAct.status = "à faire";
    } else if (dropType === "demain") {
      updatedAct.date = "Demain";
    } else if (dropType === "cette_semaine") {
      updatedAct.date = "Aujourd'hui";
    }

    const updated = activityList.map((a) => (a.id === id ? updatedAct : a));
    setActivityList(updated);
    toast.success("Activité mise à jour avec succès");
  };

  const handleDoubleClick = (activity: any, field: "title" | "time" | "owner", currentValue: string) => {
    if (!canEditActivity(activity)) {
      toast.error("Accès refusé", {
        description: "Seul l'utilisateur assigné ou un manager peut éditer ce champ.",
      });
      return;
    }
    setEditingField({ id: activity.id, field });
    setEditingValue(currentValue);
  };

  const handleSaveInline = async (id: string, field: "title" | "time" | "owner", explicitVal?: string) => {
    const val = explicitVal ?? editingValue;
    setEditingField(null);
    setSavingField({ id, field });
    await new Promise((resolve) => setTimeout(resolve, 600));
    const updated = activityList.map((a) => (a.id === id ? { ...a, [field]: val } : a));
    setActivityList(updated);
    setSavingField(null);
    toast.success("Modification enregistrée", {
      description: "Le champ a été enregistré.",
    });
  };

  const handleSelectWorkflowAction = (action: "relance" | "rdv" | "devis" | "note" | "demo") => {
    setWorkflowActionType(action);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    if (action === "demo") {
      setWorkflowTitle(`Rendez-vous démo — ${workflowParent.client}`);
      setWorkflowNotes(`Faire une démo du produit suite à l'appel de qualification.`);
      setWorkflowDate(tomorrowStr);
      setWorkflowTime("10:00");
    } else if (action === "relance") {
      setWorkflowTitle(`Relance devis — ${workflowParent.client}`);
      setWorkflowNotes(`Recontacter suite à la complétion de : "${workflowParent.title}"`);
      setWorkflowDate(tomorrowStr);
      setWorkflowTime("09:30");
    } else if (action === "rdv") {
      setWorkflowTitle(`Rendez-vous client — ${workflowParent.client}`);
      setWorkflowNotes(`Rendez-vous de suivi.`);
      setWorkflowDate(tomorrowStr);
      setWorkflowTime("14:00");
    } else if (action === "devis") {
      setWorkflowTitle(`Envoyer le devis — ${workflowParent.client}`);
      setWorkflowNotes(`Préparer et envoyer le devis.`);
      setWorkflowDate(tomorrowStr);
      setWorkflowTime("11:00");
    } else if (action === "note") {
      setWorkflowTitle(`Note interne — ${workflowParent.client}`);
      setWorkflowNotes(`Note relative à la réunion.`);
      setWorkflowDate(new Date().toISOString().slice(0, 10));
      setWorkflowTime("17:00");
    }
  };

  const handleCreateWorkflowActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowParent || !workflowActionType) return;

    const actionTypeMap: Record<string, Activity["type"]> = {
      relance: "follow-up",
      rdv: "meeting",
      devis: "quote",
      note: "note",
      demo: "meeting",
    };

    const newAct: any = {
      id: `act_wf_${Date.now()}`,
      type: actionTypeMap[workflowActionType] || "task",
      title: workflowTitle,
      client: workflowParent.client,
      owner: currentUser.name,
      date: workflowDate,
      time: workflowTime,
      status: "à faire",
      priority: "medium",
      summary: workflowNotes,
    };

    setActivityList([newAct, ...activityList]);

    toast.success("Chaînage d'activité réussi", {
      description: `L'activité "${workflowTitle}" a été insérée au sommet de la timeline.`,
    });

    setWorkflowParent(null);
    setWorkflowActionType(null);
  };

  const toggleFoldGroup = (date: string) => {
    setFoldedGroups((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Activités</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centre de commande interactif de toutes vos actions commerciales en temps réel
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <UserIconRole user={currentUser} />
            <span className="text-xs font-semibold text-foreground">
              {currentUser.name} ({currentUser.role === "manager" ? "Manager" : "Commercial"})
            </span>
          </div>
          <NewActivityDialog />
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              active === t
                ? "gradient-brand text-white shadow-elegant"
                : "bg-muted/60 text-foreground/70 hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher live (300ms)..."
              className="h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm w-56"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Filtres
                {(selectedStatus || selectedPriority || selectedOwner) && (
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 space-y-3 bg-card border border-border rounded-lg shadow-xl z-50">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground">Filtres avancés</div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Statut</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Tous les statuts</option>
                  <option value="planifié">Planifié</option>
                  <option value="terminé">Terminé</option>
                  <option value="en retard">En retard</option>
                  <option value="à faire">À faire</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Priorité</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Toutes les priorités</option>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Responsable</label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full h-8 rounded-md border border-input px-2 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
                >
                  <option value="">Tous les responsables</option>
                  {Array.from(new Set(activityList.map(a => a.owner))).map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </div>
              {(selectedStatus || selectedPriority || selectedOwner) && (
                <button
                  onClick={() => {
                    setSelectedStatus("");
                    setSelectedPriority("");
                    setSelectedOwner("");
                  }}
                  className="w-full mt-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 bg-muted rounded"
                >
                  Réinitialiser
                </button>
              )}
            </PopoverContent>
          </Popover>
          {(searchQuery !== "" || selectedStatus !== "" || selectedPriority !== "" || selectedOwner !== "" || dateFilter !== "Toutes dates" || customDate !== "" || activeSmartFilter !== "none") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("");
                setSelectedPriority("");
                setSelectedOwner("");
                setDateFilter("Toutes dates");
                setCustomDate("");
                setActiveSmartFilter("none");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Date filter row & Smart filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="card-elegant p-3 flex-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground inline-flex items-center gap-1.5 pr-1">
            <CalendarIcon className="h-3.5 w-3.5" /> Date
          </span>
          {dateFilters.map((d) => (
            <button
              key={d}
              onClick={() => handleDateFilterChange(d)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                dateFilter === d
                  ? "bg-primary text-white"
                  : "bg-muted/60 text-foreground/70 hover:bg-muted"
              }`}
            >
              {d}
            </button>
          ))}
          {/* MODIFICATION ICI : suppression de ml-auto pour aligner avec "À venir" */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground">Date précise</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="h-8 rounded-lg border border-input px-2 text-xs outline-none bg-card"
            />
          </div>
        </div>
        <div className="card-elegant p-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground inline-flex items-center gap-1.5 pr-1">
            <Filter className="h-3.5 w-3.5" /> Filtres intelligents
          </span>
          <button
            onClick={() => setActiveSmartFilter(activeSmartFilter === "overdue" ? "none" : "overdue")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeSmartFilter === "overdue"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
            }`}
          >
            ⚠️ Retards
          </button>
          <button
            onClick={() => setActiveSmartFilter(activeSmartFilter === "blocked" ? "none" : "blocked")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeSmartFilter === "blocked"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100"
            }`}
          >
            🔒 Bloquées
          </button>
          <button
            onClick={() => setActiveSmartFilter(activeSmartFilter === "soon" ? "none" : "soon")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeSmartFilter === "soon"
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100"
            }`}
          >
            ⏱️ &lt; 1h
          </button>
        </div>
      </div>

      {/* Drag & Drop targets dashboard */}
      {draggedActivityId && (
        <div className="bg-gradient-to-br from-primary/5 to-violet/5 border border-primary/20 rounded-xl p-4 animate-fade-in shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-primary animate-pulse" />
            <h4 className="text-sm font-semibold text-foreground">Déposez la carte sur la zone cible de votre choix</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-emerald-500/10", "border-emerald-500/50");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-emerald-500/10", "border-emerald-500/50")}
              onDrop={() => handleDropTarget(draggedActivityId, "terminé")}
              className="p-3.5 border-2 border-dashed border-emerald-500/20 bg-card rounded-lg text-center transition-all duration-200 cursor-pointer"
            >
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1.5" />
              <div className="text-xs font-bold text-foreground">Terminer l'activité</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Enclenche le workflow</div>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-blue-500/10", "border-blue-500/50");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-500/10", "border-blue-500/50")}
              onDrop={() => handleDropTarget(draggedActivityId, "à faire")}
              className="p-3.5 border-2 border-dashed border-blue-500/20 bg-card rounded-lg text-center transition-all duration-200 cursor-pointer"
            >
              <Clock className="mx-auto h-5 w-5 text-blue-500 mb-1.5" />
              <div className="text-xs font-bold text-foreground">Remettre À Faire</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Statut : À Faire</div>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-violet-500/10", "border-violet-500/50");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-violet-500/10", "border-violet-500/50")}
              onDrop={() => handleDropTarget(draggedActivityId, "demain")}
              className="p-3.5 border-2 border-dashed border-violet-500/20 bg-card rounded-lg text-center transition-all duration-200 cursor-pointer"
            >
              <CalendarIcon className="mx-auto h-5 w-5 text-violet-500 mb-1.5" />
              <div className="text-xs font-bold text-foreground">Reporter à Demain</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Date : Demain</div>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-primary/10", "border-primary/50");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-primary/10", "border-primary/50")}
              onDrop={() => handleDropTarget(draggedActivityId, "cette_semaine")}
              className="p-3.5 border-2 border-dashed border-primary/20 bg-card rounded-lg text-center transition-all duration-200 cursor-pointer"
            >
              <CalendarIcon className="mx-auto h-5 w-5 text-primary mb-1.5" />
              <div className="text-xs font-bold text-foreground">Placer cette semaine</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Date : Aujourd'hui</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline with improved layout */}
      <div ref={parentRef} className="card-elegant overflow-y-auto h-[600px] relative">
        {filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground">Aucune activité disponible avec les filtres sélectionnés.</p>
          </div>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const a = filtered[virtualRow.index];
              const isDragging = draggedActivityId === a.id;
              const countdown = getCountdownInfo(a.date, a.time, a.status);
              const footerText = a.result ? `✓ ${a.result}` : a.summary;

              return (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedActivityId(a.id);
                    e.dataTransfer.setData("text/plain", a.id);
                  }}
                  onDragEnd={() => setDraggedActivityId(null)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`px-4 py-3 flex items-start gap-4 hover:bg-muted/30 border-b border-border transition-all duration-200 group relative even:bg-muted/5 overflow-hidden ${
                    isDragging ? "opacity-40 border-2 border-primary border-dashed scale-95" : ""
                  }`}
                >
                  {/* Activity Icon */}
                  <div className="cursor-grab active:cursor-grabbing shrink-0 mt-0.5">
                    <ActivityIcon type={a.type} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 h-full flex flex-col justify-center gap-1 overflow-hidden">
                    {/* Row 1: Title + badges */}
                    <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                      {editingField?.id === a.id && editingField?.field === "title" ? (
                        <input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveInline(a.id, "title")}
                          onBlur={() => handleSaveInline(a.id, "title")}
                          autoFocus
                          className="h-7 text-sm font-semibold rounded px-1.5 border border-primary outline-none w-64 bg-card shrink-0"
                        />
                      ) : (
                        <h4
                          onDoubleClick={() => handleDoubleClick(a, "title", a.title)}
                          className="font-semibold text-sm cursor-pointer hover:underline truncate min-w-0 shrink"
                          title={a.title}
                        >
                          {a.title}
                        </h4>
                      )}
                      {savingField?.id === a.id && savingField?.field === "title" && <InlineSpinner />}

                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={a.status} />
                        <PriorityDot priority={a.priority} />

                        {countdown && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap ${
                            countdown.type === "overdue"
                              ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-200"
                              : countdown.type === "soon"
                              ? "bg-sky-100 text-sky-700 border border-sky-200"
                              : "bg-violet-100 text-violet-700 border border-violet-200"
                          }`}>
                            {countdown.type === "soon" && <Clock className="h-3 w-3 animate-spin" />}
                            {countdown.text}
                          </span>
                        )}

                        {a.blocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                            <Lock className="h-3 w-3 text-amber-600" /> Bloquée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Date, time, client */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-foreground/80 font-medium shrink-0">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {editingField?.id === a.id && editingField?.field === "time" ? (
                          <input
                            type="time"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveInline(a.id, "time")}
                            onBlur={() => handleSaveInline(a.id, "time")}
                            autoFocus
                            className="h-5 text-xs font-semibold rounded px-1 border border-primary outline-none bg-card"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleDoubleClick(a, "time", a.time)}
                            className="cursor-pointer hover:underline inline-flex items-center"
                            title="Double-cliquez pour éditer l'heure"
                          >
                            {a.date} à {a.time}
                            {savingField?.id === a.id && savingField?.field === "time" && <InlineSpinner />}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground shrink-0">•</span>
                      <span className="font-semibold text-foreground/80 inline-flex items-center gap-1 truncate min-w-0">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.client}</span>
                      </span>
                    </div>

                    {/* Row 3: Owner */}
                    <div className="flex items-center gap-2 text-xs overflow-hidden whitespace-nowrap">
                      <span className="text-muted-foreground shrink-0">Assigné à :</span>
                      {editingField?.id === a.id && editingField?.field === "owner" ? (
                        <select
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value);
                            handleSaveInline(a.id, "owner", e.target.value);
                          }}
                          onBlur={() => setEditingField(null)}
                          autoFocus
                          className="h-5 text-xs font-medium rounded border border-primary outline-none bg-card"
                        >
                          <option value="Antoine Roy">Antoine Roy</option>
                          <option value="Chloé Bernard">Chloé Bernard</option>
                          <option value="Léa Martin">Léa Martin</option>
                        </select>
                      ) : (
                        <span
                          onDoubleClick={() => handleDoubleClick(a, "owner", a.owner)}
                          className="font-semibold text-foreground/80 cursor-pointer hover:underline inline-flex items-center gap-1 truncate min-w-0"
                          title="Double-cliquez pour changer de responsable"
                        >
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{a.owner}</span>
                          {savingField?.id === a.id && savingField?.field === "owner" && <InlineSpinner />}
                        </span>
                      )}
                      {a.duration && (
                        <>
                          <span className="text-muted-foreground shrink-0">•</span>
                          <span className="text-muted-foreground truncate">{a.duration}</span>
                        </>
                      )}
                    </div>

                    {/* Row 4: Résumé OU résultat (jamais les deux), tronqué sur une ligne */}
                    {footerText && (
                      a.result ? (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 inline-flex items-center px-2 py-0.5 rounded border border-emerald-200 truncate max-w-full w-fit" title={footerText}>
                          {footerText}
                        </p>
                      ) : (
                        <p
                          className="text-xs text-muted-foreground border-l-2 border-primary/30 bg-muted/40 pl-3 py-1 pr-2 rounded-r-md truncate"
                          title={footerText}
                        >
                          {footerText}
                        </p>
                      )
                    )}
                  </div>

                  {/* Avatar and actions */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[10px] font-semibold">
                        {a.owner.split(" ").map((s: string) => s[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {a.status !== "terminé" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] font-semibold border-emerald-500/30 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-500 hover:text-white transition-all px-2"
                          onClick={() => handleToggleStatus(a.id, "terminé")}
                        >
                          Terminer
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] font-semibold px-2"
                          onClick={() => handleToggleStatus(a.id, "à faire")}
                        >
                          Rouvrir
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-30">
                          <DropdownMenuItem onClick={() => { setSelectedAct(a); setDialogType("details"); }}>
                            <Eye className="mr-2 h-4 w-4" /> Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedAct(a); setDialogType("edit"); }}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lazy loading trigger */}
      {visibleStage !== "all" && (
        <div
          ref={loaderRef}
          onClick={handleLoadMore}
          className="py-8 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-muted/10 transition-colors border border-dashed border-border rounded-xl"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-semibold">Chargement des activités de la semaine...</span>
            </div>
          ) : (
            <div className="text-xs text-primary font-semibold hover:underline">
              Défiler ou cliquer pour charger les semaines suivantes
            </div>
          )}
        </div>
      )}

      {/* Details and Edit Dialog */}
      {selectedAct && (
        <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent className="z-50">
            {dialogType === "details" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Détails de l'activité</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAct.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAct.client} • par {selectedAct.owner}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-xl">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Type</div>
                      <div className="font-medium mt-1 flex items-center gap-2">
                        <ActivityIcon type={selectedAct.type} size="sm" />
                        {Object.entries(typeMap).find(([_, v]) => v === selectedAct.type)?.[0] || selectedAct.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Date & Heure</div>
                      <div className="font-medium mt-1">{selectedAct.date} à {selectedAct.time}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Statut</div>
                      <div className="font-medium mt-1"><StatusBadge status={selectedAct.status} /></div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Priorité</div>
                      <div className="font-medium mt-1 capitalize"><PriorityDot priority={selectedAct.priority} /> {selectedAct.priority}</div>
                    </div>
                    {selectedAct.reminder && (
                      <div className="col-span-2 border-t border-border/40 pt-2.5 mt-1 animate-in fade-in duration-200">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                          <Bell className="h-3.5 w-3.5 text-primary animate-pulse" /> Rappel planifié
                        </div>
                        <div className="font-medium mt-1 text-sm text-foreground">{selectedAct.reminder}</div>
                      </div>
                    )}
                  </div>
                  {selectedAct.summary && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</div>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border">{selectedAct.summary}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Modifier l'activité</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      value={selectedAct.title}
                      onChange={(e) => setSelectedAct({ ...selectedAct, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Client</Label>
                    <Input
                      value={selectedAct.client}
                      onChange={(e) => setSelectedAct({ ...selectedAct, client: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date</Label>
                      <Input
                        value={selectedAct.date}
                        onChange={(e) => setSelectedAct({ ...selectedAct, date: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Heure</Label>
                      <Input
                        value={selectedAct.time}
                        onChange={(e) => setSelectedAct({ ...selectedAct, time: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1">
                      <Bell className="h-3.5 w-3.5 text-primary" /> Rappel
                    </Label>
                    <select
                      value={reminderPreset}
                      onChange={(e) => setReminderPreset(e.target.value)}
                      className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm outline-none bg-card focus:border-ring"
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
                    <Label>Notes</Label>
                    <textarea
                      value={selectedAct.summary || ""}
                      onChange={(e) => setSelectedAct({ ...selectedAct, summary: e.target.value })}
                      className="mt-2 w-full min-h-[80px] rounded-lg border border-input p-3 text-sm outline-none focus:border-ring bg-card"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogType(null)}>Annuler</Button>
                  <Button onClick={handleEditSave} className="gradient-brand text-white border-0">Enregistrer</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Workflow modal */}
      {workflowParent && (
        <Dialog open={workflowParent !== null} onOpenChange={(open) => !open && setWorkflowParent(null)}>
          <DialogContent className="max-w-xl z-50 bg-card border border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/20 to-primary/15 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
                  🎉
                </span>
                Activité terminée !
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-6 pt-4 space-y-5">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <span className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">Activité parente complétée</div>
                  <div className="text-sm font-semibold text-foreground mt-1 truncate">{workflowParent.title}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {workflowParent.client}</span>
                    <span className="text-border">•</span>
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {workflowParent.owner}</span>
                  </div>
                </div>
              </div>

              {!workflowActionType ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Que souhaitez-vous planifier ensuite ?</h4>

                  {workflowParent.type === "call" && workflowParent.title.toLowerCase().includes("qualification") && (
                    <div className="p-3.5 bg-gradient-to-r from-primary/10 to-violet/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-primary">Recommandation commerciale</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Un Appel de qualification terminé doit aboutir à une Démo.</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectWorkflowAction("demo")}
                        className="gradient-brand text-white border-0 text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0"
                      >
                        Planifier <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectWorkflowAction("relance")}
                      className="p-4 border border-border rounded-xl text-left bg-card hover:border-rose-300 hover:bg-rose-50/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2 group"
                    >
                      <span className="h-9 w-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        📞
                      </span>
                      <span className="text-sm font-semibold text-foreground">Créer une Relance</span>
                      <span className="text-[11px] font-normal text-muted-foreground leading-snug">Planifier un appel de suivi</span>
                    </button>
                    <button
                      onClick={() => handleSelectWorkflowAction("rdv")}
                      className="p-4 border border-border rounded-xl text-left bg-card hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2 group"
                    >
                      <span className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        📅
                      </span>
                      <span className="text-sm font-semibold text-foreground">Planifier un RDV</span>
                      <span className="text-[11px] font-normal text-muted-foreground leading-snug">Ajouter au calendrier</span>
                    </button>
                    <button
                      onClick={() => handleSelectWorkflowAction("devis")}
                      className="p-4 border border-border rounded-xl text-left bg-card hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2 group"
                    >
                      <span className="h-9 w-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        📄
                      </span>
                      <span className="text-sm font-semibold text-foreground">Envoyer un Devis</span>
                      <span className="text-[11px] font-normal text-muted-foreground leading-snug">Créer une opportunité de vente</span>
                    </button>
                    <button
                      onClick={() => handleSelectWorkflowAction("note")}
                      className="p-4 border border-border rounded-xl text-left bg-card hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2 group"
                    >
                      <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        📝
                      </span>
                      <span className="text-sm font-semibold text-foreground">Ajouter une Note</span>
                      <span className="text-[11px] font-normal text-muted-foreground leading-snug">Compte-rendu ou mémo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateWorkflowActivity} className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {workflowActionType.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWorkflowActionType(null)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    >
                      ← Retour
                    </button>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground/80">Titre de l'action</Label>
                    <Input
                      value={workflowTitle}
                      onChange={(e) => setWorkflowTitle(e.target.value)}
                      required
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-foreground/80">Client (Pré-rempli)</Label>
                      <Input
                        value={workflowParent.client}
                        disabled
                        className="mt-1.5 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-foreground/80">Responsable</Label>
                      <Input
                        value={currentUser.name}
                        disabled
                        className="mt-1.5 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-foreground/80">Date</Label>
                      <input
                        type="date"
                        value={workflowDate}
                        onChange={(e) => setWorkflowDate(e.target.value)}
                        required
                        className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm bg-card outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-shadow"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-foreground/80">Heure</Label>
                      <input
                        type="time"
                        value={workflowTime}
                        onChange={(e) => setWorkflowTime(e.target.value)}
                        required
                        className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm bg-card outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground/80">Notes / Contexte de l'action</Label>
                    <textarea
                      value={workflowNotes}
                      onChange={(e) => setWorkflowNotes(e.target.value)}
                      className="mt-1.5 w-full min-h-[80px] rounded-lg border border-input p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 bg-card resize-none transition-shadow"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setWorkflowParent(null)}>Annuler</Button>
                    <Button type="submit" className="gradient-brand text-white border-0 shadow-sm">Créer l'activité</Button>
                  </div>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Helper components
function UserIconRole({ user }: { user: { name: string; role: "manager" | "commercial" } }) {
  if (user.role === "manager") {
    return <Shield className="h-4 w-4 text-violet-600 shrink-0" />;
  }
  return <AvatarFallbackIcon className="h-4 w-4 text-emerald-600 shrink-0" />;
}

function AvatarFallbackIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const InlineSpinner = () => (
  <span className="inline-flex items-center ml-1 animate-spin">
    <Loader2 className="h-3 w-3 text-emerald-500" />
  </span>
);