import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

test("Consent Mode v2 default denied avant tout chargement gtag dans index.html", () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");

  // Vérifier la présence de gtag('consent', 'default', ...)
  assert.match(indexHtml, /gtag\('consent',\s*'default'/);

  // Vérifier que par défaut analytics et ad_* sont denied
  assert.match(indexHtml, /'analytics_storage':\s*'denied'/);
  assert.match(indexHtml, /'ad_storage':\s*'denied'/);
  assert.match(indexHtml, /'ad_user_data':\s*'denied'/);
  assert.match(indexHtml, /'ad_personalization':\s*'denied'/);

  // Vérifier que le bloc de consentement est placé AVANT le chargement du script gtag.js
  const consentPos = indexHtml.indexOf("gtag('consent', 'default'");
  const scriptPos = indexHtml.indexOf("googletagmanager.com/gtag/js");
  assert.ok(consentPos !== -1, "Bloc consent introuvable");
  assert.ok(scriptPos !== -1, "Script gtag introuvable");
  assert.ok(consentPos < scriptPos, "Le bloc consent doit être AVANT le chargement de gtag.js");
});

test("Bandeau cookies : présence des 3 boutons et persistance 6 mois", () => {
  const bannerFile = fs.readFileSync(path.join(rootDir, "src/components/shared/CookieConsentBanner.tsx"), "utf8");

  // 3 boutons requis : Tout refuser, Personnaliser, Tout accepter
  assert.match(bannerFile, /Tout refuser/);
  assert.match(bannerFile, /Personnaliser/);
  assert.match(bannerFile, /Tout accepter/);

  // Événement personnalisé pour rouvrir depuis le footer
  assert.match(bannerFile, /bylz-open-cookie-banner/);

  // Validité de 6 mois (180 jours)
  assert.match(bannerFile, /CONSENT_VALIDITY_DAYS\s*=\s*180/);
});

test("Footer et Page Confidentialité : lien Gérer les cookies et section 6", () => {
  const footerFile = fs.readFileSync(path.join(rootDir, "src/components/marketing/MarketingFooter.tsx"), "utf8");
  assert.match(footerFile, /Gérer les cookies/);
  assert.match(footerFile, /bylz-open-cookie-banner/);

  const confFile = fs.readFileSync(path.join(rootDir, "src/pages/ConfidentialitePage.tsx"), "utf8");
  assert.match(confFile, /6\.\s*Cookies.*Consent Mode v2/);
  assert.match(confFile, /6 mois/);
});

test("Garde-fous Analytics : aucun événement sans consentement", () => {
  const analyticsFile = fs.readFileSync(path.join(rootDir, "src/lib/analytics.ts"), "utf8");

  assert.match(analyticsFile, /hasAnalyticsConsent/);
  assert.match(analyticsFile, /hasMarketingConsent/);
  assert.match(analyticsFile, /if \(!hasAnalyticsConsent\(\)\) return/);
});
