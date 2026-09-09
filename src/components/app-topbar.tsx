import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Search, Bell, Plus, ChevronDown, Command, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/eray.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  NewClientDialog,
  NewProjectDialog,
  NewOpportunityDialog,
  NewEventDialog,
} from "@/components/quick-create-dialogs";
import { NewActivityDialog } from "@/components/new-activity-dialog";

const Route = {
  useSearch: (): { q?: string } => {
    const [searchParams] = useSearchParams();
    return { q: searchParams.get("q") || undefined };
  }
};

type AppTopbarProps = {
  onMobileMenuClick: () => void;
};

type QuickAction = "client" | "activity" | "event" | "opportunity" | "project" | null;

export function AppTopbar({ onMobileMenuClick }: AppTopbarProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = Route.useSearch() || {};
  const query = search.q || "";
  const [searchTerm, setSearchTerm] = useState(query);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const setSearch = useCallback((newSearch: { q?: string }) => {
    setSearchParams(newSearch.q ? { q: newSearch.q } : {});
  }, [setSearchParams]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchTerm(val);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch({ q: searchTerm || undefined });
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, setSearch]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    navigate("/login");
  }, [navigate]);

  const [userName, setUserName] = useState("Léa Martin");
  const [userRole, setUserRole] = useState("Manager Ventes");

  useEffect(() => {
    const name = localStorage.getItem("name") || sessionStorage.getItem("name");
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");
    if (name) setUserName(name);
    if (role) {
      if (role === "admin") setUserRole("Administrateur");
      else if (role === "manager") setUserRole("Manager");
      else setUserRole("Commercial");
    }
  }, []);

  const [action, setAction] = useState<QuickAction>(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "Clair";
    }
    return "Clair";
  });

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "Sombre" ? "Clair" : "Sombre"));
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-card/85 backdrop-blur-xl border-b border-border shadow-xs transition-colors">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors md:hidden"
          onClick={onMobileMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-cy="company-menu-trigger" className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-muted transition-colors border border-border/50">
              <div className="h-6 w-6 rounded overflow-hidden bg-white flex items-center justify-center border border-border shadow-sm">
                <img src={logoUrl} alt="Eray Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="text-sm font-bold text-foreground font-display">Eray CRM</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-cy="company-menu-content" align="start" className="w-56">
            <DropdownMenuLabel>Entreprises</DropdownMenuLabel>
            <DropdownMenuItem>Eray CRM</DropdownMenuItem>
            <DropdownMenuItem>Eray Digital EU</DropdownMenuItem>
            <DropdownMenuItem>Atelier Interne</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <>
              <label htmlFor="topbar-search" className="sr-only">
                Rechercher dans le CRM
              </label>
              <input
                type="search"
                id="topbar-search"
                aria-label="Recherche"
                placeholder="Rechercher clients, activités, opportunités…"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-9 pl-9 pr-16 rounded-xl bg-muted/60 border border-border/40 hover:bg-muted focus:bg-card focus:border-ring outline-none text-sm transition-all"
              />
            </>
            <kbd className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 gradient-brand text-white border-0 hover:opacity-95 shadow-float">
                <Plus className="h-4 w-4 mr-1" /> Nouveau
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setTimeout(() => setAction("client"), 0)}>+ Nouveau client</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimeout(() => setAction("activity"), 0)}>+ Activité</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimeout(() => setAction("event"), 0)}>+ Rendez-vous</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimeout(() => setAction("opportunity"), 0)}>+ Opportunité</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setTimeout(() => setAction("project"), 0)}>+ Projet</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={toggleTheme}
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Changer de thème"
          >
            {theme === "Sombre" ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>

          <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-violet text-white text-[11px] font-semibold">
                    {userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-[12px] font-semibold">{userName}</div>
                  <div className="text-[10px] text-muted-foreground">{userRole}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Préférences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <NewClientDialog open={action === "client"} onOpenChange={(o) => !o && setAction(null)} trigger={<span />} />
      <NewActivityDialog open={action === "activity"} onOpenChange={(o) => !o && setAction(null)} trigger={<span />} />
      <NewEventDialog open={action === "event"} onOpenChange={(o) => !o && setAction(null)} trigger={<span />} />
      <NewOpportunityDialog open={action === "opportunity"} onOpenChange={(o) => !o && setAction(null)} trigger={<span />} />
      <NewProjectDialog open={action === "project"} onOpenChange={(o) => !o && setAction(null)} trigger={<span />} />
    </header>
  );
}
