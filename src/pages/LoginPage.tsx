import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SEO } from "../components/seo/SEO";
import { useAuth } from "../contexts/AuthContext";
import { signIn, signInWithGoogle } from "../lib/auth";

function mapAuthError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
  if (code === "invalid_credentials" || code === "EmailNotConfirmed")
    return "Email ou mot de passe incorrect.";
  if (code === "over_request_rate_limit" || code === "rate_limit_exceeded")
    return "Trop de tentatives, réessayez dans quelques minutes.";
  if (code === "user_not_found") return "Email ou mot de passe incorrect.";
  return "Une erreur est survenue. Réessayez.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuest = new URLSearchParams(window.location.search).get("guest") === "true";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(mapAuthError(signInError.code));
      setLoading(false);
      return;
    }
    await refreshProfile();
    navigate(isGuest ? "/?guest=true" : "/");
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
      title="Bon retour !"
      subtitle="Connectez-vous à votre espace"
      footer={
        <p>
          Pas encore de compte ?{" "}
          <Link
            to={isGuest ? "/signup?guest=true" : "/signup"}
            className="text-primary font-semibold hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      }
    >
      <SEO title="Connexion | Bylz" noindex />
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
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Se connecter
        </Button>
      </form>

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
