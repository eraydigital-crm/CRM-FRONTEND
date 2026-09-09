import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  MessageCircle,
  Calendar as CalendarIcon,
  StickyNote,
  Clock,
  FileText,
  Send,
  Plus,
  Building2,
  Star,
  Linkedin,
  Twitter,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useCRM } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityIcon, StatusBadge, PriorityDot } from "@/components/crm-atoms";
import { NewActivityDialog } from "@/components/new-activity-dialog";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ClientDetail() {
  const { id } = useParams();
  const {
    clients: allClients,
    activities,
    isLoading,
    projectForClient,
    projectsForClient,
    eventsForClient,
  } = useCRM();
  const client = allClients.find((c) => c.id === id);

  usePageMeta(
    client ? `${client.name} — Eray CRM` : "Client — Eray CRM",
    client ? `Fiche complète de ${client.name} chez ${client.company}.` : "Fiche client"
  );

  if (!client) {
    return (
      <div className="card-elegant p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Chargement de la fiche client…" : "Ce client est introuvable ou vous n'y avez pas accès."}
        </p>
        <Link to="/clients" className="text-sm text-primary font-semibold mt-3 inline-block">
          Retour aux clients
        </Link>
      </div>
    );
  }

  const project = projectForClient(client.id);
  const clientProjects = projectsForClient(client.id);
  const { past: pastEvents, upcoming: upcomingEvents } = eventsForClient(client.name);
  const clientActivities = activities.filter((a) => a.client === client.name);
  const past = clientActivities.filter((a) => a.status === "terminé");
  const upcoming = clientActivities.filter((a) => a.status !== "terminé");

  // Notes state
  const [notes, setNotes] = useState<{id: string; text: string; date: string}[]>([]);
  const [newNote, setNewNote] = useState("");

  // Files state
  const [files, setFiles] = useState<{name: string; size: string; date: string}[]>([]);

  return (
    <div className="space-y-5">
      <Link to="/clients" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Clients
      </Link>

      {/* Header card */}
      <div className="card-elegant overflow-hidden">
        <div className="h-24 gradient-brand relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_50%)] opacity-20" />
        </div>
        <div className="relative z-10 bg-card px-6 pb-5 -mt-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:items-end sm:justify-between">
            <div className="flex items-end gap-4 min-w-0">
              <Avatar className="h-20 w-20 ring-4 ring-card shadow-float shrink-0">
                <AvatarFallback className={`bg-gradient-to-br ${client.color} text-white text-xl font-bold`}>
                  {client.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold truncate">{client.name}</h1>
                  {client.status === "vip" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 border border-violet-200 inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> VIP
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {client.role} chez <span className="font-medium text-foreground">{client.company}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {client.tags.map((t: string) => (
                    <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <NewActivityDialog
                defaultClient={client.name}
                trigger={
                  <Button size="sm" variant="outline" className="h-9">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouvelle activité
                  </Button>
                }
              />
              <QuickAction icon={Phone} label="Appeler" />
              <QuickAction icon={CalendarIcon} label="Planifier RDV" />
              <QuickAction icon={StickyNote} label="Note" />
              <QuickAction icon={Clock} label="Relance" />
              <QuickAction icon={Send} label="Proposition" primary />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="card-elegant p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Coordonnées</h3>
            <div className="space-y-2.5 text-sm">
              <InfoRow icon={Mail} value={client.email} />
              <InfoRow icon={Phone} value={client.phone} />
              <InfoRow icon={MessageCircle} value="+33 6 12 34 56 78" hint="WhatsApp" />
              <InfoRow icon={Globe} value="ateliernord.fr" />
              <InfoRow icon={MapPin} value={`${client.city}, France`} />
              <div className="flex items-center gap-2 pt-1">
                <a className="h-7 w-7 grid place-items-center rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-3.5 w-3.5" /></a>
                <a className="h-7 w-7 grid place-items-center rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          </div>

          <div className="card-elegant p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Détails commerciaux</h3>
            <dl className="space-y-2.5 text-sm">
              <DetailRow label="Statut">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-700 border-violet-200 capitalize">{client.status}</span>
              </DetailRow>
              <DetailRow label="Priorité">
                <span className="flex items-center gap-1.5"><PriorityDot priority={client.priority} /><span className="capitalize">{client.priority}</span></span>
              </DetailRow>
              <DetailRow label="Source">Site web</DetailRow>
              <DetailRow label="Secteur">{client.sector}</DetailRow>
              <DetailRow label="Besoin">Refonte CRM</DetailRow>
              <DetailRow label="Budget">80–120 K MGA</DetailRow>
              <DetailRow label="Responsable">{client.owner}</DetailRow>
            </dl>
          </div>

          <div className="card-elegant p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Chiffre d'affaires</h3>
            <div className="text-3xl font-bold font-display text-gradient-brand">{client.value.toLocaleString("fr")} MGA</div>
            <div className="text-xs text-muted-foreground mt-1">Sur les 12 derniers mois</div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-brand rounded-full w-[68%]" />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5">68% de l'objectif annuel</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-elegant p-5">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-muted/60 h-10">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="activities">Activités</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="meetings">Rendez-vous</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="project">Projet</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="files">Pièces jointes</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-5 space-y-6">
              {/* Prochaines actions */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-display font-bold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" /> Prochaines actions
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {upcomingEvents.length + upcoming.length}
                    </span>
                  </h3>
                  <NewActivityDialog
                    defaultClient={client.name}
                    trigger={
                      <button className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Planifier
                      </button>
                    }
                  />
                </div>
                <div className="grid gap-2">
                  {upcomingEvents.map((e) => (
                    <div key={e.id} className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] flex items-start gap-3">
                      <ActivityIcon type={e.channel} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{e.title}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-700 border-blue-200 capitalize">
                            {e.channel === "whatsapp" ? "WhatsApp" : e.channel}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {e.date} à {e.time} • {e.owner}
                        </div>
                        {e.summary && <p className="text-xs text-foreground/70 mt-1.5">{e.summary}</p>}
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Terminer</Button>
                    </div>
                  ))}
                  {(upcoming.length ? upcoming : DEFAULT_UPCOMING).map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] flex items-start gap-3">
                      <ActivityIcon type={a.type} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{a.title}</span>
                          <StatusBadge status={a.status} />
                          <PriorityDot priority={a.priority} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {a.date} à {a.time} • {a.owner}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Terminer</Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Historique */}
              <section>
                <h3 className="text-sm font-display font-bold flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Historique complet
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {pastEvents.length + past.length}
                  </span>
                </h3>
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  {pastEvents.map((e) => (
                    <div key={e.id} className="relative pb-4">
                      <div className="absolute -left-6 top-1 h-6 w-6 rounded-full bg-card border-2 border-primary grid place-items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="p-3 rounded-lg border border-border hover:shadow-elegant transition-shadow">
                        <div className="flex items-start gap-3">
                          <ActivityIcon type={e.channel} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{e.title}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground capitalize">
                                {e.channel === "whatsapp" ? "WhatsApp" : e.channel}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {e.date} à {e.time} • par {e.owner}
                            </div>
                            {e.summary && <p className="text-sm text-foreground/80 mt-2">{e.summary}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(past.length ? past : activities.slice(0, 3)).map((a) => (
                    <div key={a.id} className="relative pb-4 last:pb-0">
                      <div className="absolute -left-6 top-1 h-6 w-6 rounded-full bg-card border-2 border-primary grid place-items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="p-3 rounded-lg border border-border hover:shadow-elegant transition-shadow">
                        <div className="flex items-start gap-3">
                          <ActivityIcon type={a.type} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{a.title}</span>
                              <StatusBadge status={a.status} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {a.date} à {a.time} • par {a.owner} {a.duration && `• ${a.duration}`}
                            </div>
                            {a.summary && (
                              <p className="text-xs text-muted-foreground mt-2 border-l-2 border-primary/30 bg-muted/40 pl-3 py-1.5 pr-2 rounded-r-md leading-relaxed">
                                {a.summary}
                              </p>
                            )}
                            {a.result && <p className="text-[11px] text-emerald-800 bg-emerald-50 mt-2 inline-block px-2 py-0.5 rounded border border-emerald-200">✓ {a.result}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="general" className="mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Field label="Nom" value={client.name} />
                <Field label="Entreprise" value={client.company} />
                <Field label="Poste" value={client.role} />
                <Field label="Email" value={client.email} />
                <Field label="Téléphone" value={client.phone} />
                <Field label="Ville" value={client.city} />
                <Field label="Secteur" value={client.sector} />
                <Field label="Source" value="Site web" />
              </div>
            </TabsContent>

            <TabsContent value="activities" className="mt-5">
              <ActivityList activities={clientActivities} />
            </TabsContent>
            <TabsContent value="tasks" className="mt-5"><EmptyBlock label="Aucune tâche en cours" /></TabsContent>
            <TabsContent value="meetings" className="mt-5"><EmptyBlock label="Aucun rendez-vous à venir" /></TabsContent>
            <TabsContent value="pipeline" className="mt-5"><EmptyBlock label="1 opportunité en cours — 82 500 MGA" /></TabsContent>
            <TabsContent value="project" className="mt-5">
              {clientProjects.length ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {clientProjects.length} projet{clientProjects.length > 1 ? "s" : ""} lié{clientProjects.length > 1 ? "s" : ""} à ce client
                    </div>
                    <Button size="sm" variant="outline" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" /> Nouveau projet</Button>
                  </div>
                  {clientProjects.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border p-5 bg-gradient-to-br from-primary/5 to-violet/5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                            <Briefcase className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display font-bold text-base leading-tight">{p.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Projet #{p.id.toUpperCase()} • Responsable {p.owner}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-700 border-blue-200">
                          {p.status}
                        </span>
                      </div>

                      <div className="mt-5">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium">Progression</span>
                          <span className="font-bold text-primary">{p.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full gradient-brand rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Début</div>
                          <div className="font-semibold mt-0.5">{p.start}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Fin prévue</div>
                          <div className="font-semibold mt-0.5">{p.end}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Emplacement</div>
                          <div className="font-semibold mt-0.5">{client.city}, France</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Tâches</div>
                          <div className="font-semibold mt-0.5">{p.tasks.filter(t => t.status === "Terminé").length} / {p.tasks.length}</div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Équipe projet</h4>
                        <div className="flex items-center gap-2">
                          {p.team.map((i) => (
                            <Avatar key={i} className="h-8 w-8 ring-2 ring-card">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[10px] font-semibold">{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          <Button variant="outline" size="sm" className="h-8 text-xs ml-1"><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock label="Aucun projet actif pour ce client" />
              )}
            </TabsContent>
            <TabsContent value="notes" className="mt-5">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Écrire une note…"
                    className="flex-1 h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newNote.trim()) {
                        setNotes([{ id: `n_${Date.now()}`, text: newNote.trim(), date: new Date().toLocaleString("fr") }, ...notes]);
                        setNewNote("");
                      }
                    }}
                  />
                  <Button onClick={() => {
                    if (newNote.trim()) {
                      setNotes([{ id: `n_${Date.now()}`, text: newNote.trim(), date: new Date().toLocaleString("fr") }, ...notes]);
                      setNewNote("");
                    }
                  }}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
                </div>
                {notes.length === 0 ? (
                  <EmptyBlock label="Aucune note enregistrée" />
                ) : (
                  <ul className="space-y-2">
                    {notes.map(n => (
                      <li key={n.id} className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-sm">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
            <TabsContent value="files" className="mt-5">
              <div className="space-y-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []).map(f => ({
                        name: f.name,
                        size: f.size < 1024 ? `${f.size} o` : f.size < 1048576 ? `${(f.size/1024).toFixed(1)} Ko` : `${(f.size/1048576).toFixed(1)} Mo`,
                        date: new Date().toLocaleString("fr")
                      }));
                      setFiles([...newFiles, ...files]);
                    }}
                  />
                  <Button variant="outline" size="sm" asChild><span><Plus className="h-4 w-4 mr-1" /> Ajouter un fichier</span></Button>
                </label>
                {files.length === 0 ? (
                  <EmptyBlock label="Aucune pièce jointe" />
                ) : (
                  <ul className="space-y-2">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-[10px] text-muted-foreground">{f.size} • {f.date}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, primary }: { icon: any; label: string; primary?: boolean }) {
  return (
    <Button
      size="sm"
      variant={primary ? "default" : "outline"}
      className={primary ? "gradient-brand text-white border-0 h-9" : "h-9"}
    >
      <Icon className="h-3.5 w-3.5 mr-1.5" /> {label}
    </Button>
  );
}

function InfoRow({ icon: Icon, value, hint }: { icon: any; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-foreground/90">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate">{value}</span>
      {hint && <span className="text-[10px] text-muted-foreground ml-auto">{hint}</span>}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right">{children}</dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function ActivityList({ activities }: { activities: any[] }) {
  return (
    <ul className="divide-y divide-border">
      {activities.slice(0, 6).map((a) => (
        <li key={a.id} className="py-3 flex items-center gap-3">
          <ActivityIcon type={a.type} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{a.title}</div>
            <div className="text-xs text-muted-foreground">{a.date} • {a.owner}</div>
          </div>
          <StatusBadge status={a.status} />
        </li>
      ))}
    </ul>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-elegant p-3">
      <div className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</div>
      <div className="text-lg font-display font-bold mt-0.5">{value}</div>
    </div>
  );
}

const DEFAULT_UPCOMING: import("@/lib/crm-data").Activity[] = [
  { id: "up1", type: "meeting", title: "Prochain rendez-vous stratégique", client: "", owner: "Léa Martin", date: "Ven. 12/07", time: "14:00", duration: "1h", status: "planifié", priority: "high" },
  { id: "up2", type: "email", title: "Envoyer proposition commerciale", client: "", owner: "Léa Martin", date: "Lun. 15/07", time: "09:30", status: "à faire", priority: "medium" },
];

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="text-center py-14 border-2 border-dashed border-border rounded-xl">
      <div className="h-12 w-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button size="sm" variant="outline" className="mt-3"><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter</Button>
    </div>
  );
}
