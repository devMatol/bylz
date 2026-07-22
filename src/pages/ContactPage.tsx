import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Clock, MessageSquare, Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

export function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast("Votre message a été envoyé avec succès !", "success");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand-primary/20 selection:text-brand-primary">
      <SEO
        title="Contact & Support — Bylz"
        description="Une question sur notre logiciel de facturation ou la conformité 2026 ? Contactez notre équipe dédiée aux micro-entrepreneurs. Réponse sous 24h."
        canonical="/contact"
      />

      <MarketingNavbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              <Mail className="w-3.5 h-3.5" />
              <span>À votre écoute 7j/7</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text">
              Une question ? Notre équipe est là pour vous aider
            </h1>
            <p className="text-base text-muted">
              Que ce soit pour une question technique, juridique ou commerciale, nous répondons à toutes les demandes sous 24h ouvrées.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-text">Nos engagements support</h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-text">Réponse sous 24h</p>
                      <p className="text-muted">Du lundi au vendredi, réponse garantie le jour même.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-text">Assistance Spécialisée</p>
                      <p className="text-muted">Équipe experte en régimes auto-entrepreneur BNC et BIC.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-text">Email Direct</p>
                      <p className="text-muted font-mono">support@bylz.fr</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted">
                    Vous souhaitez consulter d'abord la foire aux questions ?{" "}
                    <Link to="/#faq" className="text-brand-primary font-bold hover:underline">
                      Consulter la FAQ
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-surface border border-border rounded-2xl p-8 shadow-md">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-text">Message bien envoyé !</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Merci {name}, notre équipe a bien reçu votre demande et vous répondra à l'adresse <strong>{email}</strong> sous 24 heures.
                    </p>
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setName("");
                          setEmail("");
                          setSubject("");
                          setMessage("");
                        }}
                      >
                        Envoyer un autre message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-lg font-bold text-text mb-4">Envoyez-nous un message</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Votre nom complet"
                        placeholder="ex: Jean Dupont"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Input
                        label="Votre adresse e-mail"
                        type="email"
                        placeholder="ex: jean@dupont.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Input
                      label="Sujet de votre demande"
                      placeholder="ex: Question sur la conformité 2026"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-text">Votre message</label>
                      <textarea
                        rows={5}
                        placeholder="Détaillez votre question ici..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-surface text-text border border-border rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button type="submit" variant="primary" disabled={loading} className="w-full sm:w-auto">
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
