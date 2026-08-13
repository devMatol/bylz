import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SEO } from "../components/seo/SEO";
import { sendPasswordResetEmail } from "../lib/auth";

function mapResetError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
  if (code === "over_request_rate_limit" || code === "rate_limit_exceeded")
    return "Trop de tentatives en peu de temps. Veuillez patienter quelques minutes.";
  if (code === "validation_failed")
    return "Adresse e-mail invalide.";
  return "Une erreur est survenue lors de l'envoi. Réessayez.";
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isGuest = new URLSearchParams(window.location.search).get("guest") === "true";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await sendPasswordResetEmail(email.trim());
      if (resetError) {
        setError(mapResetError(resetError.code));
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Vérifiez votre boîte mail"
        subtitle="Un e-mail de réinitialisation a été envoyé"
        footer={
          <Link
            to={isGuest ? "/login?guest=true" : "/login"}
            className="inline-flex items-center text-sm text-primary font-semibold hover:underline gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
        }
      >
        <SEO title="Email envoyé | Bylz" noindex />
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-text">
              Si l'adresse <strong className="text-primary">{email}</strong> correspond à un compte inscrit, un lien sécurisé de réinitialisation vous a été envoyé.
            </p>
            <p className="text-xs text-muted">
              Pensez à vérifier le dossier indésirable (spams) si vous ne recevez rien d'ici quelques minutes.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      subtitle="Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé"
      footer={
        <Link
          to={isGuest ? "/login?guest=true" : "/login"}
          className="inline-flex items-center text-sm text-muted hover:text-text transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>
      }
    >
      <SEO title="Mot de passe oublié | Bylz" noindex />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email de votre compte"
          type="email"
          placeholder="vous@exemple.fr"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Envoyer le lien de récupération
        </Button>
      </form>
    </AuthLayout>
  );
}
