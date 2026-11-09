# Application de la Fondation Ézéchiel NTAL (F.E.N)

Application de gestion des membres, des organes, des rapports, des devis et des finances de la Fondation.
Une seule base de code : une **version web** (ordinateur et mobile) et une **application Android** (APK) emballée avec Capacitor.

> État : **prototype**. Les données restent dans le navigateur de chaque personne (`localStorage`).
> Il n'y a pas encore de serveur, donc rien n'est partagé entre appareils. Voir « Prochaines étapes ».

## 1. Essayer la version web sur votre ordinateur (VS Code)

1. Installez [Node.js](https://nodejs.org) (version 20 ou plus) et [VS Code](https://code.visualstudio.com).
2. Ouvrez ce dossier dans VS Code (Fichier > Ouvrir un dossier).
3. Dans le terminal de VS Code :
   ```bash
   npm install
   npm start
   ```
4. Ouvrez http://localhost:5173 dans le navigateur.

Autre option : après `npm install` et `npm run prepare:web`, faites un clic droit sur `www/index.html` puis « Open with Live Server » (extension recommandée par VS Code).

## 2. Obtenir l'APK de test avec GitHub (sans installer Android Studio)

1. Créez un compte gratuit sur https://github.com puis un nouveau dépôt (par exemple `fen-app`).
2. Envoyez-y tous les fichiers de ce dossier, **y compris le dossier caché `.github`**.
   Le plus simple : sur la page du dépôt, « uploading an existing file », puis glissez le contenu du dossier.
   Vérifiez que `.github/workflows/build-apk.yml` apparaît bien dans le dépôt.
3. Ouvrez l'onglet **Actions** du dépôt. La compilation démarre toute seule (ou cliquez sur « Construire l'APK » puis « Run workflow »).
4. Au bout de quelques minutes, ouvrez la compilation terminée. En bas de la page, dans **Artifacts**, téléchargez `fen-apk-test` (un fichier zip contenant `app-debug.apk`).
5. Envoyez `app-debug.apk` sur votre téléphone et ouvrez-le. Android demandera d'autoriser l'installation d'applications de cette source : acceptez pour ce fichier.

Si la compilation échoue, ouvrez l'étape en rouge dans l'onglet Actions et copiez le message d'erreur : il indique le correctif à faire.

Cet APK est un **APK de test** (mode debug). Pour publier sur le Play Store, il faudra un APK signé (étape de signature à ajouter plus tard).

## 3. Compiler l'APK sur votre ordinateur (facultatif)

Il faut Android Studio et Java 17.

```bash
npm install
npx cap add android      # une seule fois
npm run android:sync
npm run android:open     # ouvre Android Studio, puis Build > Build APK
```

## 4. Structure du code

```
www/
  index.html            page unique (écran de connexion + coque de l'application)
  css/style.css         styles et couleurs (thèmes clair et sombre)
  js/logos.js           logos de la Fondation (base64)
  js/data.js            données de départ, rôles, droits d'accès, périmètres, stockage
  js/auth.js            connexion, première connexion, compte, adhésion, navigation
  js/views-gestion.js   tableau de bord, membres, demandes, provinces, coordinations, zones, structures, carte de membre
  js/views-suivi.js     présentation, rapports, devis, finance, projets, paramètres, exports PDF et Excel
  js/main.js            démarrage
scripts/prepare.mjs     copie jsPDF, SheetJS et le générateur de QR code dans www/vendor
assets/                 icônes de l'application Android
capacitor.config.json   configuration Android
.github/workflows/      compilation automatique de l'APK
```

### Où modifier quoi

- **Structure de la Fondation** (provinces, coordinations, zones, cellules), comptes de départ, textes de présentation : `SEED_DATA` dans `js/data.js`.
- **Droits d'accès par défaut** : tableau `ACC` dans `js/data.js` (F = complet, V = consulter, S = son périmètre, - = refusé). L'administrateur peut aussi les modifier dans Paramètres.
- **Périmètre de chaque rôle** (qui voit quels membres) : fonctions `inScope`, `zoneInScope`, `coordInScope` dans `js/data.js`.
- **Carte de membre** : `cardHTML` (aperçu) dans `js/views-gestion.js` et `cardPdf` (PDF) dans `js/views-suivi.js`.
- **Couleurs** : variables en haut de `css/style.css`.

### Remettre les données à zéro

Dans l'application : Paramètres (compte administrateur) > Réinitialiser les données.
Si vous modifiez `SEED_DATA`, changez aussi le nom `fen_db_v2` (constante `KEY` dans `js/data.js`) pour que les navigateurs rechargent les nouvelles données de départ.

## 5. Nouveaux circuits de gestion

- Devis : création/correction, transmission au SG, validation du SG, approbation du Président, rejet motivé et consultation/export PDF/Excel. Un devis approuvé alimente automatiquement les dépenses.
- Projets : formulaire détaillé (contexte, objectifs, bénéficiaires, activités, calendrier, budget, résultats, risques et durabilité), validation SG/Président et enregistrement du décaissement. Le projet passe en cours après décaissement.
- Rapports : saisie détaillée, transmission SG puis Président, rejet motivé, consultation et exports PDF/Excel.
- Recettes : les coordinateurs transmettent les montants au SG puis au Président ; les recettes ne sont comptabilisées qu’après approbation présidentielle.
- Les documents exportés comportent les signatures de création/transmission, validation SG et approbation du Président (nom, téléphone, fonction, statut et date).

## 6. Limites actuelles

- **Pas de serveur** : chaque appareil a ses propres données. Un membre ajouté sur un téléphone n'apparaît pas sur un autre.
- **Sécurité** : les mots de passe sont enregistrés tels quels dans le navigateur. C'est acceptable pour un essai, **pas pour un usage réel**.
- **Mot de passe oublié** : le code s'affiche à l'écran, aucun e-mail n'est envoyé.
- **QR code des cartes** : il contient le matricule. Il ne mène pas encore à une page de vérification.
- **Photos** : réduites et stockées dans le navigateur (limite d'environ 5 Mo au total).
- **Téléchargements sur Android** : le fichier est enregistré puis le menu de partage s'ouvre. Cette partie n'a pas été testée sur un téléphone.

## 7. Prochaines étapes conseillées

1. **Base de données et serveur** (par exemple PostgreSQL avec Supabase, ou un serveur Node.js) pour partager les données entre tous les utilisateurs.
2. **Vraie authentification** : mots de passe chiffrés, e-mail de vérification, envoi du code de réinitialisation.
3. **Droits appliqués côté serveur**, pas seulement dans l'écran.
4. **Page de vérification des cartes** pour le QR code.
5. **Import Excel** des membres.
6. Signature de l'APK et publication.
