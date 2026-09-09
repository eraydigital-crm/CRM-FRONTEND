import { usePageMeta } from "@/hooks/use-page-meta";
import { useState, useMemo, useEffect } from "react";
import { Plus, Shield, Users as UsersIcon, Eye, Edit, Trash2, KeyRound, Power, Search, X } from "lucide-react";
import { members as initialMembers, Member } from "@/lib/crm-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCRM } from "@/lib/store";


const roleColor: Record<string, string> = {
  Administrateur: "bg-violet-500/10 text-violet-700 border-violet-200",
  Manager: "bg-primary/10 text-primary border-primary/20",
  Commercial: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};

const statusBadgeClass: Record<string, string> = {
  Actif: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
  Invité: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
  Désactivé: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-semibold inline-block",
};

export default function UsersPage() {
  usePageMeta("Utilisateurs — Eray CRM", "Gérez les membres, rôles et permissions de votre équipe.");
  const { members: users, setMembers: setUsers } = useCRM();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [dialogType, setDialogType] = useState<"details" | "edit" | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("Commercial");

  // Filtering states
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedRole, selectedStatus, selectedTeam]);

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());

      const matchesRole = !selectedRole || u.role === selectedRole;
      const matchesStatus = !selectedStatus || u.status === selectedStatus;
      const matchesTeam = !selectedTeam || u.team === selectedTeam;

      return matchesSearch && matchesRole && matchesStatus && matchesTeam;
    });
  }, [users, query, selectedRole, selectedStatus, selectedTeam]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, activePage]);

  const handleInvite = () => {
    if (inviteEmail) {
      const newUser: Member = {
        id: `u${Date.now()}`,
        name: "Nouvel Utilisateur",
        email: inviteEmail,
        phone: invitePhone || "+33 6 00 00 00 00",
        role: inviteRole,
        team: "Non assigné",
        status: "Invité",
        lastActive: "Jamais",
        initials: inviteEmail.substring(0, 2).toUpperCase()
      };
      setUsers([newUser, ...users]);
      setInviteEmail("");
      setInvitePhone("");
      setIsInviteOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleEditSave = () => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      setDialogType(null);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} membres • 3 équipes</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-brand text-white border-0 h-9">
              <Plus className="h-4 w-4 mr-1" /> Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Envoyez une invitation par email pour rejoindre Eray CRM.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="prenom.nom@entreprise.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input 
                  id="phone" 
                  type="text" 
                  placeholder="+33 6 12 45 78 90" 
                  value={invitePhone} 
                  onChange={(e) => setInvitePhone(e.target.value)} 
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select 
                  id="role" 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value as Member["role"])}
                  className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrateur">Administrateur</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Annuler</Button>
              <Button onClick={handleInvite} className="gradient-brand text-white border-0">Envoyer l'invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={UsersIcon} label="Membres actifs" value={users.filter(u => u.status === 'Actif').length.toString()} tone="brand" />
        <StatCard icon={Shield} label="Administrateurs" value={users.filter(u => u.role === 'Administrateur').length.toString()} tone="violet" />
        <StatCard icon={UsersIcon} label="Invitations en attente" value={users.filter(u => u.status === 'Invité').length.toString()} tone="warning" />
      </div>

      {/* Filters */}
      <div className="card-elegant p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre, un email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/60 border border-transparent focus:bg-card focus:border-ring outline-none text-sm"
          />
        </div>
        
        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Tous les rôles</option>
          <option value="Administrateur">Administrateurs</option>
          <option value="Manager">Managers</option>
          <option value="Commercial">Commerciaux</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Tous les statuts</option>
          <option value="Actif">Actif</option>
          <option value="Invité">Invité</option>
          <option value="Désactivé">Désactivé</option>
        </select>

        {/* Team Filter */}
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="h-9 rounded-lg border border-input px-3 text-xs outline-none bg-background text-foreground/80 focus:border-ring"
        >
          <option value="">Toutes les équipes</option>
          <option value="Ventes B2B">Ventes B2B</option>
          <option value="Grands comptes">Grands comptes</option>
          <option value="PME">PME</option>
          <option value="Direction">Direction</option>
          <option value="Non assigné">Non assigné</option>
        </select>

        {(query !== "" || selectedRole !== "" || selectedStatus !== "" || selectedTeam !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setSelectedRole("");
              setSelectedStatus("");
              setSelectedTeam("");
            }}
            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Réinitialiser
          </Button>
        )}
      </div>

      <div className="card-elegant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Utilisateur</th>
              <th className="text-left font-semibold px-2 py-3">Rôle</th>
              <th className="text-left font-semibold px-2 py-3">Téléphone</th>
              <th className="text-left font-semibold px-2 py-3">Statut</th>
              <th className="text-right font-semibold px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedUsers.map((m) => (
              <tr key={m.id} className="hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3.5 text-muted-foreground font-medium">
                  {m.role}
                </td>
                <td className="px-2 py-3.5 text-muted-foreground">
                  {m.phone || "—"}
                </td>
                <td className="px-2 py-3.5">
                  <span className={statusBadgeClass[m.status] || "bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-semibold"}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedUser(m);
                        setDialogType("details");
                      }} 
                      className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors"
                      title="Voir les détails"
                      data-cy="user-details-btn"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedUser(m);
                        setDialogType("edit");
                      }} 
                      className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors"
                      title="Modifier"
                      data-cy="user-edit-btn"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => {
                        toast.success(`Réinitialisation du mot de passe de ${m.name}`, { description: "Un email de réinitialisation a été envoyé." });
                      }} 
                      className="p-1.5 hover:bg-muted rounded text-foreground/70 hover:text-foreground transition-colors"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => {
                        const newStatus = m.status === "Actif" ? "Désactivé" : "Actif";
                        setUsers(users.map(u => u.id === m.id ? { ...u, status: newStatus } : u));
                        toast.success(`Statut mis à jour`, { description: `Le membre ${m.name} est maintenant ${newStatus.toLowerCase()}.` });
                      }}
                      className={`p-1.5 hover:bg-muted rounded transition-colors ${m.status === "Actif" ? "text-foreground/70 hover:text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      title={m.status === "Actif" ? "Désactiver" : "Activer"}
                    >
                      <Power className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-xs text-muted-foreground font-medium">
          Affichage {filteredUsers.length > 0 ? (activePage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(activePage * ITEMS_PER_PAGE, filteredUsers.length)} sur {filteredUsers.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-card"
            disabled={activePage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-card"
            disabled={activePage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Modals for Details and Edit */}
      {selectedUser && (
        <Dialog open={dialogType !== null} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            {dialogType === "details" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Détails du membre</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-lg font-bold">
                        {selectedUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-muted/50 p-4 rounded-xl">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Rôle</div>
                      <div className="font-medium mt-1">{selectedUser.role}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Équipe</div>
                      <div className="font-medium mt-1">{selectedUser.team}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Statut</div>
                      <div className="font-medium mt-1">{selectedUser.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Téléphone</div>
                      <div className="font-medium mt-1">{selectedUser.phone || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Dernière activité</div>
                      <div className="font-medium mt-1">{selectedUser.lastActive}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Modifier le membre</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label>Nom</Label>
                    <Input 
                      value={selectedUser.name} 
                      onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} 
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input 
                      value={selectedUser.phone || ""} 
                      onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})} 
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Rôle</Label>
                    <select 
                      value={selectedUser.role} 
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as Member["role"]})}
                      className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                    >
                      <option value="Commercial">Commercial</option>
                      <option value="Manager">Manager</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <Label>Équipe</Label>
                    <select 
                      value={selectedUser.team} 
                      onChange={(e) => setSelectedUser({...selectedUser, team: e.target.value})}
                      className="mt-2 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background"
                    >
                      <option value="Ventes B2B">Ventes B2B</option>
                      <option value="Grands comptes">Grands comptes</option>
                      <option value="PME">PME</option>
                      <option value="Direction">Direction</option>
                      <option value="Non assigné">Non assigné</option>
                    </select>
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    brand: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-600",
    warning: "bg-amber-500/10 text-amber-600",
  };
  return (
    <div className="card-elegant p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold font-display">{value}</div>
      </div>
    </div>
  );
}
