import { Link } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { kpis as initialKpis, revenueSeries } from "@/lib/crm-data";
import { useCRM } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ActivityIcon, StatusBadge, PriorityDot } from "@/components/crm-atoms";
import { usePageMeta } from "@/hooks/use-page-meta";

const toneMap = {
  brand: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-500/10",
  violet: "text-violet-600 bg-violet-500/10",
  destructive: "text-rose-600 bg-rose-500/10",
} as const;

export default function Dashboard() {
  usePageMeta(
    "Tableau de bord — Eray CRM",
    "Pilotez vos ventes, activités et opportunités en un coup d'œil."
  );
  const { clients, deals, activities } = useCRM();
  const userName = localStorage.getItem("name") || sessionStorage.getItem("name") || "Léa";

  // Calculate dynamic KPIs
  const totalPotential = deals.reduce((acc, d) => acc + d.amount, 0);
  const totalWon = deals.filter(d => ["Contrat signé", "Vente gagnée", "Ambassadeur"].includes(d.stage)).reduce((acc, d) => acc + d.amount, 0);
  const winRate = deals.length > 0 ? Math.round((deals.filter(d => ["Contrat signé", "Vente gagnée", "Ambassadeur"].includes(d.stage)).length / deals.length) * 100) : 0;
  
  const kpis = [
    { label: "Prospects", value: clients.filter(c => c.status === "prospect").length.toString(), delta: "+12%", tone: "brand" as const },
    { label: "Clients actifs", value: clients.filter(c => c.status === "actif" || c.status === "vip").length.toString(), delta: "+4%", tone: "success" as const },
    { label: "Opportunités gagnées", value: deals.filter(d => ["Contrat signé", "Vente gagnée", "Ambassadeur"].includes(d.stage)).length.toString(), delta: "+8%", tone: "violet" as const },
    { label: "Opportunités perdues", value: deals.filter(d => d.stage === "Vente perdue").length.toString(), delta: "-2%", tone: "destructive" as const },
    { label: "CA potentiel", value: `${(totalPotential / 1000).toFixed(0)} K MGA`, delta: "+18%", tone: "brand" as const },
    { label: "CA signé", value: `${(totalWon / 1000).toFixed(0)} K MGA`, delta: "+22%", tone: "success" as const },
    { label: "Taux de conversion", value: `${winRate}%`, delta: "+3 pts", tone: "violet" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Aujourd'hui</div>
          <h1 className="text-2xl lg:text-3xl font-bold mt-1">Bonjour {userName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici la synthèse de votre activité commerciale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Cette semaine</Button>
          <Button variant="outline" size="sm">Exporter</Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k) => {
          const positive = k.delta.startsWith("+");
          return (
            <div key={k.label} className="card-elegant p-4 hover:shadow-float transition-shadow">
              <div className="flex items-center justify-between">
                <span className={`h-8 w-8 rounded-lg grid place-items-center ${toneMap[k.tone]}`}>
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className={`text-[11px] font-semibold ${positive ? "text-emerald-600" : "text-rose-600"} flex items-center gap-0.5`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground uppercase tracking-wide">{k.label}</div>
              <div className="text-xl font-bold font-display mt-0.5">{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-elegant p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg">Performance commerciale</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Chiffre d'affaires signé vs potentiel</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Signé</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet/40" /> Potentiel</span>
            </div>
          </div>
          <RevenueChart />
        </div>

        <div className="card-elegant p-6">
          <h3 className="font-display font-bold text-lg">Répartition pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Par étape commerciale</p>
          <div className="mt-6 space-y-3.5">
            {[
              { label: "Négociation", value: 32, color: "bg-primary" },
              { label: "Proposition envoyée", value: 24, color: "bg-violet" },
              { label: "Qualification", value: 18, color: "bg-sky-500" },
              { label: "Premier échange", value: 14, color: "bg-emerald-500" },
              { label: "À contacter", value: 12, color: "bg-amber-500" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.value * 2.5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elegant p-6">
          <SectionHeader title="Tâches du jour" count={5} link="/activities" />
          <ul className="mt-4 space-y-2.5">
            {activities.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center gap-3 group">
                <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                <ActivityIcon type={a.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground">{a.client} • {a.time}</div>
                </div>
                <PriorityDot priority={a.priority} />
              </li>
            ))}
          </ul>
        </div>

        <div className="card-elegant p-6">
          <SectionHeader title="Rendez-vous du jour" count={3} link="/calendar" />
          <ul className="mt-4 space-y-3">
            {[
              { time: "09:30", title: "Appel Sophie Laurent", tag: "Appel", color: "bg-primary" },
              { time: "11:00", title: "Démo Logipro Industries", tag: "Démo", color: "bg-violet" },
              { time: "15:00", title: "Café stratégie GreenTech", tag: "RDV", color: "bg-emerald-500" },
            ].map((e) => (
              <li key={e.time} className="flex gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="w-12 shrink-0 text-right">
                  <div className="text-sm font-semibold">{e.time}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{e.tag}</div>
                </div>
                <div className={`w-0.5 rounded-full ${e.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">30 minutes • Visio</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-elegant p-6">
          <SectionHeader title="Activités en retard" count={2} link="/activities" tone="destructive" />
          <ul className="mt-4 space-y-3">
            {activities.filter((a) => a.status === "en retard").concat(activities.filter(a => a.priority === "high").slice(0,1)).slice(0, 3).map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{a.client} • {a.date}</div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">Reporter</Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent activity + opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card-elegant p-6 lg:col-span-3">
          <SectionHeader title="Activités récentes" link="/activities" />
          <ul className="mt-4 divide-y divide-border">
            {activities.slice(0, 5).map((a) => (
              <li key={a.id} className="py-3 flex items-center gap-3">
                <ActivityIcon type={a.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.client} • par {a.owner}</div>
                </div>
                <StatusBadge status={a.status} />
                <div className="text-xs text-muted-foreground w-24 text-right">{a.date} • {a.time}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-elegant p-6 lg:col-span-2">
          <SectionHeader title="Top opportunités" link="/pipeline" />
          <ul className="mt-4 space-y-3">
            {deals.filter(d => d.stage !== "Vente gagnée" && d.stage !== "Vente perdue" && d.stage !== "Ambassadeur").slice(0, 4).map((d) => (
              <li key={d.id} className="p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-elegant transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{d.client}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{d.company}</div>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{(d.amount/1000).toFixed(0)} K MGA</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-brand rounded-full" style={{ width: `${d.probability}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{d.probability}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{d.stage}</span>
                  <span>Clôture {d.closeDate}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, link, tone }: { title: string; count?: number; link?: string; tone?: "destructive" }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="font-display font-bold text-base">{title}</h3>
        {count !== undefined && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tone === "destructive" ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"}`}>
            {count}
          </span>
        )}
      </div>
      {link && (
        <Link to={link} className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5">
          Voir tout <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}




function RevenueChart() {
  const max = 130;
  const width = 100;
  const height = 60;
  const points = revenueSeries;
  const toPath = (key: "ca" | "po") =>
    points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - (p[key] / max) * height;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  const toArea = (key: "ca" | "po") => {
    const line = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - (p[key] / max) * height;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return `${line} L${width},${height} L0,${height} Z`;
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height + 12}`} className="w-full h-56" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad-ca" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.22 265)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 265)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-po" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.52 0.24 290)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.52 0.24 290)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1="0" x2={width} y1={height * r} y2={height * r} stroke="oklch(0.925 0.01 265)" strokeWidth="0.2" />
        ))}
        <path d={toArea("po")} fill="url(#grad-po)" />
        <path d={toPath("po")} fill="none" stroke="oklch(0.52 0.24 290)" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <path d={toArea("ca")} fill="url(#grad-ca)" />
        <path d={toPath("ca")} fill="none" stroke="oklch(0.55 0.22 265)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-2 px-1 text-[10px] text-muted-foreground font-medium">
        {points.map((p) => <span key={p.m}>{p.m}</span>)}
      </div>
    </div>
  );
}
