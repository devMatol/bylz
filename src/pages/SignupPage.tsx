import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Phone, FileText, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { GoogleIcon } from "../components/auth/GoogleIcon";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SEO } from "../components/seo/SEO";
import { useAuth } from "../contexts/AuthContext";
import { signUp, signInWithGoogle, resendConfirmationEmail } from "../lib/auth";
import { sendWelcomeEmail } from "../lib/emailNotifier";
import { trackSignUp } from "../lib/analytics";
import { cn, formatAmount } from "../lib/utils";

function mapAuthError(code: string | undefined): string {
  if (!code) return "Une erreur est survenue. Réessayez.";
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

function formatPhoneInput(value: string): string {
  if (value.startsWith("+")) {
    return value.replace(/[^\d+ ]/g, "").slice(0, 20);
  }
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s.-]/g, "");
  // French mobile/landline (01-09 or +33)
  const frRegex = /^(?:(?:\+|00)33|0)[1-9]\d{8}$/;
  // General international (8 to 15 digits)
  const intlRegex = /^\+[1-9]\d{7,14}$/;
  return frRegex.test(cleaned) || intlRegex.test(cleaned);
}

const STRENGTH_LABELS = { weak: "Faible", medium: "Moyen", strong: "Fort" };

export function SignupPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email confirmation state
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError("Veuillez saisir un numéro de téléphone valide (ex : 06 12 34 56 78).");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const cleanedPhone = phone.replace(/[\s.-]/g, "");
    const { data, error: signUpError } = await signUp(email.trim(), password, cleanedPhone);

    if (signUpError) {
      setError(mapAuthError(signUpError.code));
      setLoading(false);
      return;
    }

    trackSignUp("email");

    // If confirmation is required and no active session was returned
    if (!data?.session) {
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // If session is immediately active
    void sendWelcomeEmail(email.trim());
    await refreshProfile();
    navigate(isGuest ? "/onboarding?guest=true" : "/onboarding");
  };

  const handleResend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setResendSuccess(false);
    setError(null);
    try {
      const { error: resendErr } = await resendConfirmationEmail(email.trim());
      if (resendErr) {
        setError(resendErr.message || "Erreur lors du renvoi de l'email.");
      } else {
        setResendSuccess(true);
        setCooldown(60);
      }
    } catch {
      setError("Impossible de renvoyer l'email pour le moment.");
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    trackSignUp("google");
    const redirectTo = `${window.location.origin}/onboarding?guest=true`;
    const { error: googleError } = await signInWithGoogle(redirectTo);
    if (googleError) {
      setError(mapAuthError(googleError.code));
      setGoogleLoading(false);
    }
  };

  // 1. Email confirmation pending screen
  if (confirmationSent) {
    return (
      <AuthLayout
        title="Vérifiez votre boîte mail !"
        subtitle="Un email de confirmation sécurisé vous a été envoyé"
        footer={
          <p>
            Vous avez déjà confirmé votre compte ?{" "}
            <Link
              to={isGuest ? "/login?guest=true" : "/login"}
              className="text-primary font-semibold hover:underline"
            >
              Se connecter
            </Link>
          </p>
        }
      >
        <SEO title="Vérifiez votre email | Bylz" noindex />
        <div className="flex flex-col items-center text-center space-y-5 py-2">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Mail className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-text">
              Nous venons d'envoyer un lien de validation à :
            </p>
            <p className="text-sm font-bold text-white bg-slate-900 border border-slate-700/80 px-4 py-2.5 rounded-xl font-mono break-all">
              {email}
            </p>
            <p className="text-xs text-muted leading-relaxed pt-1">
              Pour sécuriser votre compte et activer vos fonctionnalités de facturation, cliquez sur le lien contenu dans cet email.
            </p>
          </div>

          <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Vous ne trouvez pas l'email ?</span>
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              Pensez à vérifier votre dossier de <strong>courriers indésirables (spams)</strong>. L'arrivée peut parfois prendre 1 à 2 minutes.
            </p>
          </div>

          {resendSuccess && (
            <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Un nouvel email de confirmation vient d'être envoyé !</span>
            </div>
          )}

          {error && (
            <p className="w-full text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2.5">
              {error}
            </p>
          )}

          <div className="w-full space-y-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full justify-center text-xs h-10 border-border hover:bg-surface-hover gap-2"
            >
              {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {cooldown > 0
                  ? `Renvoyer l'email (${cooldown}s)`
                  : "Renvoyer l'email de confirmation"}
              </span>
            </Button>

            <Link to={isGuest ? "/login?guest=true" : "/login"} className="block w-full">
              <Button variant="primary" className="w-full justify-center h-10 text-xs font-bold">
                J'ai validé mon email, me connecter
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // 2. Signup form
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Adresse email"
          type="email"
          placeholder="vous@exemple.fr"
          leftIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Numéro de téléphone"
          type="tel"
          placeholder="06 12 34 56 78"
          leftIcon={<Phone className="w-4 h-4" />}
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          required
          autoComplete="tel"
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
          <div className="flex flex-col gap-1 -mt-1">
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

        <div className="relative">
          <Input
            label="Confirmer le mot de passe"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Retapez votre mot de passe"
            leftIcon={<Lock className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute right-3 top-[34px] text-muted hover:text-text transition-colors"
            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {confirmPassword.length > 0 && (
          <div className="-mt-1">
            {password === confirmPassword ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Les mots de passe correspondent
              </p>
            ) : (
              <p className="text-xs text-danger flex items-center gap-1 font-medium">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full mt-1" loading={loading}>
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
