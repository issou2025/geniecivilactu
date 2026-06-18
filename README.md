# Génie Civil Actu

Génie Civil Actu est un site web statique en français pour suivre les dernières actualités du génie civil, du BTP, des infrastructures, du BIM, des routes, des ponts, du béton, de l’hydraulique, de la géotechnique et de la construction.

Ce site affiche uniquement des titres, de courts résumés et des liens vers les sources originales. Les articles complets, images et contenus appartiennent à leurs auteurs et éditeurs respectifs.

## Objectif du projet

Le projet fournit une veille légère, rapide et professionnelle, prête à publier sur GitHub Pages. Il fonctionne sans backend, sans base de données, sans Firebase, sans Supabase, sans serveur Node.js et sans système de connexion.

## Fonctionnalités

- Interface 100 % en français.
- Chargement des actualités depuis `data/news.json`.
- Recherche en temps réel par titre, résumé, source, catégorie et date.
- Filtres par catégorie.
- Tri par date décroissante.
- Mode clair et mode sombre avec sauvegarde dans `localStorage`.
- Grille responsive : mobile, tablette, ordinateur et grands écrans.
- Messages de chargement, d’erreur, de réessai et d’absence de résultat.
- Script Python pour agréger les flux d’actualités.
- Mise à jour automatique par GitHub Actions.
- Pages statiques importantes : catégories, à propos, contact et mentions légales.

## Structure du projet

```text
genie-civil-actu/
├── index.html
├── categories.html
├── a-propos.html
├── contact.html
├── mentions-legales.html
├── style.css
├── app.js
├── README.md
├── data/
│   └── news.json
├── scripts/
│   ├── sources.py
│   └── fetch_news.py
└── .github/
    └── workflows/
        └── update_news.yml
```

## Pages du site

- `index.html` : accueil, recherche, filtres et grille d’actualités.
- `categories.html` : présentation des grandes rubriques de veille.
- `a-propos.html` : objectif du site et fonctionnement général.
- `contact.html` : proposition de source ou signalement via GitHub Issues.
- `mentions-legales.html` : attribution, limites légales et responsabilité.

## Ouvrir le site localement

Pour tester correctement le chargement JSON avec un petit serveur local :

```bash
python -m http.server 8000
```

Puis ouvrez :

```text
http://localhost:8000
```

## Publier sur GitHub Pages

1. Envoyez le dossier sur un dépôt GitHub.
2. Dans GitHub, ouvrez `Settings`.
3. Allez dans `Pages`.
4. Choisissez la branche principale et le dossier racine.
5. Enregistrez. Le site sera publié automatiquement par GitHub Pages.

## Modifier les 20 sources

Les sources sont dans `scripts/sources.py`, dans la liste `SOURCES`.

Chaque source contient :

- `name` : nom affiché de la source.
- `url` : URL du flux RSS ou de la page HTML.
- `type` : `rss` ou `html`.
- `category_hint` : catégorie utilisée si aucun mot-clé ne correspond.
- `language` : langue principale de la source.

## Fonctionnement du script Python

Le script `scripts/fetch_news.py` lit les sources, récupère les derniers articles, conserve uniquement les titres, résumés courts, sources, dates, liens et catégories, supprime les doublons, trie les articles et sauvegarde `data/news.json` en UTF-8.

Pour lancer le script :

```bash
pip install feedparser requests beautifulsoup4 python-dateutil
python scripts/fetch_news.py
```

## Fonctionnement de GitHub Actions

Le workflow `.github/workflows/update_news.yml` se lance chaque jour à 6h avec le cron `0 6 * * *`. Il peut aussi être lancé manuellement depuis l’onglet `Actions` de GitHub.

## Limites légales

Le site ne copie pas les articles complets, ne télécharge pas les images dans la version actuelle, affiche toujours la source et renvoie vers l’article original.

## Améliorations futures

- Traduction automatique anglais vers français.
- Ajout d’images autorisées uniquement.
- Newsletter.
- Notifications web.
- Version application Flutter.
- Section fiches techniques.
- Section BIM / Revit.
- Outils de calcul génie civil.
- Fiches de métré.
- Modèles de devis.
- Documents premium.
- PWA pour consultation hors ligne.
- Référencement SEO avancé.
