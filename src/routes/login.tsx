import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/eray.jpg";
import { authApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/http";

/**
 * Accounts seeded by the backend (CGA-BACKEND/src/DataFixtures/UserFixtures.php).
 * They all share the same fixture password; marc@eray.com is deliberately
 * disabled there, so it is not offered here.
 */
const SEEDED_PASSWORD = "Demo1234!";
const SEEDED_ACCOUNTS = [
  { initials: "AE", label: "Admin", email: "admin@eray.com" },
  { initials: "SB", label: "Manager", email: "sarah@eray.com" },
  { initials: "YM", label: "Commercial", email: "yanis@eray.com" },
  { initials: "CD", label: "Commercial", email: "claire@eray.com" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Saisissez votre e-mail, puis cliquez sur \"Mot de passe oublié\".");
      return;
    }

    try {
      await authApi.requestPasswordReset(trimmedEmail);
      toast.success("E-mail envoyé", {
        description: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.",
      });
    } catch (err) {
      toast.error("Demande impossible", {
        description: err instanceof Error ? err.message : "Réessayez plus tard.",
      });
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(SEEDED_PASSWORD);
    toast.success("Champs pré-remplis !", {
      description: `Identifiants pour ${demoEmail} ajoutés. Cliquez sur Se connecter.`,
      duration: 2000,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await authApi.login(trimmedEmail, trimmedPassword, remember);

      toast.success("Connexion réussie !", {
        description: `Bienvenue, ${user.fullName} !`,
      });

      navigate("/");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.firstFieldError ?? err.message
          : err instanceof Error
            ? err.message
            : "Une erreur est survenue. Veuillez réessayer.";
      setError(message);
      toast.error("Erreur de connexion", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-[#f4f6fa] to-[#e9edf5] dark:from-[#0c0f1d] dark:to-[#171a2c] transition-colors duration-500">
      {/* Dynamic decorative backdrop circles */}
      <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] rounded-full filter blur-[130px] opacity-35 bg-primary/20 dark:bg-primary/10 animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] rounded-full filter blur-[130px] opacity-35 bg-violet/25 dark:bg-violet/10 animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-[420px] z-10">
        {/* Glassmorphic Login Card */}
        <div className="bg-white/80 dark:bg-card/75 backdrop-blur-xl border border-white/50 dark:border-border/10 rounded-[32px] px-8 pt-10 pb-8 shadow-float hover:shadow-2xl transition-all duration-300 text-center">
          
          {/* Logo container */}
          <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border/40 shadow-sm transition-transform duration-300 hover:scale-105">
            <img src={logoUrl} alt="Eray Logo" className="h-16 w-16 object-contain" />
          </div>

          <h1 className="text-[28px] font-bold text-foreground font-display tracking-tight leading-none mb-2">
            Connexion
          </h1>
          <p className="text-muted-foreground text-[14px] mb-8 font-medium">
            Accédez à votre espace commercial
          </p>

          {/* Error panel */}
          {error && (
            <div className="bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-5 border-l-4 border-l-red-600 text-left flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block font-medium text-xs text-foreground/80 pl-1">
                Email / Identifiant
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="exemple@entreprise.fr"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block font-medium text-xs text-foreground/80 pl-1">
                Mot de passe
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs my-2 pt-1 flex-wrap gap-2">
              <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4.5 h-4.5 border-border rounded accent-primary cursor-pointer"
                />
                Se souvenir de moi
              </label>
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-primary hover:text-violet font-semibold transition-colors hover:underline"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white border-0 rounded-xl text-[15px] font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] mt-2 hover:bg-[#4338ca] hover:shadow-float shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          {/* Quick login credentials picker for developer reference */}
          <div className="mt-8 pt-6 border-t border-border/50 dark:border-border/10 text-left">
            <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Comptes de test (Sélection rapide)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {SEEDED_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  className="p-2.5 border border-border/50 dark:border-border/10 rounded-xl hover:bg-muted/50 text-left transition-all text-xs"
                >
                  <div className="font-semibold text-foreground truncate">
                    {account.initials} ({account.label})
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{account.email}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              S'inscrire
            </Link>
          </p>

          <p className="mt-6 text-[11px] text-muted-foreground tracking-[0.3px]">
            Version MVP 1.0
          </p>
        </div>
      </div>
    </div>
  );
}
