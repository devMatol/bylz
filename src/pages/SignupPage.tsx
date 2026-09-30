import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, FileText } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SEO } from "../components/seo/SEO";
import { useAuth } from "../contexts/AuthContext";
import { signUp, signInWithGoogle } from "../lib/auth";
import { sendWelcomeEmail } from "../lib/emailNotifier";
import { trackSignUp } from "../lib/analytics";
import { cn, formatAmount } from "../lib/utils";

function mapAuthError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
  // Deliberately neutral: telling the visitor that "an account already exists"
  // lets anyone test which email addresses are registered.
  if (code === "user_already_exists")
    return "Inscription impossible avec ces informations. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.";
  if (code === "weak_password") return "Le mot de passe est trop faible (min. 8 caractères).";
  if (code === "over_request_rate_limit" || code === "rate_limit_exceeded")
    return "Trop de tentatives, réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez.";
}

function getPasswordStrength(pw: string): {
  level: "weak" | "medium" | "strong";
  percent: number;
  color: string;
} {
  if (pw.length < 8) return { level: "weak", percent: 25, color: "bg-danger" };
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 3) return { level: "strong", percent: 100, color: "bg-success" };
  if (score >= 1) return { level: "medium", percent: 66, color: "bg-warning" };
  return { level: "weak", percent: 33, color: "bg-danger" };
}

const STRENGTH_LABELS = { weak: "Faible", medium: "Moyen", strong: "Fort" };

export function SignupPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  const isGuest = new URLSearchParams(window.location.search).get("guest") === "true";

  const [draftTotal] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem("bylz-guest-draft");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.lines) && parsed.lines.length > 0) {
        const total = parsed.lines.reduce(
          (sum: number, l: any) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
          0
        );
        return total > 0 ? total : null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await signUp(email.trim(), password);
    if (signUpError) {
      setError(mapAuthError(signUpError.code));
      setLoading(false);
      return;
    }
    // Track GA4 / Google Ads sign_up conversion
    trackSignUp("email");
    // Send Welcome Email
    void sendWelcomeEmail(email.trim());
    await refreshProfile();
    navigate(isGuest ? "/onboarding?guest=true" : "/onboarding");
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    // Track GA4 / Google Ads sign_up conversion intent
    trackSignUp("google");
    const redirectTo = `${window.location.origin}/onboarding?guest=true`;
    const { error: googleError } = await signInWithGoogle(redirectTo);
    if (googleError) {
      setError(mapAuthError(googleError.code));
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Créez votre espace Bylz"
      subtitle="Gratuit pour toujours jusqu'à 3 factures/mois, sans carte bancaire"
      footer={
        <p>
          Déjà un compte ?{" "}
          <Link
            to={isGuest ? "/login?guest=true" : "/login"}
            className="text-primary font-semibold hover:underline"
          >
            Se connecter
          </Link>
        </p>
      }
    >
      <SEO title="Créer un compte | Bylz" noindex />

      {draftTotal !== null && (
        <div className="mb-5 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
          <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Votre facture de <strong className="text-white font-mono font-bold">{formatAmount(draftTotal)}</strong> vous attend. Elle sera importée dans votre espace.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="vous@exemple.fr"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 caractères"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-[34px] text-muted hover:text-text transition-colors"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {password.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", strength.color)}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              Sécurité : {STRENGTH_LABELS[strength.level]}
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Créer mon compte
        </Button>
      </form>

      <p className="text-xs text-muted text-center mt-3 leading-relaxed">
        En créant un compte, vous acceptez nos{" "}
        <Link to="/cgu" target="_blank" className="text-primary hover:underline font-medium">
          CGU
        </Link>{" "}
        et notre{" "}
        <Link to="/confidentialite" target="_blank" className="text-primary hover:underline font-medium">
          politique de confidentialité
        </Link>
        .
      </p>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        loading={googleLoading}
        leftIcon={!googleLoading ? <GoogleIcon /> : undefined}
      >
        Continuer avec Google
      </Button>
    </AuthLayout>
  );
}
