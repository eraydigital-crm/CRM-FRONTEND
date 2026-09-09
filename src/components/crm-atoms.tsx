import {
  Phone,
  Calendar as CalendarIcon,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";

export function ActivityIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const map: Record<string, { Icon: typeof Phone; color: string }> = {
    call: { Icon: Phone, color: "bg-blue-500/10 text-blue-600" },
    meeting: { Icon: CalendarIcon, color: "bg-violet-500/10 text-violet-600" },
    email: { Icon: Mail, color: "bg-sky-500/10 text-sky-600" },
    whatsapp: { Icon: MessageCircle, color: "bg-emerald-500/10 text-emerald-600" },
    quote: { Icon: FileText, color: "bg-amber-500/10 text-amber-600" },
    contract: { Icon: FileText, color: "bg-emerald-500/10 text-emerald-600" },
    visit: { Icon: CalendarIcon, color: "bg-fuchsia-500/10 text-fuchsia-600" },
    note: { Icon: FileText, color: "bg-slate-500/10 text-slate-600" },
    "follow-up": { Icon: Clock, color: "bg-rose-500/10 text-rose-600" },
    task: { Icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
  };
  const { Icon, color } = map[type] ?? map.note;
  const s = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const i = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={`${s} shrink-0 rounded-lg grid place-items-center ${color}`}>
      <Icon className={i} strokeWidth={2} />
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    terminé: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    planifié: "bg-blue-500/10 text-blue-700 border-blue-200",
    "en retard": "bg-rose-500/10 text-rose-700 border-rose-200",
    "à faire": "bg-amber-500/10 text-amber-700 border-amber-200",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: "low" | "medium" | "high" }) {
  const c = priority === "high" ? "bg-rose-500" : priority === "medium" ? "bg-amber-500" : "bg-slate-300";
  return <span className={`h-2 w-2 rounded-full ${c}`} title={priority} />;
}
