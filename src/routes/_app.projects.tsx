import { usePageMeta } from "@/hooks/use-page-meta";
import { useMemo, useState } from "react";
import { useFilteredCollection } from "@/hooks/use-filtered-collection";
import { Plus, Filter, Calendar as CalendarIcon, Check, Users, Search, X, Trash2 } from "lucide-react";
import { type TaskStatus, type Project, type ProjectTask } from "@/lib/crm-data";
import { useCRM } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NewProjectDialog } from "@/components/quick-create-dialogs";


const statusMap: Record<string, string> = {
  "En cours": "bg-blue-500/10 text-blue-700 border-blue-200",
  "En attente": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Suspendu": "bg-rose-500/10 text-rose-700 border-rose-200",
  "Terminé": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};

const taskStatuses: TaskStatus[] = ["À faire", "En cours", "Terminé", "En retard"];
const taskStatusColors: Record<TaskStatus, string> = {
  "À faire": "bg-slate-400",
  "En cours": "bg-blue-500",
  "Terminé": "bg-emerald-500",
  "En retard": "bg-rose-500",
};

export default function ProjectsPage() {
  usePageMeta("Projets — Eray CRM", "Suivi simple des projets clients.");
  const { projects, setProjects, members } = useCRM();
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus[]>([...taskStatuses]);
  const [memberFilter, setMemberFilter] = useState<string[]>([]); // initials
  
  // Filtering & dialog states
  const [query, setQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  const filters = useMemo(() => [
    (p: any) => projectStatusFilter.length === 0 || projectStatusFilter.includes(p.status),
    (p: any) => memberFilter.length === 0 || p.team.some((m: string) => memberFilter.includes(m)),
    (p: any) => p.tasks.some((t: any) => taskStatusFilter.includes(t.status)),
  ], [projectStatusFilter, memberFilter, taskStatusFilter]);

  const searchFields = useMemo(() => ["name" as const, "client" as const], []);

  const filtered = useFilteredCollection(projects, {
    search: query,
    searchFields,
    filters,
  });

  const toggleStatus = (s: TaskStatus) =>
    setTaskStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleMember = (m: string) =>
    setMemberFilter((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const handleToggleTask = (projectId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: TaskStatus = t.status === "Terminé" ? "À faire" : "Terminé";
        return { ...t, status: nextStatus };
      });
      const doneCount = updatedTasks.filter((t) => t.status === "Terminé").length;
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0;
      const nextProj = { ...p, tasks: updatedTasks, progress };
      if (selectedProject?.id === projectId) setSelectedProject(nextProj);
      return nextProj;
    });
    setProjects(updated);
  };

  const handleChangeTaskStatus = (projectId: string, taskId: string, newStatus: TaskStatus) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, status: newStatus };
      });
      const doneCount = updatedTasks.filter((t) => t.status === "Terminé").length;
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0;
      const nextProj = { ...p, tasks: updatedTasks, progress };
      if (selectedProject?.id === projectId) setSelectedProject(nextProj);
      return nextProj;
    });
    setProjects(updated);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tasks.filter((t) => t.id !== taskId);
      const doneCount = updatedTasks.filter((t) => t.status === "Terminé").length;
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0;
      const nextProj = { ...p, tasks: updatedTasks, progress };
      if (selectedProject?.id === projectId) setSelectedProject(nextProj);
      return nextProj;
    });
    setProjects(updated);
  };

  const handleAddTask = (projectId: string) => {
    if (!newTaskLabel.trim()) return;
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      const newTask: ProjectTask = {
        id: `t_${Date.now()}`,
        label: newTaskLabel.trim(),
        status: "À faire",
        assignee: newTaskAssignee || p.team[0] || "LM",
        due: newTaskDue || new Date().toISOString().slice(0, 10),
      };
      const updatedTasks = [...p.tasks, newTask];
      const doneCount = updatedTasks.filter((t) => t.status === "Terminé").length;
      const progress = Math.round((doneCount / updatedTasks.length) * 100);
      const nextProj = { ...p, tasks: updatedTasks, progress };
      if (selectedProject?.id === projectId) setSelectedProject(nextProj);
      return nextProj;
    });
    setProjects(updated);
    setNewTaskLabel("");
    setNewTaskAssignee("");
    setNewTaskDue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Projets clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} / {projects.length} projets clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un projet, client…"
              className="h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm w-48"
            />
          </div>

          {/* Project Status popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Statut projets
                {projectStatusFilter.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">{projectStatusFilter.length}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2 bg-card border border-border rounded-lg shadow-xl z-50">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">Statut Projets</div>
              {["En cours", "En attente", "Suspendu", "Terminé"].map((s) => {
                const active = projectStatusFilter.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setProjectStatusFilter((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      );
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted"
                  >
                    <span className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}>
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 text-left">{s}</span>
                  </button>
                );
              })}
              {projectStatusFilter.length > 0 && (
                <button
                  onClick={() => setProjectStatusFilter([])}
                  className="w-full mt-1 pt-1 border-t border-border text-xs font-semibold text-muted-foreground hover:bg-muted rounded py-1"
                >
                  Réinitialiser
                </button>
              )}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Statut tâches
                <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">{taskStatusFilter.length}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2 bg-card border border-border rounded-lg shadow-xl z-50">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">Statuts</div>
              {taskStatuses.map((s) => {
                const active = taskStatusFilter.includes(s);
                return (
                  <button key={s} onClick={() => toggleStatus(s)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted">
                    <span className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}>
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-sm ${taskStatusColors[s]}`} />
                    <span className="flex-1 text-left">{s}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Users className="h-4 w-4 mr-1" /> Équipe
                {memberFilter.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full bg-primary/10 text-primary">{memberFilter.length}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-2 bg-card border border-border rounded-lg shadow-xl z-50">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground px-2 py-1.5">Membres de l'équipe</div>
              {members.map((m) => {
                const active = memberFilter.includes(m.initials);
                return (
                  <button key={m.id} onClick={() => toggleMember(m.initials)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted">
                    <span className={`h-4 w-4 rounded border grid place-items-center ${active ? "bg-primary border-primary text-white" : "border-input"}`}>
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <Avatar className="h-6 w-6"><AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[9px] font-semibold">{m.initials}</AvatarFallback></Avatar>
                    <span className="flex-1 text-left text-xs">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.role}</span>
                  </button>
                );
              })}
              {memberFilter.length > 0 && (
                <button onClick={() => setMemberFilter([])} className="w-full mt-1 pt-1 border-t border-border text-xs font-semibold text-muted-foreground hover:bg-muted rounded py-1">
                  Réinitialiser
                </button>
              )}
            </PopoverContent>
          </Popover>

          {(query !== "" || projectStatusFilter.length > 0 || memberFilter.length > 0 || taskStatusFilter.length !== taskStatuses.length) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setProjectStatusFilter([]);
                setMemberFilter([]);
                setTaskStatusFilter([...taskStatuses]);
              }}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
            >
              <X className="h-4 w-4" /> Réinitialiser
            </Button>
          )}

          <NewProjectDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const counts = taskStatuses.reduce((acc, s) => {
            acc[s] = p.tasks.filter((t) => t.status === s).length;
            return acc;
          }, {} as Record<TaskStatus, number>);
          return (
            <div key={p.id} className="card-elegant p-5 hover:shadow-float transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base leading-tight">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.client}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusMap[p.status]}`}>{p.status}</span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">Progression</span>
                    <span className="font-bold text-primary">{p.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Début</div>
                    <div className="font-medium mt-0.5">{p.start}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Fin</div>
                    <div className="font-medium mt-0.5">{p.end}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Tâches ({p.tasks.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {taskStatuses.map((s) =>
                      counts[s] > 0 ? (
                        <span key={s} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted">
                          <span className={`h-1.5 w-1.5 rounded-full ${taskStatusColors[s]}`} />
                          {counts[s]} {s}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center -space-x-1.5">
                  {p.team.map((i) => (
                    <Avatar key={i} className="h-7 w-7 ring-2 ring-card">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[10px] font-semibold">{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={() => setSelectedProject(p)}>Ouvrir</Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Aucun projet ne correspond aux filtres.</p>
        </div>
      )}

      {/* Project details dialog */}
      {selectedProject && (
        <Popover open={Boolean(selectedProject)} onOpenChange={(o) => !o && setSelectedProject(null)}>
          <PopoverContent className="w-full max-w-xl p-6 bg-card border border-border shadow-2xl rounded-2xl z-50" align="center">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold font-display">{selectedProject.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Client : {selectedProject.client} • Responsable : {selectedProject.owner}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusMap[selectedProject.status]}`}>
                {selectedProject.status}
              </span>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Progression globale</span>
                  <span className="font-bold text-primary">{selectedProject.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${selectedProject.progress}%` }} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Tâches ({selectedProject.tasks.length})</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedProject.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition">
                      <input
                        type="checkbox"
                        checked={t.status === "Terminé"}
                        onChange={() => handleToggleTask(selectedProject.id, t.id)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block ${t.status === "Terminé" ? "line-through text-muted-foreground" : "font-medium"}`}>
                          {t.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Assigné à: <span className="font-semibold text-foreground">{t.assignee}</span> • Échéance: <span className="font-semibold text-foreground">{t.due}</span>
                        </span>
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => handleChangeTaskStatus(selectedProject.id, t.id, e.target.value as TaskStatus)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white border-0 outline-none cursor-pointer ${taskStatusColors[t.status]}`}
                      >
                        {taskStatuses.map((s) => (
                          <option key={s} value={s} className="bg-card text-foreground">
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteTask(selectedProject.id, t.id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition shrink-0"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border mt-3">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">Nouvelle tâche</div>
                <input
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  placeholder="Nom de la tâche..."
                  className="w-full h-9 rounded-lg border border-input px-3 text-xs outline-none bg-card focus:border-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask(selectedProject.id)}
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-input px-2 text-xs outline-none bg-card focus:border-ring"
                  >
                    <option value="">Assigner à...</option>
                    {selectedProject.team.map((initials) => {
                      const member = members.find((m) => m.initials === initials);
                      return (
                        <option key={initials} value={initials}>
                          {member ? `${member.name} (${initials})` : initials}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-input px-2 text-xs outline-none bg-card focus:border-ring"
                  />
                  <Button size="sm" onClick={() => handleAddTask(selectedProject.id)} className="h-9 gradient-brand text-white border-0 text-xs px-3">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setProjects(projects.filter((p) => p.id !== selectedProject.id));
                  setSelectedProject(null);
                }}
              >
                Supprimer le projet
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectedProject(null)}>
                Fermer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

