import { Link } from "react-router";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useState, useMemo, useEffect, useRef } from "react";
import { useFilteredCollection } from "@/hooks/use-filtered-collection";
import { useVirtualizer } from "@/hooks/use-virtualizer";
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  User,
  Star,
  TrendingUp,
  Activity,
  X,
} from "lucide-react";
import { useCRM } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityDot, ActivityIcon } from "@/components/crm-atoms";
import { NewActivityDialog } from "@/components/new-activity-dialog";
import { NewClientDialog } from "@/components/quick-create-dialogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusMap: Record<string, string> = {
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  actif: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  inactif: "bg-slate-400/10 text-slate-600 border-slate-200",
  vip: "bg-violet-500/10 text-violet-700 border-violet-200",
};

const priorityLabel: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

// Hauteur de ligne adaptée pour afficher confortablement les informations
const TABLE_ROW_HEIGHT = 76;

export default function ClientsPage() {
  usePageMeta("Clients — Eray CRM", "Gérez vos clients et prospects avec filtres avancés.");
  const { clients: clientList, setClients: setClientList, projectsForClient, clientHistorySummary } = useCRM();
  const [view, setView] = useState<"table" | "cards">("table");
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"details" | "edit" | null>(null);

  // Filtres avancés
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Options de filtres
  const ownerOptions = useMemo(() => Array.from(new Set(clientList.map((c) => c.owner))), [clientList]);
  const sectorOptions = useMemo(() => Array.from(new Set(clientList.map((c) => c.sector))), [clientList]);
  const tagOptions = useMemo(() => Array.from(new Set(clientList.flatMap((c) => c.tags || []))), [clientList]);

  const filters = useMemo(() => [
    (c: any) => selectedStatuses.length === 0 || selectedStatuses.includes(c.status),
    (c: any) => selectedOwners.length === 0 || selectedOwners.includes(c.owner),
    (c: any) => selectedPriorities.length === 0 || selectedPriorities.includes(c.priority),
    (c: any) => selectedSectors.length === 0 || selectedSectors.includes(c.sector),
    (c: any) => selectedTags.length === 0 || c.tags.some((t: string) => selectedTags.includes(t)),
  ], [selectedStatuses, selectedOwners, selectedPriorities, selectedSectors, selectedTags]);

  const searchFields = useMemo(() => ["name" as const, "company" as const], []);

  const filtered = useFilteredCollection(clientList, {
    search: query,
    searchFields,
    filters,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: 8,
  });

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedStatuses, selectedOwners, selectedPriorities, selectedSectors, selectedTags]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedFiltered = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, activePage]);

  const handleDelete = (id: string) => {
    setClientList(clientList.filter((c) => c.id !== id));
  };

  const handleEditSave = () => {
    if (selectedClient) {
      setClientList(
        clientList.map((c) => (c.id === selectedClient.id ? selectedClient : c)),
      );
      setDialogType(null);
      setSelectedClient(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Nom",
      "Entreprise",
      "Rôle",
      "Email",
      "Téléphone",
      "Ville",
      "Secteur",
      "Statut",
      "Priorité",
      "Responsable",
      "Valeur",
    ];
    const rows = clientList.map((c) => [
      c.name,
      c.company,
      c.role,
      c.email,
      c.phone,
      c.city,
      c.sector,
      c.status,
      c.priority,
      c.owner,
      c.value.toString(),
    ]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((f) => `"${f}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_eray_crm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = (c: any) => {
    setSelectedClient(c);
    setDialogType("details");
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedOwners.length > 0 ||
    selectedPriorities.length > 0 ||
    selectedSectors.length > 0 ||
    selectedTags.length > 0 ||
    query !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientList.length} contacts • 4 nouveaux cette semaine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Exporter
          </Button>
          <NewClientDialog
            onAdd={(newClient) => setClientList([newClient, ...clientList])}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="card-elegant p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, une entreprise…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring focus:ring-2 focus:ring-ring/15 outline-none text-sm transition-shadow"
          />
        </div>
        <FilterDropdown
          label="Statut"
          options={["prospect", "actif", "vip", "inactif"]}
          selected={selectedStatuses}
          onToggle={(val) =>
            setSelectedStatuses((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
        />
        <FilterDropdown
          label="Responsable"
          options={ownerOptions}
          selected={selectedOwners}
          onToggle={(val) =>
            setSelectedOwners((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
        />
        <FilterDropdown
          label="Priorité"
          options={["low", "medium", "high"]}
          selected={selectedPriorities}
          onToggle={(val) =>
            setSelectedPriorities((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
        />
        <FilterDropdown
          label="Secteur"
          options={sectorOptions}
          selected={selectedSectors}
          onToggle={(val) =>
            setSelectedSectors((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
        />
        <FilterDropdown
          label="Tags"
          options={tagOptions}
          selected={selectedTags}
          onToggle={(val) =>
            setSelectedTags((prev) =>
              prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
            )
          }
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStatuses([]);
              setSelectedOwners([]);
              setSelectedPriorities([]);
              setSelectedSectors([]);
              setSelectedTags([]);
              setQuery("");
            }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-muted">
          <button
            onClick={() => setView("table")}
            className={`h-8 w-8 grid place-items-center rounded-md transition-all ${view === "table" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Vue tableau"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("cards")}
            className={`h-8 w-8 grid place-items-center rounded-md transition-all ${view === "cards" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Vue cartes"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table View - version améliorée */}
      {view === "table" ? (
        <div ref={parentRef} className="card-elegant overflow-y-auto h-[600px] relative">
          <table className="w-full text-sm relative">
            <thead className="bg-muted/50 backdrop-blur-sm text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 z-10 w-full block border-b border-border">
              <tr className="grid grid-cols-[44px_1.8fr_1.2fr_1.6fr_1.9fr_0.8fr_0.8fr_0.9fr_1fr_110px] gap-x-3 items-center w-full px-4 py-3">
                <th className="text-left font-semibold w-8">
                  <input type="checkbox" className="accent-primary" />
                </th>
                <th className="text-left font-semibold">Client</th>
                <th className="text-left font-semibold">Entreprise</th>
                <th className="text-left font-semibold">Projets</th>
                <th className="text-left font-semibold">Historique</th>
                <th className="text-left font-semibold">Statut</th>
                <th className="text-left font-semibold">Priorité</th>
                <th className="text-left font-semibold">Responsable</th>
                <th className="text-right font-semibold">Valeur</th>
                <th className="text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="w-full block" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
              {filtered.length === 0 ? (
                <tr>
                  <td className="absolute inset-x-0 top-8 text-center">
                    <p className="text-sm text-muted-foreground py-10">
                      Aucun client ne correspond à ces filtres.
                    </p>
                  </td>
                </tr>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const c = filtered[virtualRow.index];
                  const projs = projectsForClient(c.id);
                  const hist = clientHistorySummary(c.name);

                  return (
                    <tr
                      key={c.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="hover:bg-muted/30 transition-colors group grid grid-cols-[44px_1.8fr_1.2fr_1.6fr_1.9fr_0.8fr_0.8fr_0.9fr_1fr_110px] gap-x-3 items-center px-4 border-b border-border/60 overflow-hidden even:bg-muted/[0.03]"
                    >
                      <td>
                        <input type="checkbox" className="accent-primary" />
                      </td>

                      {/* Client */}
                      <td className="truncate min-w-0">
                        <button
                          onClick={() => openDetails(c)}
                          className="flex items-center gap-2.5 text-left w-full min-w-0"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                              className={`bg-gradient-to-br ${c.color || "from-slate-500 to-slate-700"} text-white text-[10px] font-semibold`}
                            >
                              {c.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left min-w-0 flex-1 leading-tight">
                            <div className="font-semibold hover:text-primary transition-colors truncate text-sm" title={c.name}>
                              {c.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate" title={c.role}>
                              {c.role}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Entreprise */}
                      <td className="text-muted-foreground truncate min-w-0 text-sm" title={c.company}>
                        {c.company}
                      </td>

                      {/* Projets */}
                      <td className="truncate min-w-0">
                        {projs.length ? (
                          <div className="flex items-center gap-1.5 max-w-full">
                            <span className="h-6 w-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0 relative">
                              <Briefcase className="h-3 w-3" />
                              {projs.length > 1 && (
                                <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-0.5 rounded-full bg-primary text-white text-[7px] font-bold grid place-items-center leading-none">
                                  {projs.length}
                                </span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1 leading-tight">
                              <div className="text-xs font-semibold truncate" title={projs[0].name}>
                                {projs[0].name}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden max-w-[50px]">
                                  <div
                                    className="h-full gradient-brand rounded-full transition-all"
                                    style={{ width: `${projs[0].progress}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-primary">
                                  {projs[0].progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Historique */}
                      <td className="min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-xs min-w-0">
                          <span className="h-6 w-6 rounded-md bg-muted/60 grid place-items-center shrink-0">
                            {hist.lastChannel ? (
                              <ActivityIcon type={hist.lastChannel} size="sm" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wide truncate">
                              Dernier
                            </div>
                            <div className="font-semibold truncate text-xs" title={hist.lastLabel ?? undefined}>
                              {hist.lastLabel ?? "—"}
                            </div>
                            {hist.lastDate && (
                              <div className="text-[9px] text-muted-foreground truncate">
                                {hist.lastDate}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="truncate min-w-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${statusMap[c.status] || "bg-muted text-foreground"}`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Priorité */}
                      <td className="truncate min-w-0">
                        <div className="flex items-center gap-1.5">
                          <PriorityDot priority={c.priority} />
                          <span className="text-xs capitalize truncate">{priorityLabel[c.priority] ?? c.priority}</span>
                        </div>
                      </td>

                      {/* Responsable */}
                      <td className="text-muted-foreground truncate min-w-0 text-sm" title={c.owner}>
                        {c.owner}
                      </td>

                      {/* Valeur */}
                      <td className="text-right font-semibold truncate min-w-0 text-sm" title={`${c.value.toLocaleString("fr")} MGA`}>
                        {c.value.toLocaleString("fr")} MGA
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDetails(c)}
                            className="h-7 px-2 rounded-md text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Eye className="h-3 w-3" /> Ouvrir
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="hover:bg-muted p-1 rounded transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetails(c)}>
                                <Eye className="mr-2 h-4 w-4" /> Voir la fiche
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(c);
                                  setDialogType("edit");
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vue Cartes - inchangée mais conservée */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-border rounded-xl bg-card">
              <p className="text-sm text-muted-foreground">Aucun client ne correspond à ces filtres.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openDetails(c)}
                className="card-elegant p-5 hover:shadow-float hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-left group"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarFallback
                      className={`bg-gradient-to-br ${c.color || "from-slate-500 to-slate-700"} text-white font-semibold`}
                    >
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold group-hover:text-primary transition-colors truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.role} • {c.company}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${statusMap[c.status] || "bg-muted text-foreground"}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {c.city} • {c.sector}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex gap-1 min-w-0 overflow-hidden flex-wrap">
                    {c.tags?.slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0 whitespace-nowrap">
                    {c.value.toLocaleString("fr")} MGA
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {selectedClient && (
        <Dialog
          open={dialogType !== null}
          onOpenChange={(open) => !open && setDialogType(null)}
        >
          <DialogContent
            className={
              dialogType === "details"
                ? "max-w-2xl p-0 overflow-hidden gap-0 rounded-2xl [&>button]:hidden"
                : "max-w-lg rounded-2xl"
            }
          >
            {dialogType === "details" ? (
              <ClientDetailsModal
                client={selectedClient}
                onClose={() => setDialogType(null)}
                onEdit={() => setDialogType("edit")}
              />
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Modifier le client</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Nom complet</Label>
                      <Input
                        value={selectedClient.name}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Entreprise</Label>
                      <Input
                        value={selectedClient.company}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            company: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Rôle</Label>
                      <Input
                        value={selectedClient.role}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            role: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Email</Label>
                      <Input
                        value={selectedClient.email}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Téléphone</Label>
                      <Input
                        value={selectedClient.phone}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Statut</Label>
                      <select
                        value={selectedClient.status}
                        onChange={(e) =>
                          setSelectedClient({
                            ...selectedClient,
                            status: e.target.value,
                          })
                        }
                        className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background transition-shadow"
                      >
                        <option value="prospect">Prospect</option>
                        <option value="actif">Actif</option>
                        <option value="vip">VIP</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogType(null)}>
                    Annuler
                  </Button>
                  <Button onClick={handleEditSave} className="gradient-brand text-white border-0">
                    Enregistrer
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Modale de détails (inchangée) ──────────────────────────────────────────

function ClientDetailsModal({
  client,
  onClose,
  onEdit,
}: {
  client: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { projectsForClient, clientHistorySummary } = useCRM();
  const projs = projectsForClient(client.id);
  const hist = clientHistorySummary(client.name);

  return (
    <div className="flex flex-col max-h-[88vh]">
      {/* Hero Banner */}
      <div className="relative h-28 shrink-0 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${client.color || "from-slate-700 to-slate-900"}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_55%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,white_0%,transparent_65%)] opacity-10" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 text-white grid place-items-center transition-colors backdrop-blur-sm"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="relative z-10 bg-card px-6 -mt-10 pb-5 shrink-0 border-b border-border">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-4 min-w-0">
            <Avatar className="h-20 w-20 ring-4 ring-card shadow-float shrink-0">
              <AvatarFallback
                className={`bg-gradient-to-br ${client.color || "from-slate-500 to-slate-700"} text-white text-2xl font-bold`}
              >
                {client.initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold leading-tight truncate">{client.name}</h2>
                {client.status === "vip" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 border border-violet-200 inline-flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 fill-current" /> VIP
                  </span>
                )}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${statusMap[client.status] || "bg-muted text-foreground"}`}
                >
                  {client.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {client.role} chez{" "}
                <span className="font-medium text-foreground">
                  {client.company}
                </span>
              </p>
              {client.tags?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {client.tags.map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1 shrink-0">
            <Link
              to={`/clients/${client.id}`}
              onClick={onClose}
              className="h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              Fiche complète →
            </Link>
            <button
              onClick={onEdit}
              className="h-9 px-4 rounded-lg text-sm font-semibold gradient-brand text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Edit className="h-3.5 w-3.5" /> Modifier
            </button>
          </div>
        </div>
      </div>

      {/* Corps scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-violet-500/5 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary truncate">
              {client.value.toLocaleString("fr")} MGA
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Chiffre d'affaires
            </div>
          </div>
          <div className="rounded-xl border border-border bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600">
              {hist.totalPast ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Interactions
            </div>
          </div>
          <div className="rounded-xl border border-border bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-600">
              {projs.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Projet{projs.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Contact et commercial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Coordonnées
            </h3>
            <ContactRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
              value={client.email}
              href={`mailto:${client.email}`}
            />
            <ContactRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Téléphone"
              value={client.phone}
              href={`tel:${client.phone}`}
            />
            <ContactRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Localisation"
              value={`${client.city}, France`}
            />
            <ContactRow
              icon={<Briefcase className="h-3.5 w-3.5" />}
              label="Secteur"
              value={client.sector}
            />
          </div>
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Détails commerciaux
            </h3>
            <div className="space-y-2 text-sm">
              <CommercialRow label="Statut">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusMap[client.status] || "bg-muted text-foreground"}`}
                >
                  {client.status}
                </span>
              </CommercialRow>
              <CommercialRow label="Priorité">
                <span className="flex items-center gap-1.5">
                  <PriorityDot priority={client.priority} />
                  <span className="text-xs font-medium capitalize">
                    {priorityLabel[client.priority] ?? client.priority}
                  </span>
                </span>
              </CommercialRow>
              <CommercialRow label="Responsable">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{client.owner}</span>
                </span>
              </CommercialRow>
              <CommercialRow label="Dernier contact">
                <span className="text-xs font-medium text-muted-foreground">
                  {client.lastContact}
                </span>
              </CommercialRow>
              <CommercialRow label="Source">
                <span className="text-xs font-medium">Site web</span>
              </CommercialRow>
            </div>
          </div>
        </div>

        {/* Activités */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Activité récente
            </h3>
            {hist.lastLabel ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                {hist.lastChannel && (
                  <ActivityIcon type={hist.lastChannel} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{hist.lastLabel}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {hist.lastDate}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
                  Passé
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-2">
                Aucune interaction passée
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Activité future
            </h3>
            {hist.nextLabel ? (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03]">
                {hist.nextChannel && (
                  <ActivityIcon type={hist.nextChannel} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{hist.nextLabel}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {hist.nextDate}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                  À venir
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-2">
                Aucune activité planifiée
              </p>
            )}
          </div>
        </div>

        {/* Projets */}
        {projs.length > 0 && (
          <div className="rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Projets liés ({projs.length})
            </h3>
            <div className="space-y-2.5">
              {projs.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {p.name}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full gradient-brand rounded-full transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${p.status === "En cours"
                        ? "bg-blue-500/10 text-blue-700 border-blue-200"
                        : p.status === "Terminé"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                          : p.status === "Suspendu"
                            ? "bg-rose-500/10 text-rose-700 border-rose-200"
                            : "bg-amber-500/10 text-amber-700 border-amber-200"
                      }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <a
            href={`tel:${client.phone}`}
            className="h-11 rounded-xl border border-border hover:bg-muted flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors group"
          >
            <Phone className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            Appeler
          </a>
          <a
            href={`mailto:${client.email}`}
            className="h-11 rounded-xl border border-border hover:bg-muted flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors group"
          >
            <Mail className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            Envoyer un email
          </a>
          <NewActivityDialog
            defaultClient={client.name}
            trigger={
              <button className="h-11 rounded-xl gradient-brand text-white flex flex-col items-center justify-center gap-1 text-xs font-semibold hover:opacity-90 transition-opacity group shadow-sm">
                <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Nouvelle activité
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sous‑composants ──────────────────────────────────────────────────────────

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 group/row min-w-0">
      <span className="h-7 w-7 rounded-md bg-muted grid place-items-center text-muted-foreground shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="text-sm font-medium truncate group-hover/row:text-primary transition-colors">
          {value}
        </div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:no-underline">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}

function CommercialRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${selected.length > 0
              ? "bg-primary/10 border-primary/25 text-primary hover:bg-primary/15"
              : "bg-muted/60 border-transparent text-foreground/80 hover:bg-muted hover:border-border"
            }`}
        >
          {label}
          {selected.length > 0 && (
            <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-primary text-white text-[9px] font-bold grid place-items-center">
              {selected.length}
            </span>
          )}
          <span className="text-muted-foreground">↓</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1">
          Filtrer par {label.toLowerCase()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={checked}
              onCheckedChange={() => onToggle(opt)}
              className="text-xs capitalize"
            >
              {opt}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}