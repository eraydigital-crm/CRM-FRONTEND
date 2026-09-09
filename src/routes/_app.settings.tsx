import { usePageMeta } from "@/hooks/use-page-meta";
import { useState, useEffect } from "react";
import { User, Users, Bell, Palette, Settings as SettingsIcon, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sections = [
  { id: "profile", label: "Profil", icon: User },
  { id: "teams", label: "Équipes", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display", label: "Affichage", icon: Palette },
  { id: "general", label: "Général", icon: SettingsIcon },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "billing", label: "Facturation", icon: CreditCard },
] as const;

export default function SettingsPage() {
  usePageMeta("Paramètres — Eray CRM", "Configurez votre profil, votre équipe et vos préférences.");
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Personnalisez Eray CRM pour votre équipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <nav className="card-elegant p-2 h-fit">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {active === "profile" && <ProfileSection />}
          {active === "teams" && <TeamsSection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "display" && <DisplaySection />}
          {active === "general" && <GeneralSection />}
          {active === "security" && <SecuritySection />}
          {active === "billing" && <BillingSection />}
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant p-6">
      <div className="mb-5">
        <h3 className="font-display font-bold text-lg">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function ProfileSection() {
  return (
    <>
      <Card title="Profil utilisateur" desc="Ces informations sont visibles par les membres de votre équipe.">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-xl font-bold">LM</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">Changer la photo</Button>
            <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG • 2 Mo max</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <FormField label="Prénom" value="Léa" />
          <FormField label="Nom" value="Martin" />
          <FormField label="Email professionnel" value="lea.martin@eray.com" />
          <FormField label="Téléphone" value="+33 6 12 34 56 78" />
          <FormField label="Poste" value="Manager Ventes B2B" />
          <FormField label="Fuseau horaire" value="Europe/Paris (UTC+2)" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline">Annuler</Button>
          <Button className="gradient-brand text-white border-0">Enregistrer</Button>
        </div>
      </Card>
    </>
  );
}

function TeamsSection() {
  const [teams, setTeams] = useState([
    { id: 1, name: "Ventes B2B", members: 4 },
    { id: 2, name: "Grands comptes", members: 5 },
    { id: 3, name: "PME", members: 6 },
    { id: 4, name: "Direction", members: 7 }
  ]);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manageTeam, setManageTeam] = useState<{id: number, name: string, members: number} | null>(null);

  const handleCreate = () => {
    if (newTeamName.trim()) {
      setTeams([...teams, { id: Date.now(), name: newTeamName, members: 1 }]);
      setNewTeamName("");
      setIsCreateOpen(false);
    }
  };

  const handleDelete = (id: number) => {
    setTeams(teams.filter(t => t.id !== id));
    setManageTeam(null);
  };

  return (
    <Card title="Équipes" desc="Organisez vos commerciaux par équipe.">
      <ul className="divide-y divide-border">
        {teams.map((t) => (
          <li key={t.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.members} membres</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setManageTeam(t)}>Gérer</Button>
          </li>
        ))}
      </ul>
      
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 gradient-brand text-white border-0">+ Créer une équipe</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une équipe</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle équipe pour regrouper vos collaborateurs.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Nom de l'équipe</Label>
            <Input id="name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="mt-2" placeholder="Ex: Ventes B2C" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} className="gradient-brand border-0">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageTeam} onOpenChange={(open) => !open && setManageTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l'équipe {manageTeam?.name}</DialogTitle>
            <DialogDescription>Modifiez les paramètres ou supprimez cette équipe.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="p-3 bg-muted rounded-lg border text-sm">
               Il y a actuellement {manageTeam?.members} membres dans cette équipe. (La gestion des membres se fera dans un autre module).
             </div>
             <Button variant="destructive" onClick={() => manageTeam && handleDelete(manageTeam.id)}>Supprimer l'équipe</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NotificationsSection() {
  const items = [
    { label: "Nouvelle activité assignée", desc: "Recevoir un email dès qu'une activité vous est assignée.", on: true },
    { label: "Rappel de tâches", desc: "Notification 15 min avant chaque tâche planifiée.", on: true },
    { label: "Opportunité gagnée / perdue", desc: "Suivre les évolutions du pipeline commercial.", on: true },
    { label: "Résumé quotidien", desc: "Email récapitulatif chaque matin à 08:00.", on: false },
    { label: "Mentions dans les notes", desc: "Quand un collègue vous mentionne @vous.", on: true },
  ];
  return (
    <Card title="Notifications" desc="Choisissez quand et comment être alerté.">
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.label} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-sm">{n.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
            </div>
            <Switch defaultChecked={n.on} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DisplaySection() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "Clair";
    }
    return "Clair";
  });
  const [density, setDensity] = useState("Confortable");
  const [language, setLanguage] = useState("Français");

  useEffect(() => {
    const handleThemeChange = () => {
      const current = localStorage.getItem("theme") || "Clair";
      setTheme((prev) => (prev !== current ? current : prev));
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme === "Sombre") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "Sombre");
    } else if (theme === "Clair") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "Clair");
    } else {
      localStorage.setItem("theme", "Système");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    window.dispatchEvent(new Event("theme-change"));
  }, [theme]);

  return (
    <Card title="Préférences d'affichage">
      <div className="space-y-6">
        <div>
          <div className="text-sm font-semibold mb-2">Thème</div>
          <div className="grid grid-cols-3 gap-3">
            {["Clair", "Sombre", "Système"].map((t) => (
              <button 
                key={t} 
                onClick={() => setTheme(t)}
                className={`p-3 rounded-xl border ${theme === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground/70"} text-sm font-medium transition`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Densité</div>
          <div className="grid grid-cols-3 gap-3">
            {["Compacte", "Confortable", "Aérée"].map((t) => (
              <button 
                key={t} 
                onClick={() => setDensity(t)}
                className={`p-3 rounded-xl border ${density === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground/70"} text-sm font-medium transition`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Langue</div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background transition-colors"
          >
            <option value="Français">Français</option>
            <option value="English">English</option>
            <option value="Español">Español</option>
          </select>
        </div>
      </div>
    </Card>
  );
}

function GeneralSection() {
  return (
    <Card title="Paramètres généraux">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nom de l'entreprise" value="Eray SAS" />
        <FormField label="Site web" value="eray.com" />
        <FormField label="Devise par défaut" value="MGA" />
        <FormField label="Format de date" value="JJ/MM/AAAA" />
      </div>
    </Card>
  );
}

function SecuritySection() {
  return (
    <Card title="Sécurité" desc="Gérez vos mots de passe et la sécurité de votre compte.">
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Changer le mot de passe</h4>
          <FormField label="Mot de passe actuel" type="password" />
          <FormField label="Nouveau mot de passe" type="password" />
          <FormField label="Confirmer le mot de passe" type="password" />
          <Button className="mt-2">Mettre à jour le mot de passe</Button>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Authentification à deux facteurs (2FA)</h4>
              <p className="text-xs text-muted-foreground mt-1">Sécurisez votre compte avec une étape de validation supplémentaire.</p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Sessions actives</h4>
              <p className="text-xs text-muted-foreground mt-1">Déconnectez-vous de tous les autres appareils.</p>
            </div>
            <Button variant="outline" size="sm">Déconnecter tout</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BillingSection() {
  return (
    <Card title="Facturation" desc="Gérez votre abonnement et vos informations de paiement.">
      <div className="space-y-6">
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Plan actuel</div>
            <h4 className="font-display text-2xl font-bold text-foreground">Pro</h4>
            <p className="text-sm text-muted-foreground mt-1">49 MGA / mois par utilisateur. Prochaine facture le 15 Août.</p>
          </div>
          <Button className="shrink-0 gradient-brand text-white border-0">Changer de forfait</Button>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-4">Moyen de paiement</h4>
          <div className="flex items-center justify-between p-4 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-muted rounded flex items-center justify-center text-xs font-bold border border-border/50">VISA</div>
              <div>
                <p className="text-sm font-medium">Visa se terminant par 4242</p>
                <p className="text-xs text-muted-foreground">Expire le 12/2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Mettre à jour</Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Historique des factures</h4>
          <ul className="divide-y divide-border border border-border rounded-xl">
            {[
              { date: "15 Juil. 2026", amount: "196,00 MGA", id: "#INV-4029" },
              { date: "15 Juin 2026", amount: "196,00 MGA", id: "#INV-3810" },
              { date: "15 Mai 2026", amount: "196,00 MGA", id: "#INV-3592" }
            ].map(inv => (
              <li key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.date}</p>
                  <p className="text-xs text-muted-foreground">{inv.id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{inv.amount}</span>
                  <Button variant="ghost" size="sm" className="text-primary">Télécharger</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function FormField({ label, value, type = "text" }: { label: string; value?: string; type?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type={type} defaultValue={value} className="mt-1.5 w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-background" />
    </div>
  );
}
