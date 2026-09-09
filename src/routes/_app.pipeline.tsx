import { usePageMeta } from "@/hooks/use-page-meta";
import { useState, useMemo } from "react";
import { useFilteredCollection } from "@/hooks/use-filtered-collection";
import { Plus, Filter, LayoutGrid, List as ListIcon, MoreHorizontal, Clock, Calendar as CalendarIcon, Search, X } from "lucide-react";
import { stages, type Stage } from "@/lib/crm-data";
import { useCRM } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewOpportunityDialog } from "@/components/quick-create-dialogs";


const stageColors: Record<Stage, string> = {
  "Nouveau lead": "bg-slate-500",
  "Premier contact": "bg-blue-500",
  "Qualification": "bg-sky-500",
  "Rendez-vous planifié": "bg-cyan-500",
  "Analyse des besoins": "bg-teal-500",
  "Démonstration": "bg-indigo-500",
  "Devis envoyé": "bg-violet-500",
  "Négociation": "bg-fuchsia-500",
  "Relance 1": "bg-amber-500",
  "Relance 2": "bg-orange-500",
  "Relance finale": "bg-rose-500",
  "Contrat signé": "bg-emerald-500",
  "Vente gagnée": "bg-emerald-600",
  "Vente perdue": "bg-slate-400",
  "Ambassadeur": "bg-yellow-500",
};

export default function PipelinePage() {
  usePageMeta("Pipeline commercial — Eray CRM", "Suivez vos opportunités en vue Kanban et Liste.");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const { deals, setDeals } = useCRM();

  // Filter states
  const [query, setQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [minAmount, setMinAmount] = useState<number>(0);
  const [minProbability, setMinProbability] = useState<number>(0);

  const filters = useMemo(() => [
    (d: any) => !selectedOwner || d.owner === selectedOwner,
    (d: any) => d.amount >= minAmount,
    (d: any) => d.probability >= minProbability,
  ], [selectedOwner, minAmount, minProbability]);

  const searchFields = useMemo(() => ["client" as const, "company" as const], []);

  const filteredDeals = useFilteredCollection(deals, {
    search: query,
    searchFields,
    filters,
  });

  const total = filteredDeals.reduce((s, d) => s + d.amount, 0);
  const won = filteredDeals.filter((d) => d.stage === "Vente gagnée" || d.stage === "Contrat signé" || d.stage === "Ambassadeur").reduce((s, d) => s + d.amount, 0);

  const handleDrop = (dealId: string, newStage: Stage) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Pipeline commercial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredDeals.length} / {deals.length} opportunités • {(total / 1000).toFixed(0)} K MGA potentiel • {(won / 1000).toFixed(0)} K MGA signés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
            <button onClick={() => setView("kanban")} className={`h-8 w-8 grid place-items-center rounded-md ${view === "kanban" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={`h-8 w-8 grid place-items-center rounded-md ${view === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <NewOpportunityDialog />
        </div>
      </div>

      {/* Filters */}
      <div className="card-elegant p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, une entreprise…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm"
          />
        </div>

        {/* Owner filter select */}
        <select
          value={selectedOwner}
          onChange={(e) => setSelectedOwner(e.target.value)}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Tous les responsables</option>
          {Array.from(new Set(deals.map((d) => d.owner))).map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>

        {/* Min Amount filter select */}
        <select
          value={minAmount.toString()}
          onChange={(e) => setMinAmount(Number(e.target.value))}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="0">Montant Min</option>
          <option value="15000">&gt; 15 000 MGA</option>
          <option value="30000">&gt; 30 000 MGA</option>
          <option value="50000">&gt; 50 000 MGA</option>
          <option value="80000">&gt; 80 000 MGA</option>
          <option value="100000">&gt; 100 000 MGA</option>
        </select>

        {/* Min Probability filter select */}
        <select
          value={minProbability.toString()}
          onChange={(e) => setMinProbability(Number(e.target.value))}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="0">Probabilité Min</option>
          <option value="25">&gt; 25%</option>
          <option value="50">&gt; 50%</option>
          <option value="75">&gt; 75%</option>
          <option value="90">&gt; 90%</option>
        </select>

        {(query !== "" || selectedOwner !== "" || minAmount !== 0 || minProbability !== 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setSelectedOwner("");
              setMinAmount(0);
              setMinProbability(0);
            }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
      </div>

      {view === "kanban" ? (
        <div className="overflow-x-auto scrollbar-thin -mx-4 lg:-mx-8 px-4 lg:px-8 pb-2">
          <div className="flex gap-3 min-w-max">
            {stages.map((stage) => {
              const items = filteredDeals.filter((d) => d.stage === stage);
              const sum = items.reduce((s, d) => s + d.amount, 0);
              return (
                <div key={stage} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stageColors[stage]}`} />
                      <h3 className="text-sm font-semibold">{stage}</h3>
                      <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{items.length}</span>
                    </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">{(sum / 1000).toFixed(0)} K MGA</span>
                  </div>
                  <div 
                    className="bg-muted/40 rounded-xl p-2 space-y-2 min-h-[500px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const dealId = e.dataTransfer.getData("dealId");
                      if (dealId) handleDrop(dealId, stage);
                    }}
                  >
                    {items.map((d) => (
                      <div 
                        key={d.id} 
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("dealId", d.id)}
                        className="bg-card rounded-lg p-3 border border-border hover:shadow-float hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{d.client}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{d.company}</div>
                          </div>
                          <button 
                            onClick={() => {
                              setDeals(deals.filter(deal => deal.id !== d.id));
                            }} 
                            className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Supprimer l'opportunité"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2.5 text-lg font-bold text-gradient-brand font-display">{(d.amount / 1000).toFixed(1)} K MGA</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${stageColors[d.stage]} rounded-full`} style={{ width: `${d.probability}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground">{d.probability}%</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {d.lastActivity}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-foreground/70">
                            <CalendarIcon className="h-3 w-3" /> Clôture {d.closeDate}
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[9px] font-semibold">
                              {d.owner.split(" ").map((s) => s[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded">{d.nextAction}</span>
                        </div>
                      </div>
                    ))}
                    <NewOpportunityDialog
                      trigger={
                        <button className="w-full h-9 rounded-lg border-2 border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-1">
                          <Plus className="h-3.5 w-3.5" /> Ajouter
                        </button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-elegant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Client</th>
                <th className="text-left font-semibold px-2 py-3">Entreprise</th>
                <th className="text-right font-semibold px-2 py-3">Montant</th>
                <th className="text-left font-semibold px-2 py-3">Probabilité</th>
                <th className="text-left font-semibold px-2 py-3">Étape</th>
                <th className="text-left font-semibold px-2 py-3">Responsable</th>
                <th className="text-left font-semibold px-2 py-3">Prochaine action</th>
                <th className="text-left font-semibold px-2 py-3">Clôture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeals.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-semibold">{d.client}</td>
                  <td className="px-2 py-3 text-muted-foreground">{d.company}</td>
                  <td className="px-2 py-3 text-right font-bold text-primary">{d.amount.toLocaleString("fr")} MGA</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-brand rounded-full" style={{ width: `${d.probability}%` }} />
                      </div>
                      <span className="text-xs">{d.probability}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted">{d.stage}</span>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{d.owner}</td>
                  <td className="px-2 py-3 text-muted-foreground">{d.nextAction}</td>
                  <td className="px-2 py-3 text-muted-foreground">{d.closeDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
