import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter, Check, CalendarDays, User2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityIcon } from "@/components/crm-atoms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NewEventDialog } from "@/components/quick-create-dialogs";
import { useCRM } from "@/lib/store";
import type { Activity } from "@/lib/crm-data";


type View = "Jour" | "Semaine" | "Mois" | "Liste";

type Event = { id?: string; day: number; start: number; duration: number; title: string; client: string; type: "call" | "meeting" | "follow-up" | "task"; absDate?: string };

const eventColors: Record<Event["type"], string> = {
  call: "bg-blue-500/15 border-l-blue-500 text-blue-900",
  meeting: "bg-violet-500/15 border-l-violet-500 text-violet-900",
  "follow-up": "bg-rose-500/15 border-l-rose-500 text-rose-900",
  task: "bg-emerald-500/15 border-l-emerald-500 text-emerald-900",
};

const ALL_TYPES: Event["type"][] = ["call", "meeting", "follow-up", "task"];
const typeLabels: Record<Event["type"], string> = {
  call: "Appels",
  meeting: "Rendez-vous",
  "follow-up": "Relances",
  task: "Tâches",
};
const typeSwatch: Record<Event["type"], string> = {
  call: "bg-blue-500",
  meeting: "bg-violet-500",
  "follow-up": "bg-rose-500",
  task: "bg-emerald-500",
};
const typeBadge: Record<Event["type"], string> = {
  call: "bg-blue-500/15 text-blue-800",
  meeting: "bg-violet-500/15 text-violet-800",
  "follow-up": "bg-rose-500/15 text-rose-800",
  task: "bg-emerald-500/15 text-emerald-800",
};

function parseYYYYMMDD(str: string): Date {
  const parts = str.split("-");
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d, 12, 0, 0, 0);
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0, 0);
}

function fmtTime(h: number) {
  const H = Math.floor(h);
  const M = Math.round((h - H) * 60);
  return `${H.toString().padStart(2, "0")}:${M.toString().padStart(2, "0")}`;
}

function fmtEventDate(absDate?: string) {
  if (!absDate) return "";
  const d = parseYYYYMMDD(absDate);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// Contenu détaillé du rendez-vous affiché au clic (remplace les anciennes stats Présent/Absent/Non défini)
function EventDetails({ e }: { e: Event }) {
  return (
    <>
      <div className="text-sm font-bold font-display text-foreground text-left leading-normal mb-1">
        {e.title}
      </div>
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 capitalize ${typeBadge[e.type]}`}>
        {typeLabels[e.type]}
      </span>

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <User2 className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{e.client}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span>
            {fmtTime(e.start)} – {fmtTime(e.start + e.duration)}
          </span>
        </div>
        {e.absDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="capitalize">{fmtEventDate(e.absDate)}</span>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full mt-3 h-8 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium py-0 rounded-lg text-xs"
      >
        Voir la fiche
      </Button>
    </>
  );
}

export default function CalendarPage() {
  usePageMeta("Calendrier — Eray CRM", "Vues Jour, Semaine, Mois et Liste pour vos rendez-vous et relances.");
  const [view, setView] = useState<View>("Semaine");
  const [typeFilter, setTypeFilter] = useState<Event["type"][]>([...ALL_TYPES]);
  const [dateFilter, setDateFilter] = useState<string>(""); // yyyy-mm-dd or ""

  const { activities: activityList } = useCRM();

  const monday = useMemo(() => {
    if (dateFilter) {
      return getMonday(parseYYYYMMDD(dateFilter));
    }
    return new Date(2026, 6, 6, 12, 0, 0, 0); // Default to July 6, 2026 (Mon)
  }, [dateFilter]);

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [monday]);

  const daysShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const days = useMemo(() => {
    return daysOfWeek.map((d, i) => {
      const dayNum = d.getDate().toString().padStart(2, "0");
      return `${daysShort[i]} ${dayNum}`;
    });
  }, [daysOfWeek]);

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8-18h

  const mapActivityToEvent = (act: Activity) => {
    let type: "call" | "meeting" | "follow-up" | "task" = "task";
    if (act.type === "call") type = "call";
    else if (act.type === "meeting" || act.type === "visit") type = "meeting";
    else if (act.type === "follow-up" || act.type === "quote" || act.type === "contract") type = "follow-up";
    else type = "task";

    let start = 9;
    if (act.time) {
      const parts = act.time.split(":");
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          start = h + m / 60;
        }
      }
    }

    let duration = 1;
    if (act.duration) {
      const durStr = act.duration.toLowerCase();
      if (durStr.includes("h")) {
        const parts = durStr.split("h");
        const h = parseFloat(parts[0]) || 0;
        const m = parseFloat(parts[1]) || 0;
        duration = h + m / 60;
      } else if (durStr.includes("min")) {
        const min = parseFloat(durStr) || 0;
        duration = min / 60;
      }
    }

    let absDate = "";
    if (act.date === "Aujourd'hui") {
      absDate = "2026-07-06";
    } else if (act.date === "Demain") {
      absDate = "2026-07-07";
    } else if (act.date === "Hier") {
      absDate = "2026-07-05";
    } else if (act.date === "Il y a 2 j") {
      absDate = "2026-07-04";
    } else if (act.date.includes("Ven. 12/07") || act.date.includes("12/07")) {
      absDate = "2026-07-10";
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(act.date)) {
      absDate = act.date;
    } else {
      const parts = act.date.split("/");
      if (parts.length === 3) {
        absDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      } else {
        absDate = "2026-07-06";
      }
    }

    return {
      id: act.id,
      title: act.title,
      client: act.client,
      type,
      start,
      duration,
      absDate,
    };
  };

  const visibleEvents = useMemo(() => {
    const mapped = activityList.map(mapActivityToEvent);
    const startMs = monday.getTime() - 12 * 3600 * 1000;
    const endMs = monday.getTime() + 7 * 86400000 - 12 * 3600 * 1000;

    return mapped.filter((evt) => {
      const evtTime = parseYYYYMMDD(evt.absDate).getTime();
      const isInWeek = evtTime >= startMs && evtTime < endMs;
      const isTypeOk = typeFilter.includes(evt.type);
      return isInWeek && isTypeOk;
    }).map((evt) => {
      const evtTime = parseYYYYMMDD(evt.absDate).getTime();
      const day = Math.round((evtTime - startMs) / 86400000);
      return {
        ...evt,
        day,
      };
    });
  }, [activityList, monday, typeFilter]);

  const getFrenchMonth = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long" });
  };

  const getFrenchYear = (date: Date) => {
    return date.getFullYear();
  };

  const weekLabel = useMemo(() => {
    const startDay = daysOfWeek[0];
    const endDay = daysOfWeek[6];
    if (startDay.getMonth() === endDay.getMonth()) {
      return `${startDay.getDate()} – ${endDay.getDate()} ${getFrenchMonth(startDay)} ${getFrenchYear(startDay)}`;
    } else {
      return `${startDay.getDate()} ${getFrenchMonth(startDay)} – ${endDay.getDate()} ${getFrenchMonth(endDay)} ${getFrenchYear(endDay)}`;
    }
  }, [daysOfWeek]);

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const subtitle = useMemo(() => {
    const startDay = daysOfWeek[0];
    const monthName = getFrenchMonth(startDay);
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} ${startDay.getFullYear()} — Semaine ${getWeekNumber(startDay)}`;
  }, [daysOfWeek]);

  const toggleType = (t: Event["type"]) =>
    setTypeFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Calendrier</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 pl-3 pr-2 rounded-lg border border-border bg-card text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 grid place-items-center rounded-full bg-rose-500 text-white text-[9px] font-bold hover:bg-rose-600"
                title="Effacer la date"
              >
                ×
              </button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Activités
                <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">
                  {typeFilter.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">
                Filtrer par type
              </div>
              {ALL_TYPES.map((t) => {
                const active = typeFilter.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    <span
                      className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"
                        }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-sm ${typeSwatch[t]}`} />
                    <span className="flex-1 text-left">{typeLabels[t]}</span>
                  </button>
                );
              })}
              <div className="border-t border-border mt-1 pt-1 flex gap-1">
                <button
                  onClick={() => setTypeFilter([...ALL_TYPES])}
                  className="flex-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded py-1"
                >
                  Tout
                </button>
                <button
                  onClick={() => setTypeFilter([])}
                  className="flex-1 text-xs font-semibold text-muted-foreground hover:bg-muted rounded py-1"
                >
                  Aucun
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <NewEventDialog />
        </div>
      </div>

      <div className="card-elegant p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => {
                const prev = new Date(monday);
                prev.setDate(prev.getDate() - 7);
                setDateFilter(prev.toISOString().slice(0, 10));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setDateFilter("");
              }}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => {
                const next = new Date(monday);
                next.setDate(next.getDate() + 7);
                setDateFilter(next.toISOString().slice(0, 10));
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-3 font-display font-semibold">{weekLabel}</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
            {(["Jour", "Semaine", "Mois", "Liste"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${view === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-blue-500" label="Appels" />
            <LegendDot color="bg-violet-500" label="Rendez-vous" />
            <LegendDot color="bg-rose-500" label="Relances" />
            <LegendDot color="bg-emerald-500" label="Tâches" />
          </div>
        </div>

        {view === "Liste" ? (
          <ListView events={visibleEvents} days={days} />
        ) : view !== "Mois" ? (
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[900px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                <div />
                {days.map((d, i) => (
                  <div key={d} className={`px-2 py-3 text-center ${i === 0 ? "bg-primary/5 rounded-t-lg" : ""}`}>
                    <div className="text-[11px] text-muted-foreground uppercase">{d.split(" ")[0]}</div>
                    <div className={`text-lg font-bold ${i === 0 ? "text-primary" : ""}`}>{d.split(" ")[1]}</div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
                <div>
                  {hours.map((h) => (
                    <div key={h} className="h-16 pr-2 text-right text-[10px] text-muted-foreground pt-1">
                      {h}:00
                    </div>
                  ))}
                </div>
                {days.map((_d, dayIdx) => (
                  <div key={dayIdx} className={`relative border-l border-border ${dayIdx === 0 ? "bg-primary/[0.02]" : ""}`}>
                    {hours.map((h) => (
                      <div key={h} className="h-16 border-b border-border/60" />
                    ))}
                    {visibleEvents
                      .filter((e) => e.day === dayIdx)
                      .map((e, i) => {
                        const top = (e.start - 8) * 64;
                        const height = e.duration * 64 - 4;
                        return (
                          <Popover key={i}>
                            <PopoverTrigger asChild>
                              <div
                                className={`absolute left-1 right-1 rounded-lg border-l-2 p-2 text-[11px] shadow-elegant cursor-pointer hover:shadow-float transition ${eventColors[e.type]}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <div className="font-semibold leading-tight truncate">{e.title}</div>
                                <div className="opacity-80 truncate mt-0.5">{e.client}</div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-card text-foreground shadow-xl border border-border rounded-lg" side="top" align="center">
                              <EventDetails e={e} />
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MonthView activities={activityList} />
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} /> {label}
    </span>
  );
}

function MonthView({ activities }: { activities: Activity[] }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);

  const getDayActivities = (dayNum: number) => {
    if (dayNum < 1 || dayNum > 31) return [];
    const targetDateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;

    return activities.filter(act => {
      let absDate = "";
      if (act.date === "Aujourd'hui") absDate = "2026-07-06";
      else if (act.date === "Demain") absDate = "2026-07-07";
      else if (act.date === "Hier") absDate = "2026-07-05";
      else if (act.date === "Il y a 2 j") absDate = "2026-07-04";
      else if (act.date.includes("Ven. 12/07") || act.date.includes("12/07")) absDate = "2026-07-10";
      else if (/^\d{4}-\d{2}-\d{2}$/.test(act.date)) absDate = act.date;
      else {
        const parts = act.date.split("/");
        if (parts.length === 3) {
          absDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      return absDate === targetDateStr;
    });
  };

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[100px]">
        {days.map((d, i) => {
          const isToday = d === 6;
          const outside = d < 1 || d > 31;
          const dayActs = getDayActivities(d);

          return (
            <div key={i} className={`border-r border-b border-border p-2 hover:bg-muted/20 ${outside ? "bg-muted/10" : ""}`}>
              <div className={`text-xs font-semibold ${isToday ? "h-6 w-6 rounded-full bg-primary text-white grid place-items-center" : outside ? "text-muted-foreground/50" : ""}`}>
                {outside ? (d < 1 ? 30 + d : d - 31) : d}
              </div>
              {dayActs.length > 0 && (
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                  {dayActs.map((act) => {
                    let badgeColor = "bg-blue-500/15 text-blue-800";
                    if (act.type === "meeting" || act.type === "visit") badgeColor = "bg-violet-500/15 text-violet-800";
                    else if (act.type === "follow-up" || act.type === "quote") badgeColor = "bg-rose-500/15 text-rose-800";
                    else if (act.type === "task") badgeColor = "bg-emerald-500/15 text-emerald-800";

                    return (
                      <div key={act.id} className={`text-[9px] px-1.5 py-0.5 rounded ${badgeColor} truncate`} title={`${act.time} ${act.title}`}>
                        {act.time} {act.title}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ events, days }: { events: Event[]; days: string[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <p className="text-sm text-muted-foreground">Aucun événement pour ces filtres.</p>
      </div>
    );
  }
  const grouped = days.map((d, idx) => ({
    day: d,
    idx,
    items: events
      .filter((e) => e.day === idx)
      .sort((a, b) => a.start - b.start),
  }));

  return (
    <div className="space-y-5">
      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.idx}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-7 px-2 rounded-md grid place-items-center text-[11px] font-bold ${g.idx === 0 ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                  {g.day}
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {g.items.length} évén.
                </span>
              </div>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {g.items.map((e, i) => (
                  <Popover key={i}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="text-xs font-mono font-semibold text-muted-foreground w-24 shrink-0">
                          {fmtTime(e.start)} – {fmtTime(e.start + e.duration)}
                        </div>
                        <ActivityIcon type={e.type} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.client}</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {typeLabels[e.type]}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-card text-foreground shadow-xl border border-border rounded-lg" side="top" align="center">
                      <EventDetails e={e} />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
}