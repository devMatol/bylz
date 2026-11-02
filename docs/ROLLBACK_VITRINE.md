# Procédure de Retour Arrière (Rollback) — Vitrine Bylz

Ce document décrit les démarches d'urgence si une anomalie est détectée après la mise en ligne ou la fusion de la branche `vitrine`.

---

## 1. Retour arrière immédiat sur Netlify (sans toucher à Git)

Si le site en production présente un dysfonctionnement après le déploiement :

1. Connectez-vous à la console **Netlify** : `https://app.netlify.com/`
2. Sélectionnez le site **Bylz**.
3. Rendez-vous dans l'onglet **Deploys**.
4. Repérez dans la liste le **dernier déploiement sain** antérieur à la mise en ligne de la branche vitrine.
5. Cliquez sur ce déploiement pour ouvrir ses détails.
6. Cliquez sur le bouton **Publish deploy** (en haut à droite).
7. Le CDN Netlify bascule instantanément le trafic de production sur l'ancienne version statique sans rebuild.

---

## 2. Annulation de la fusion dans Git (git revert)

Si la branche `vitrine` a été fusionnée dans `main` et que vous devez annuler cette fusion proprement sans réécrire l'historique :

1. Récupérez la branche `main` à jour :
   ```bash
   git switch main
   git pull origin main
   ```
2. Identifiez le hash du commit de fusion (ex. via `git log -n 5 --oneline`).
3. Créez un commit inverse (revert) qui annule les modifications apportées par le commit de fusion :
   ```bash
   # Pour un merge commit (avec deux parents, on conserve le parent 1 qui est main) :
   git revert -m 1 <HASH_DU_COMMIT_DE_FUSION> -m "revert: rollback vitrine merge"
   ```
4. Testez localement la compilation :
   ```bash
   npm run build
   ```
5. Poussez le commit de revert sur `main` :
   ```bash
   git push origin main
   ```

L'historique Git reste intact et traçable, et le déploiement automatique Netlify se déclenchera sur la version restaurée.

---

## 3. Gestion du repli statique et déploiements (STRICT_SUPABASE_BUILD)

Lors de la compilation en production (ex. via le bouton **Publish** de Bolt ou un environnement Netlify sans variables d'environnement configurées) :

- **Comportement par défaut (tolérant)** : Si les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont absentes, si la base est inaccessible ou si la table `blog_posts` est vide, les scripts `scripts/generate_sitemap.js` et `scripts/prerender.js` émettent un avertissement et basculent automatiquement sur la copie statique locale (`src/data/blogArticles.ts`). Le build réussit avec l'intégralité des 30 pages et articles prérendus.
- **Mode strict (`STRICT_SUPABASE_BUILD=true`)** : Pour exiger impérativement que les articles proviennent de la base distante et faire échouer le build en cas d'absence ou d'erreur Supabase, définissez la variable d'environnement `STRICT_SUPABASE_BUILD=true`.
