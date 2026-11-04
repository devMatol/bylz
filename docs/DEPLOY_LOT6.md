# Guide de Déploiement — LOT 6 (FactPulse & Back-Office)

Ce document décrit la procédure de déploiement en production pour le **Lot 6 : FactPulse + Back-Office**.

> [!CAUTION]
> **RÈGLE CRITIQUE D'ORDONNANCEMENT :**
> **Ne JAMAIS cliquer sur "Publish" dans Bolt avant que l'étape (1) des migrations ne soit entièrement terminée et validée sur Supabase.**
> Si le frontend mis à jour est publié avant les migrations, les requêtes API (PostgREST) qui sélectionnent ou modifient `postal_code`, `city`, `vat_option`, `pa_lifecycle_code` échoueront immédiatement avec des erreurs 400 (`column does not exist`).

---

## Ordre Obligatoire des Opérations

1. **Étape 1 : Exécution des Migrations SQL (Base de données Supabase)**
2. **Étape 2 : Déploiement des Fonctions Edge (Supabase CLI)**
3. **Étape 3 : Publication Frontend dans Bolt (Publish)**

---

## Étape 1 : Migrations SQL Supabase

Exécuter les scripts SQL suivants sur le projet Supabase de production, dans l'ordre chronologique strict :

### 1.1 `20261028110000_schema_reproducibility.sql`
- **Dépendances de colonnes & types :**
  - Type enum `public.vat_payment_option` (`encaissements`, `debits`, `non_renseigne`)
  - `companies.vat_option` (`public.vat_payment_option NOT NULL DEFAULT 'non_renseigne'`)
  - `invoices.legal_snapshot` (`jsonb`) : gel inaltérable des mentions légales et coordonnées émetteur/acheteur lors de l'émission.

### 1.2 `20261028120000_inalterabilite_and_cancel_match.sql`
- **Dépendances de colonnes & contraintes :**
  - `payments.bank_transaction_id` (`uuid REFERENCES bank_transactions(id) ON DELETE SET NULL`)
  - `payments.is_reversal` (`boolean NOT NULL DEFAULT false`)
  - Contrainte `payments_amount_sign` : `(is_reversal AND amount < 0) OR (NOT is_reversal AND amount > 0)`
  - Index `idx_payments_bank_transaction_id`
  - Fonction RPC `public.cancel_bank_transaction_match(p_bank_transaction_id uuid)` pour contre-passation inaltérable.

### 1.3 `20261031170000_add_address_postal_city_and_vat_rate.sql`
- **Dépendances de colonnes :**
  - `companies.postal_code` (`text`)
  - `companies.city` (`text`)
  - `clients.postal_code` (`text`)
  - `clients.city` (`text`)
  - `invoice_lines.vat_rate` (`numeric(5,2)`)

### 1.4 `20261031180000_factpulse_vat_backfill_and_snapshot.sql`
- **Dépendances de colonnes & automatismes :**
  - Extension enum `pa_status` avec `submitting`, `litigation`, `suspended`
  - `invoices.pa_lifecycle_code` (`integer`) : codes cycle de vie AFNOR XP Z12-012 / DGFIP
  - `invoices.pa_status_updated_at` (`timestamptz DEFAULT now()`)
  - Trigger `trg_set_pa_status_updated_at` sur `invoices`
  - Procédure RPC `emit_invoice(p_invoice_id uuid)` avec verrouillage `FOR UPDATE` et gel de `legal_snapshot`

---

## Étape 2 : Déploiement des Fonctions Edge

Vérifier au préalable la présence des variables d'environnement dans le tableau de bord Supabase (*Project Settings > Edge Functions*) :
- `FACTPULSE_CLIENT_UID`
- `FACTPULSE_API_KEY`
- `FACTPULSE_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`

Déployer les fonctions via la CLI Supabase :

```bash
# Fonctions de soumission, émission et rejeu
supabase functions deploy emit-invoice
supabase functions deploy submit-to-pa
supabase functions deploy retry-pa-submissions

# Webhook FactPulse (authentification par signature HMAC, verify_jwt désactivé dans config.toml)
supabase functions deploy factpulse-webhook --no-verify-jwt

# Analyse et ingestion de factures PDF
supabase functions deploy parse-pdf-factpulse

# E-reporting (fonction sécurisée opérateur, désactivée en attente des flux DGFiP)
supabase functions deploy generate-ereporting

# Génération et envoi de documents
supabase functions deploy generate-pdf
supabase functions deploy send-email

# Webhook WhatsApp & Synchronisation Bancaire
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy enablebanking-callback --no-verify-jwt
supabase functions deploy sync-bank-transactions

# Services SIRET
supabase functions deploy lookup-siret
supabase functions deploy siret-lookup
```

---

## Étape 3 : Publication dans Bolt

Une fois les étapes 1 et 2 validées :
1. Pousser la branche de merge sur le dépôt GitHub distant (`origin/main`).
2. Bolt synchronise le commit de `main` automatiquement.
3. Cliquer sur le bouton **Publish** dans l'interface Bolt.
4. Vérifier la réussite du build Netlify et l'accessibilité du site public et de l'espace connecté.
