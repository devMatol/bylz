import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../contexts/AuthContext";
import { signUp, signInWithGoogle } from "../lib/auth";
import { cn } from "../lib/utils";

function mapAuthError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
  if (code === "user_already_exists") return "Un compte existe déjà avec cet email.";
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
    await refreshProfile();
    navigate(isGuest ? "/onboarding?guest=true" : "/onboarding");
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const redirectTo = isGuest ? `${window.location.origin}/?guest=true` : undefined;
    const { error: googleError } = await signInWithGoogle(redirectTo);
    if (googleError) {
      setError(mapAuthError(googleError.code));
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Créez votre espace Bylz"
      subtitle="Gratuit — sans carte bancaire"
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

      <p className="text-xs text-muted text-center mt-3">
        En créant un compte vous acceptez nos CGU.
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
