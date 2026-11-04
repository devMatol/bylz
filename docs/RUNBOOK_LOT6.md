# Runbook d'Exécution — LOT 6 (FactPulse & Back-Office)

Ce runbook opérationnel fournit la séquence pas-à-pas des commandes d'exécution, leurs requêtes de contrôle immédiat et leurs critères d'arrêt stricts pour le déploiement en production.

> [!IMPORTANT]
> **RÈGLE GÉNÉRALE D'ARRÊT :**
> À la moindre anomalie constatée lors d'un contrôle ou si un critère d'arrêt est atteint :
> 1. **INTERROMPRE IMMÉDIATEMENT** la procédure.
> 2. Ne lancer aucune commande ultérieure.
> 3. Ne pas cliquer sur "Publish" dans Bolt.
> 4. Consulter la section Rollback de `docs/DEPLOY_LOT6.md`.

---

## Sommaire de la Procédure

1. [Étape 0 — Fenêtre d'intervention & Pré-requis](#étape-0--fenêtre-dintervention--pré-requis)
2. [Étape 1 — Sauvegarde confirmée de la base de données](#étape-1--sauvegarde-confirmée-de-la-base-de-données)
3. [Étape 2 — Vérification de l'état des migrations](#étape-2--vérification-de-létat-des-migrations)
4. [Étape 3 — Application des Migrations SQL (Ordre strict)](#étape-3--application-des-migrations-sql-ordre-strict)
5. [Étape 4 — Déploiement des Fonctions Edge (Ordre strict)](#étape-4--déploiement-des-fonctions-edge-ordre-strict)
6. [Étape 5 — Publication Frontend dans Bolt (Publish)](#étape-5--publication-frontend-dans-bolt-publish)
7. [Étape 6 — Recette & Contrôles Post-Déploiement](#étape-6--recette--contrôles-post-déploiement)

---

## Étape 0 — Fenêtre d'intervention & Pré-requis

* **Créneau horaire :** Heure creuse impérative (22h00 – 06h00 ou weekend).
* **Durée estimée de la fenêtre de coupure :** 2 à 3 minutes (entre la migration 4 et la fin du build Bolt).
* **Accès requis :**
  - CLI Supabase authentifiée sur le projet `sbwbjkzustnlnnilkogm` (`Bylz`).
  - Accès au tableau de bord Supabase (Database > Backups / SQL Editor).
  - Accès à l'interface Bolt (bouton Publish).

---

## Étape 1 — Sauvegarde confirmée de la base de données

### 1.1 Exécution des dumps
Exécuter un dump complet des données et du schéma :

```bash
npx supabase db dump --remote --data-only -f backup_data_pre_lot6.sql
npx supabase db dump --remote -f backup_schema_pre_lot6.sql
```

### 1.2 Contrôle de validation
Vérifier que les deux fichiers ont été créés et ne sont pas vides :

```bash
ls -lh backup_data_pre_lot6.sql backup_schema_pre_lot6.sql
```

### 1.3 Critère d'arrêt
* **ARRÊT IMMÉDIAT SI :**
  - L'une des commandes échoue avec une erreur réseau, d'authentification ou de permissions.
  - La taille de `backup_data_pre_lot6.sql` ou `backup_schema_pre_lot6.sql` est de 0 octet.

---

## Étape 2 — Vérification de l'état des migrations

### 2.1 Commande de listing
```bash
npx supabase migration list --remote
```

### 2.2 Contrôle de validation
Vérifier la colonne `remote` pour les 4 migrations du Lot 6 :
- `20261028110000` -> doit être vide (`remote: ""`)
- `20261028120000` -> doit être vide (`remote: ""`)
- `20261031170000` -> doit être vide (`remote: ""`)
- `20261031180000` -> doit être vide (`remote: ""`)

### 2.3 Note spécifique sur la migration antérieure `20260919020500`
* La migration `20260919020500_fix_logo_storage_buckets_and_policies.sql` est également en attente (`remote: ""`).
* **Comportement de `npx supabase db push` :** Cette commande appliquera automatiquement `20260919020500` avant celles du Lot 6.
  - *Impact réel analysé :* Nul. Les buckets `logos` et `company-assets` ainsi que leurs 4 politiques de sécurité existent déjà identiquement sur la base distante ; l'exécution est 100% idempotente.
* **Option pour écarter `20260919020500` si refusée par Matthias :**
  - Ne pas exécuter `supabase db push`.
  - Exécuter sélectivement et uniquement les 4 scripts du Lot 6 via l'Option A décrite à l'Étape 3 ci-dessous.

### 2.4 Critère d'arrêt
* **ARRÊT IMMÉDIAT SI :**
  - L'une des 4 migrations du Lot 6 apparaît déjà avec un timestamp distant non planifié (incohérence d'historique).

---

## Étape 3 — Application des Migrations SQL (supabase db push)

> [!WARNING]
> `supabase db push` est la procédure principale requise : elle applique les migrations et enregistre chacune dans la table d'historique `supabase_migrations.schema_migrations` (ce que `db query -f` ne fait pas).
> Elle inclut la migration `20260919020500` (100 % idempotente, configuration de buckets et politiques de sécurité déjà vérifiée identique en base).
> C'est à partir de cette étape que la contrainte `NOT NULL` entre en jeu. Enchaîner immédiatement sans pause avec les étapes 4 et 5.

### 3.1 Commande principale d'application
```bash
npx supabase db push --remote
```

Cette commande applique séquentiellement les 5 migrations en attente :
1. `20260919020500_fix_logo_storage_buckets_and_policies.sql` (alignement de l'historique avec l'état effectif des buckets et RLS)
2. `20261028110000_schema_reproducibility.sql` (`vat_option`, `legal_snapshot`)
3. `20261028120000_inalterabilite_and_cancel_match.sql` (`is_reversal`, contre-passation inaltérable)
4. `20261031170000_add_address_postal_city_and_vat_rate.sql` (`postal_code`, `city`, `vat_rate`)
5. `20261031180000_factpulse_vat_backfill_and_snapshot.sql` (backfill `vat_rate`, contrainte `NOT NULL`, extension `pa_status`, freeze snapshot)

---

### 3.2 Contrôle d'enregistrement dans l'historique distant
Vérifier immédiatement après le push que les 5 migrations sont bien enregistrées côté distant :
```bash
npx supabase migration list --remote
```
*Attendu :*
- Les 5 migrations (`20260919020500`, `20261028110000`, `20261028120000`, `20261031170000`, `20261031180000`) ont chacune un timestamp distant renseigné dans la colonne `remote`.
- Aucune migration locale ne subsiste avec `remote: ""`.

*Critère d'arrêt :*
* **ARRÊT IMMÉDIAT SI :**
  - La commande `db push` a échoué avec une erreur SQL ou réseau.
  - L'une des 5 migrations n'apparaît pas comme appliquée dans `supabase migration list --remote`.

---

### 3.3 Contrôles SQL immédiats de schéma & contraintes

Lancer les requêtes SELECT suivantes pour certifier l'intégrité de la base :

#### Contrôle 1 : Option TVA entreprise
```bash
npx supabase db query --remote --read-only "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'vat_option';"
```
*Attendu :* 1 ligne retournée avec `column_name = 'vat_option'`, `data_type = 'USER-DEFINED'`.

#### Contrôle 2 : Inaltérabilité des paiements
```bash
npx supabase db query --remote --read-only "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'is_reversal';"
```
*Attendu :* 1 ligne retournée avec `column_name = 'is_reversal'`, `data_type = 'boolean'`, `is_nullable = 'NO'`.

#### Contrôle 3 : Adresses & Colonne vat_rate
```bash
npx supabase db query --remote --read-only "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name = 'companies' AND column_name IN ('postal_code', 'city')) OR (table_name = 'clients' AND column_name IN ('postal_code', 'city')) OR (table_name = 'invoice_lines' AND column_name = 'vat_rate')) ORDER BY table_name, column_name;"
```
*Attendu :* Exactement 5 lignes retournées (`clients.city`, `clients.postal_code`, `companies.city`, `companies.postal_code`, `invoice_lines.vat_rate`).

#### Contrôle 4 : Backfill TVA & Contrainte NOT NULL sur les lignes de facture
```bash
npx supabase db query --remote --read-only "SELECT count(*) as null_vat_lines FROM public.invoice_lines WHERE vat_rate IS NULL; SELECT is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_lines' AND column_name = 'vat_rate';"
```
*Attendu :*
1. `null_vat_lines = 0` (les 58 lignes existantes ont été converties à 0 % ou 20 %).
2. `is_nullable = 'NO'` (la contrainte `NOT NULL` est active).

#### Contrôle 5 : Fonction de gel inaltérable
```bash
npx supabase db query --remote --read-only "SELECT proname FROM pg_proc WHERE proname = 'freeze_invoice_legal_snapshot';"
```
*Attendu :* 1 ligne retournée.

*Critère d'arrêt :*
* **ARRÊT IMMÉDIAT SI :**
  - L'un des contrôles ci-dessus ne correspond pas à l'attendu (par ex. `null_vat_lines > 0` ou `is_nullable <> 'NO'`).

---

## Étape 4 — Déploiement des Fonctions Edge (Ordre strict)

Déployer les fonctions dans l'ordre de priorité ci-dessous :

### 4.1 Fonctions critiques / Émission & Transmission FactPulse
```bash
npx supabase functions deploy emit-invoice
npx supabase functions deploy submit-to-pa
npx supabase functions deploy retry-pa-submissions
```

### 4.2 Webhook FactPulse & Analyse
```bash
# verify_jwt désactivé : authentification par signature HMAC-SHA256
npx supabase functions deploy factpulse-webhook --no-verify-jwt
npx supabase functions deploy parse-pdf-factpulse
npx supabase functions deploy generate-ereporting
```

### 4.3 Génération PDF, Emails & Intégrations
```bash
npx supabase functions deploy generate-pdf
npx supabase functions deploy send-email
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy enablebanking-callback --no-verify-jwt
npx supabase functions deploy sync-bank-transactions
```

### 4.4 Services SIRET
```bash
npx supabase functions deploy lookup-siret
npx supabase functions deploy siret-lookup
```

### 4.5 Contrôle de validation des fonctions
```bash
npx supabase functions list
```
*Attendu :* Toutes les fonctions ci-dessus apparaissent avec le statut `ACTIVE` et un timestamp de déploiement actualisé.

### 4.6 Critère d'arrêt
* **ARRÊT IMMÉDIAT SI :**
  - Le déploiement de `emit-invoice` ou `submit-to-pa` échoue avec une erreur de syntaxe ou de bundle.

---

## Étape 5 — Publication Frontend dans Bolt (Publish)

> [!CAUTION]
> Dès que les étapes 3 et 4 sont validées, déclencher immédiatement la publication pour refermer la fenêtre de coupure.

1. Se connecter à l'interface de gestion **Bolt**.
2. Vérifier que la branche synchronisée est `main` (commit de tête correspondant à `origin/main`).
3. Cliquer sur le bouton **Publish**.
4. Suivre le déploiement Netlify dans la console Bolt / Netlify :
   - Statut attendu : `Deploy succeeded` (durée habituelle ~45-60 s).

---

## Étape 6 — Recette & Contrôles Post-Déploiement

Exécuter la recette fonctionnelle immédiate sur Bylz en production :

1. **Page Paramètres (`/parametres`) :**
   - Ouvrir la page paramètres d'une entreprise existante.
   - Vérifier que les champs "Code postal", "Ville" et "Régime TVA" s'affichent sans erreur console (vérifier l'absence d'erreur 400 PostgREST).
   - Enregistrer une modification d'adresse et constater la persistance en base.

2. **Création & Émission d'une facture test (`/factures/nouvelle`) :**
   - Créer une facture avec une ligne de prestation (taux de TVA affiché 0,00 % pour une entreprise en franchise).
   - Cliquer sur "Émettre la facture".
   - Vérifier le passage au statut `pending` (ou `paid` selon le flux).

3. **SELECT de contrôle du snapshot légal :**
   ```bash
   npx supabase db query --remote --read-only "SELECT id, number, status, legal_snapshot->'seller'->>'postal_code' as seller_cp, legal_snapshot->'lines'->0->>'vat_rate' as line_vat FROM public.invoices WHERE status <> 'draft' ORDER BY created_at DESC LIMIT 1;"
   ```
   *Attendu :*
   - `seller_cp` renseigné avec le code postal émetteur.
   - `line_vat` renseigné avec `'0'` ou le taux applicable.
   - `legal_snapshot` non null.

4. **Fin d'intervention :**
   - La fenêtre de maintenance est refermée avec succès.
