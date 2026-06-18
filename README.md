# Génie Civil Actu

Génie Civil Actu est un site web en français pour suivre les dernières actualités du génie civil, du BTP, des infrastructures, du BIM, des routes, des ponts, du béton, de l’hydraulique, de la géotechnique et de la construction.

Ce site affiche uniquement des titres, de courts résumés, des images issues des flux quand elles sont disponibles, et des liens vers les sources originales. Les articles complets appartiennent à leurs auteurs et éditeurs respectifs.

## Fonctionnalités

- Interface 100 % en français.
- Actualités organisées par catégories.
- Images affichées dans les cartes quand les sources en fournissent.
- Recherche en temps réel par titre, résumé, source, catégorie et date.
- Filtres par catégorie.
- Tri par date décroissante.
- Mode clair et mode sombre avec sauvegarde du choix.
- Lecture dans le site avec fenêtre intégrée.
- Traduction automatique en français des titres et résumés récupérés.
- Pages importantes : catégories, à propos, contact et mentions légales.

## Pages du site

- `index.html` : accueil, recherche, filtres et grille d’actualités.
- `categories.html` : présentation des grandes rubriques de veille.
- `a-propos.html` : objectif du site et fonctionnement général.
- `contact.html` : proposition de source ou signalement.
- `mentions-legales.html` : attribution, limites légales et responsabilité.

## Lancer en local

```bash
node dev-server.js
```

Puis ouvrez :

```text
http://127.0.0.1:8002/
```

## Modifier les sources

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
- récupère une image distante quand le flux ou la page en fournit une ;
- traduit en ligne les titres et résumés vers le français quand la dépendance de traduction est disponible ;
- limite chaque source à quelques articles ;
- conserve le titre, le résumé court, la source, la date, le lien, l’image et la catégorie ;
- ne copie jamais les articles complets ;
- supprime les doublons ;
- classe les articles par mots-clés ;
- génère un identifiant unique ;
- trie les articles par date décroissante ;
- conserve les 200 derniers articles ;
- sauvegarde un JSON propre en UTF-8 dans `data/news.json`.

Pour lancer le script :

```bash
pip install feedparser requests beautifulsoup4 python-dateutil deep-translator
python scripts/fetch_news.py
```

## Catégories

Le fichier d’exemple contient au moins un article dans chaque grande catégorie :

- Structures
- Béton
- Routes
- Ponts
- BIM / Revit
- Hydraulique
- Géotechnique
- Construction
- Innovation
- Matériaux
- Infrastructures
- Environnement
- Sécurité chantier

## Limites légales

Le site ne copie pas les articles complets. Il affiche un résumé court, une image distante quand elle est fournie par la source, l’attribution et le lien vers l’article original. Certains éditeurs peuvent bloquer l’affichage intégré de leur page.
