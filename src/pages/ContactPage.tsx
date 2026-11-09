import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Send,
  MessageSquare,
} from "lucide-react";
import { SEO } from "../components/seo/SEO";
import { SEO_METADATA } from "../lib/seoMeta";
import { MarketingNavbar } from "../components/marketing/MarketingNavbar";
import { MarketingFooter } from "../components/marketing/MarketingFooter";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans">
      <SEO
        title={SEO_METADATA["/contact"].title}
        description={SEO_METADATA["/contact"].description}
        canonical={SEO_METADATA["/contact"].canonical}
      />

      <MarketingNavbar theme="light" />

      <main id="main-content" className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Mail className="w-3.5 h-3.5 text-blue-700" />
              <span>Réponse sous 24 h ouvrées, du lundi au vendredi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Une question ? Notre équipe est là pour vous aider
            </h1>
            <p className="text-base text-slate-600 font-medium">
              Que ce soit pour une question technique, juridique ou commerciale, nous répondons à toutes les demandes sous 24h ouvrées.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Nos engagements support</h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Réponse sous 24 h ouvrées</p>
                      <p className="text-slate-600">Du lundi au vendredi, réponse par e-mail.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Assistance dédiée</p>
                      <p className="text-slate-600">Une question ? Écrivez-nous, nous répondons du lundi au vendredi.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Email Direct</p>
                      <p className="text-slate-600 font-mono">support@bylz.fr</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Vous souhaitez consulter d'abord la foire aux questions ?{" "}
                    <Link to="/#faq" className="text-blue-700 font-bold hover:underline">
                      Consulter la FAQ
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Message bien envoyé !</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Merci {name}, notre équipe a bien reçu votre demande et vous répondra à l'adresse <strong>{email}</strong> sous 24 heures.
                    </p>
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="min-h-[44px] text-slate-800 border-slate-300 hover:bg-slate-50 font-bold"
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
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Envoyez-nous un message</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Votre nom complet"
                        placeholder="ex: Jean Dupont"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
                      />
                      <Input
                        label="Votre adresse e-mail"
                        type="email"
                        placeholder="ex: jean@dupont.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
                      />
                    </div>

                    <Input
                      label="Sujet de votre demande"
                      placeholder="ex: Question sur la conformité 2026"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
                    />

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-900">Votre message</label>
                      <textarea
                        rows={5}
                        placeholder="Détaillez votre question ici..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        className="w-full justify-center min-h-[44px] py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        <span>Envoyer le message</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter theme="light" />
    </div>
  );
}
