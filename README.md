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

## Structure du projet

```text
genie-civil-actu/
├── index.html
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

## Ouvrir le site localement

Ouvrez simplement `index.html` dans un navigateur moderne.

Pour tester le chargement JSON avec un petit serveur local :

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

Le script `scripts/fetch_news.py` :

- lit les sources définies dans `scripts/sources.py` ;
- récupère les derniers articles ;
- limite chaque source à quelques articles ;
- conserve le titre, le résumé court, la source, la date, le lien et la catégorie ;
- ne copie jamais les articles complets ;
- ne télécharge pas les images ;
- met `image` à une chaîne vide ;
- supprime les doublons ;
- classe automatiquement les articles par mots-clés ;
- génère un identifiant unique ;
- trie les articles par date décroissante ;
- conserve les 200 derniers articles ;
- sauvegarde un JSON propre en UTF-8 dans `data/news.json`.

Pour lancer le script :

```bash
pip install feedparser requests beautifulsoup4 python-dateutil
python scripts/fetch_news.py
```

## Fonctionnement de GitHub Actions

Le workflow `.github/workflows/update_news.yml` se lance chaque jour à 6h avec le cron :

```text
0 6 * * *
```

Il peut aussi être lancé manuellement depuis l’onglet `Actions` de GitHub.

Le workflow :

- installe Python ;
- installe `feedparser`, `requests`, `beautifulsoup4` et `python-dateutil` ;
- exécute `scripts/fetch_news.py` ;
- committe `data/news.json` si le fichier a changé ;
- pousse les modifications dans le dépôt.

## Ajouter une nouvelle source

Ajoutez un dictionnaire dans `SOURCES` :

```python
{
    "name": "Nom de la source",
    "url": "https://example.com/feed/",
    "type": "rss",
    "category_hint": "Construction",
    "language": "fr",
}
```

Privilégiez toujours un flux RSS fiable. Si une source n’a pas de flux RSS, utilisez `type: "html"` pour une extraction simple.

## Changer les catégories

Les catégories visibles du site sont dans `app.js`.

Les règles de catégorisation automatique sont dans `scripts/fetch_news.py`, dans `CATEGORY_KEYWORDS`. Ajoutez ou modifiez les mots-clés pour adapter le classement.

## Traduction automatique future

La fonction `translate_to_french(text)` existe déjà dans `scripts/fetch_news.py`. Pour la version 1, elle retourne le texte original.

Plus tard, vous pourrez y connecter une API de traduction anglais vers français.

## Limites légales

Le site respecte les règles suivantes :

- ne pas copier les articles complets ;
- ne pas voler les images ;
- ne pas télécharger les images dans la version 1 ;
- afficher seulement titre, résumé court, source, date et lien ;
- toujours mettre le lien vers l’article original ;
- toujours afficher la source ;
- ne pas supprimer l’attribution.

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
