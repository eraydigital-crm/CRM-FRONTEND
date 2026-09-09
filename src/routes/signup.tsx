import React, { useState, FormEvent, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, User, Briefcase, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/eray.jpg";
import { authApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/http";

export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Password Strength Meter Logic ---
  const strengthScore = useMemo(() => {
    let score = 0;
    if (password.length === 0) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthDetails = useMemo(() => {
    const configs = [
      { text: "8 caractères minimum", color: "bg-slate-200" },
      { text: "Faible", color: "bg-red-500" },
      { text: "Moyen", color: "bg-amber-500" },
      { text: "Bon", color: "bg-yellow-500" },
      { text: "Excellent", color: "bg-emerald-500" },
    ];
    return configs[strengthScore];
  }, [strengthScore]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedConfirmPassword = confirmPassword;

    // Front-end validations
    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !role || !trimmedPassword || !trimmedConfirmPassword) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!termsAccepted) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    setIsLoading(true);

    try {
      // Public registration always creates a COMMERCIAL account: the backend
      // ignores any elevated role, only an admin can promote a member.
      await authApi.register({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password: trimmedPassword,
        company: trimmedCompany || null,
      });

      setSuccess("Compte créé avec succès ! Vérifiez votre boîte mail, puis connectez-vous.");
      toast.success("Compte créé !", {
        description: `Un e-mail de confirmation a été envoyé à ${trimmedEmail}.`,
      });

      // Redirect to login screen after 1.8 seconds
      setTimeout(() => {
        navigate("/login");
      }, 1800);

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.firstFieldError ?? err.message
          : err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de l'inscription.";
      setError(message);
      toast.error("Inscription impossible", { description: message });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-[#f4f6fa] to-[#e9edf5] dark:from-[#0c0f1d] dark:to-[#171a2c] transition-colors duration-500">
      {/* Decorative meshes */}
      <div className="absolute top-[-20%] left-[-10%] w-[650px] h-[650px] rounded-full filter blur-[140px] opacity-35 bg-primary/20 dark:bg-primary/10 animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full filter blur-[140px] opacity-35 bg-violet/25 dark:bg-violet/10 animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-[460px] z-10 transition-elegant">
        {/* Glassmorphic signup card */}
        <div className="bg-white/80 dark:bg-card/75 backdrop-blur-xl border border-white/50 dark:border-border/10 rounded-[32px] px-8 pt-10 pb-8 shadow-float hover:shadow-2xl transition-all duration-300 text-center">
          
          {/* Logo */}
          <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border/40 shadow-sm transition-transform duration-300 hover:scale-105">
            <img src={logoUrl} alt="Eray Logo" className="h-16 w-16 object-contain" />
          </div>

          <h1 className="text-[28px] font-bold text-foreground font-display tracking-tight leading-none mb-2">
            Créer un compte
          </h1>
          <p className="text-muted-foreground text-[14px] mb-8 font-medium">
            Rejoignez votre espace commercial
          </p>

          {/* Feedback panels */}
          {error && (
            <div className="bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-semibold mb-5 border-l-4 border-l-red-600 text-left flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-400 px-4 py-3 rounded-xl text-xs font-semibold mb-5 border-l-4 border-l-green-600 text-left flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="firstName" className="block font-medium text-xs text-foreground/80 pl-1">
                  Prénom
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="Jean"
                    required
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="lastName" className="block font-medium text-xs text-foreground/80 pl-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Dupont"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company" className="block font-medium text-xs text-foreground/80 pl-1">
                Entreprise
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Briefcase className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  id="company"
                  placeholder="Nom de votre entreprise"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block font-medium text-xs text-foreground/80 pl-1">
                Email professionnel
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="block font-medium text-xs text-foreground/80 pl-1">
                Rôle
              </label>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1rem"
                }}
              >
                <option value="" disabled>Sélectionnez votre rôle</option>
                <option value="commercial">Commercial</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
              <p className="text-[11px] text-muted-foreground pl-1">
                Tout nouveau compte démarre en Commercial : un administrateur ajuste le rôle ensuite.
              </p>
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

              {/* Password strength meter rendering */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1 pl-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          index <= strengthScore ? strengthDetails.color : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-wide">
                    Force : {strengthDetails.text}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block font-medium text-xs text-foreground/80 pl-1">
                Confirmer le mot de passe
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 border border-border/60 dark:border-border/10 rounded-xl text-[15px] bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors pt-2 select-none">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4.5 h-4.5 mt-0.5 border-border rounded accent-primary cursor-pointer shrink-0"
              />
              <span>
                J'accepte les{" "}
                <a href="#" className="text-primary font-semibold hover:underline">
                  conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-primary font-semibold hover:underline">
                  politique de confidentialité
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white border-0 rounded-xl text-[15px] font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] mt-4 hover:bg-[#4338ca] hover:shadow-float shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Création en cours…</span>
                </>
              ) : (
                <span>Créer mon compte</span>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Se connecter
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
