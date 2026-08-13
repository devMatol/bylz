import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SEO } from "../components/seo/SEO";
import { useAuth } from "../contexts/AuthContext";
import { updatePassword } from "../lib/auth";
import { useToast } from "../components/ui/Toast";

function mapResetError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
  if (code === "same_password")
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  return "Une erreur est survenue lors de la mise à jour. Réessayez.";
}

export function ResetPasswordPage() {
  const { session, loading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setUpdating(true);

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(mapResetError(updateError.code));
        setUpdating(false);
        return;
      }
      setSuccess(true);
      toast("Mot de passe mis à jour avec succès !", "success");
      // Wait a moment and then refresh profile to ensure session is updated
      await refreshProfile();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-10 text-muted text-sm font-medium">
        Vérification de la session en cours…
      </div>
    );
  }

  // If there is no active session, it means the token is invalid/expired or the user accessed the page directly.
  if (!session) {
    return (
      <AuthLayout
        title="Lien invalide ou expiré"
        subtitle="Impossible de réinitialiser le mot de passe"
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-sm text-primary font-semibold hover:underline gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Demander un nouveau lien
          </Link>
        }
      >
        <SEO title="Lien invalide | Bylz" noindex />
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-text">
              Le lien de réinitialisation sécurisé que vous avez utilisé est incorrect, a expiré, ou a déjà été utilisé.
            </p>
            <p className="text-xs text-muted">
              Les liens de réinitialisation ne sont valables qu'une seule fois pour des raisons de sécurité.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Mot de passe réinitialisé !"
        subtitle="Votre compte est désormais sécurisé avec votre nouveau mot de passe"
        footer={
          <Button
            variant="primary"
            className="w-full font-bold"
            onClick={() => navigate("/dashboard")}
          >
            Accéder à mon espace
          </Button>
        }
      >
        <SEO title="Mot de passe réinitialisé | Bylz" noindex />
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-text">
            Votre nouveau mot de passe a bien été enregistré. Vous pouvez dès à présent continuer d'utiliser Bylz normalement.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe sécurisé pour votre compte"
    >
      <SEO title="Réinitialiser le mot de passe | Bylz" noindex />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* New Password input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-3 text-muted hover:text-text transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-3 text-muted hover:text-text transition-colors"
              aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full font-bold" loading={updating}>
          Mettre à jour le mot de passe
        </Button>
      </form>
    </AuthLayout>
  );
}
