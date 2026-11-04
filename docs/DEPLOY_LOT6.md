# Guide de Déploiement — LOT 6 (FactPulse & Back-Office)

Ce document décrit la procédure complète de déploiement en production pour le **Lot 6 : FactPulse + Back-Office**.

> [!CAUTION]
> **RÈGLE CRITIQUE D'ORDONNANCEMENT & FENÊTRE DE TRANSITION :**
> 1. **Ne JAMAIS cliquer sur "Publish" dans Bolt avant que les migrations SQL et les Edge Functions ne soient entièrement déployées.**
> 2. **Attention à la fenêtre de transition entre migrations et Publish :**
>    - Le frontend actuellement en production dans Bolt n'écrit pas la colonne `vat_rate` lors de la saisie d'une ligne de facture.
>    - La migration `20261031180000` applique une contrainte `NOT NULL` sans valeur par défaut sur `invoice_lines.vat_rate` (après backfill des lignes existantes), et la fonction RPC `emit_invoice` (via `freeze_invoice_legal_snapshot`) rejette explicitement toute facture contenant une ligne sans `vat_rate`.
>    - Par conséquent, **entre l'exécution de la migration 4 et la fin du build Bolt/Netlify, la création et l'émission de factures par l'ancien frontend échoueront**.
>    - **Procédure pour minimiser la coupure (< 2 minutes) :**
>      - Intervenir exclusivement en **heure creuse** (tard le soir ou weekend).
>      - Enchaîner immédiatement les migrations 1.1 à 1.4, puis le déploiement des fonctions, puis cliquer immédiatement sur **Publish** dans Bolt.

---

## Ordre Obligatoire des Opérations

1. **Étape 0 : Sauvegarde préalable & Vérification d'état**
2. **Étape 1 : Exécution des Migrations SQL (Base de données Supabase)**
3. **Étape 2 : Configuration des Secrets & Déploiement des Fonctions Edge**
4. **Étape 3 : Publication Frontend dans Bolt (Publish)**
5. **Étape 4 : Validation Post-Déploiement**

---

## Étape 0 : Sauvegarde préalable & Vérification

### 0.1 Point de restauration / Sauvegarde Supabase
Avant toute exécution de script SQL en production :
1. Se rendre dans le tableau de bord Supabase : *Database > Backups*.
2. Vérifier qu'un backup récent existe ou déclencher un point de restauration.
3. Optionnel (recommandé) — réaliser un dump local des données critiques :
   ```bash
   npx supabase db dump --remote --data-only -f backup_data_pre_lot6.sql
   npx supabase db dump --remote -f backup_schema_pre_lot6.sql
   ```

### 0.2 Vérification des migrations distantes
Vérifier l'état d'application des migrations avant de lancer quoi que ce soit :
```bash
npx supabase migration list --remote
```
Vérifier que les migrations antérieures à `20261028110000` sont bien appliquées et que les 4 migrations du Lot 6 sont marquées en attente (`remote: ""`).

---

## Étape 1 : Migrations SQL Supabase

Appliquer les 4 migrations dans l'ordre chronologique strict :

### 1.1 `20261028110000_schema_reproducibility.sql`
- **Objets créés :**
  - Type enum `public.vat_payment_option` (`encaissements`, `debits`, `non_renseigne`)
  - Colonne `companies.vat_option` (`public.vat_payment_option NOT NULL DEFAULT 'non_renseigne'`)
  - Colonne `invoices.legal_snapshot` (`jsonb`)
- **Plan de rollback & réversibilité :**
  - Réversible : OUI.
  ```sql
  ALTER TABLE public.companies DROP COLUMN IF EXISTS vat_option;
  DROP TYPE IF EXISTS public.vat_payment_option CASCADE;
  ALTER TABLE public.invoices DROP COLUMN IF EXISTS legal_snapshot;
  ```

### 1.2 `20261028120000_inalterabilite_and_cancel_match.sql`
- **Objets créés :**
  - Colonne `payments.bank_transaction_id` (`uuid REFERENCES bank_transactions(id) ON DELETE SET NULL`)
  - Colonne `payments.is_reversal` (`boolean NOT NULL DEFAULT false`)
  - Contrainte `payments_amount_sign` : `(is_reversal AND amount < 0) OR (NOT is_reversal AND amount > 0)`
  - Index `idx_payments_bank_transaction_id`
  - Fonction RPC `public.cancel_bank_transaction_match(p_bank_transaction_id uuid)`
- **Plan de rollback & réversibilité :**
  - Réversible : OUI.
  ```sql
  DROP FUNCTION IF EXISTS public.cancel_bank_transaction_match(uuid);
  DROP INDEX IF EXISTS public.idx_payments_bank_transaction_id;
  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_sign;
  ALTER TABLE public.payments DROP COLUMN IF EXISTS is_reversal;
  ALTER TABLE public.payments DROP COLUMN IF EXISTS bank_transaction_id;
  ```

### 1.3 `20261031170000_add_address_postal_city_and_vat_rate.sql`
- **Objets créés :**
  - Colonne `companies.postal_code` (`text`)
  - Colonne `companies.city` (`text`)
  - Colonne `clients.postal_code` (`text`)
  - Colonne `clients.city` (`text`)
  - Colonne `invoice_lines.vat_rate` (`numeric(5,2)`)
- **Plan de rollback & réversibilité :**
  - Réversible : OUI.
  ```sql
  ALTER TABLE public.companies DROP COLUMN IF EXISTS postal_code;
  ALTER TABLE public.companies DROP COLUMN IF EXISTS city;
  ALTER TABLE public.clients DROP COLUMN IF EXISTS postal_code;
  ALTER TABLE public.clients DROP COLUMN IF EXISTS city;
  ALTER TABLE public.invoice_lines DROP COLUMN IF EXISTS vat_rate;
  ```

### 1.4 `20261031180000_factpulse_vat_backfill_and_snapshot.sql`
- **Objets créés :**
  - Valeurs ajoutées à l'enum `pa_status` : `'submitting'`, `'litigation'`, `'suspended'`
  - Backfill des lignes existantes : `vat_rate = 0` là où `vat_rate IS NULL`
  - Contrainte `invoice_lines.vat_rate NOT NULL`
  - Colonne `invoices.pa_lifecycle_code` (`integer`)
  - Colonne `invoices.pa_status_updated_at` (`timestamptz DEFAULT now()`)
  - Trigger `trg_set_pa_status_updated_at` sur `invoices`
  - Fonction RPC `emit_invoice(p_invoice_id uuid)` avec gel de snapshot légal
- **Plan de rollback & réversibilité :**
  - Réversible : **PARTIELLEMENT**.
  - **IRRÉVERSIBLE DIRECTEMENT DANS POSTGRES :** L'instruction `ALTER TYPE pa_status ADD VALUE ...` ne peut pas être annulée par un `DROP VALUE`. Les nouvelles valeurs d'enum restent dans le catalogue PostgreSQL (sans impact nocif si non référencées).
  - Rollback des colonnes, triggers et contraintes :
  ```sql
  DROP TRIGGER IF EXISTS trg_set_pa_status_updated_at ON public.invoices;
  DROP FUNCTION IF EXISTS public.set_pa_status_updated_at();
  ALTER TABLE public.invoices DROP COLUMN IF EXISTS pa_lifecycle_code;
  ALTER TABLE public.invoices DROP COLUMN IF EXISTS pa_status_updated_at;
  ALTER TABLE public.invoice_lines ALTER COLUMN vat_rate DROP NOT NULL;
  -- Restaurer l'ancienne version de emit_invoice si elle existait
  ```

---

## Étape 2 : Secrets Supabase & Edge Functions

### 2.1 Inventaire des Variables d'Environnement / Secrets

Les fonctions lisent des variables précises (et **non** une variable générique `FACTPULSE_API_KEY`).

| Variable | Fichier(s) où elle est lue | Obligatoire | Rôle & Comportement |
|---|---|:---:|---|
| `FACTPULSE_CLIENT_UID` | `_shared/factpulse-client.ts`<br>`submit-to-pa/index.ts`<br>`parse-pdf-factpulse/index.ts` | **OUI** | Identifiant de compte Bylz sur la plateforme FactPulse. Requis dans les payloads et headers. |
| `FACTPULSE_API_TOKEN` | `_shared/factpulse-client.ts` | **OUI** (recommandé) | Jeton Bearer permanent ou principal. Prioritaire sur l'authentification login/mot de passe. |
| `FACTPULSE_USERNAME` | `_shared/factpulse-client.ts` | Optionnel | Nom d'utilisateur pour login OAuth automatique si aucun Bearer token n'est configuré. |
| `FACTPULSE_PASSWORD` | `_shared/factpulse-client.ts` | Optionnel | Mot de passe pour login OAuth automatique si aucun Bearer token n'est configuré. |
| `FACTPULSE_EMAIL` | `_shared/factpulse-client.ts` | Optionnel | Fallback pour le nom d'utilisateur si `FACTPULSE_USERNAME` est omis. |
| `FACTPULSE_WEBHOOK_SECRET` | `factpulse-webhook/index.ts` | **OUI** | Clé secrète partagée pour la vérification de signature HMAC-SHA256 des notifications FactPulse. **Fail-closed :** si non défini, la fonction renvoie HTTP 503 à toute requête. |
| `FACTPULSE_ALLOW_PRODUCTION` | `submit-to-pa/index.ts`<br>`_shared/factpulse-helpers.ts` | Optionnel (défaut `false`) | **Verrou strict fail-closed :** Le client FactPulse n'a pas de mode sandbox séparé (une seule URL `https://factpulse.fr/api/v1`). Tant que `FACTPULSE_ALLOW_PRODUCTION` n'est pas exactement `"true"`, tout envoi sortant est immédiatement bloqué (HTTP 403 `production_disabled`) sans aucun appel réseau. |
| `CRON_SECRET` | `_shared/require-operator.ts`<br>(appelé par `retry-pa-submissions`, `generate-ereporting`) | **OUI** (pour les crons) | Jeton secret pour sécuriser les tâches de maintenance appelées par pg_cron ou un scheduler externe. |

#### État des secrets sur Supabase (Vérifié via `supabase secrets list`) :
- **Déjà configurés :** `FACTPULSE_CLIENT_UID`, `FACTPULSE_API_TOKEN`, `FACTPULSE_USERNAME`, `FACTPULSE_PASSWORD`, `FACTPULSE_EMAIL`.
- **À configurer avant ouverture :**
  - `FACTPULSE_WEBHOOK_SECRET` : à renseigner avec le secret fourni par le portail FactPulse.
  - `CRON_SECRET` : à renseigner avec une chaîne aléatoire sécurisée pour pg_cron.
- **Sécurité fail-closed par défaut :** Le client FactPulse n'a pas de mode sandbox séparé et utilise une URL unique (`https://factpulse.fr/api/v1`). La variable `FACTPULSE_ALLOW_PRODUCTION` est non définie (ou différente de `'true'`) sur Supabase, ce qui bloque immédiatement tout appel réseau sortant vers FactPulse (HTTP 403 `production_disabled` fail-closed) sans risquer d'émission réelle.

### 2.2 Déploiement des Fonctions Edge

Déployer les fonctions via la CLI Supabase :

```bash
# Fonctions de soumission, émission et rejeu
npx supabase functions deploy emit-invoice
npx supabase functions deploy submit-to-pa
npx supabase functions deploy retry-pa-submissions

# Webhook FactPulse (authentification par signature HMAC, verify_jwt désactivé dans config.toml)
npx supabase functions deploy factpulse-webhook --no-verify-jwt

# Analyse et ingestion de factures PDF
npx supabase functions deploy parse-pdf-factpulse

# E-reporting (fonction sécurisée opérateur, désactivée en attente des flux DGFiP)
npx supabase functions deploy generate-ereporting

# Génération et envoi de documents
npx supabase functions deploy generate-pdf
npx supabase functions deploy send-email

# Webhook WhatsApp & Synchronisation Bancaire
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy enablebanking-callback --no-verify-jwt
npx supabase functions deploy sync-bank-transactions

# Services SIRET
npx supabase functions deploy lookup-siret
npx supabase functions deploy siret-lookup
```

---

## Étape 3 : Publication dans Bolt

Une fois les étapes 1 et 2 validées :
1. Vérifier que la branche `origin/main` contient l'ensemble des commits du Lot 6.
2. Bolt synchronise le commit de `main` automatiquement.
3. Cliquer sur le bouton **Publish** dans l'interface Bolt.
4. Suivre le build Netlify et s'assurer qu'il passe au vert.

---

## Étape 4 : Validation Post-Déploiement

Vérifier les points de contrôle suivants :
1. **Migrations :** `npx supabase migration list --remote` montre toutes les migrations avec un timestamp remote.
2. **Schéma :** Requêter `information_schema.columns` pour confirmer la présence de :
   - `companies.postal_code`, `companies.city`, `companies.vat_option`
   - `clients.postal_code`, `clients.city`
   - `invoice_lines.vat_rate` (avec contrainte `is_nullable = 'NO'`)
   - `invoices.legal_snapshot`, `invoices.pa_lifecycle_code`, `invoices.pa_status_updated_at`
   - `payments.is_reversal`
3. **Application connectée :**
   - Accéder à *Paramètres* : vérifier la saisie de l'adresse (code postal, ville) et de l'option TVA.
   - Créer un client avec code postal et ville.
   - Créer une facture avec une ligne et vérifier l'affichage du taux de TVA (0 % en franchise).
   - Émettre la facture et vérifier que le `legal_snapshot` est correctement peuplé dans `invoices`.
