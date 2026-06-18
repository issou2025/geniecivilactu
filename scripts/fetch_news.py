from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import feedparser
import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

try:
    from deep_translator import GoogleTranslator
except ImportError:  # Le workflow installe cette dépendance; ce fallback garde le script testable.
    GoogleTranslator = None

from sources import SOURCES

ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_FILE = ROOT_DIR / "data" / "news.json"
MAX_PER_SOURCE = 8
MAX_ARTICLES = 200
REQUEST_TIMEOUT = 15
TRANSLATION_CACHE: dict[str, str] = {}

CATEGORY_KEYWORDS = {
    "Structures": ["structure", "structural", "building", "frame", "steel", "reinforced", "seismic", "design"],
    "Béton": ["concrete", "cement", "durability", "aggregate", "mix", "carbon", "low-carbon", "slab"],
    "Routes": ["road", "highway", "pavement", "asphalt", "transport", "lane"],
    "Ponts": ["bridge", "viaduct", "crossing", "span"],
    "BIM / Revit": ["bim", "revit", "digital twin", "model", "modeling", "autodesk", "scan-to-bim", "3d model"],
    "Hydraulique": ["water", "flood", "drainage", "hydraulic", "sewer", "stormwater", "dam"],
    "Géotechnique": ["soil", "foundation", "geotechnical", "ground", "tunnel", "excavation"],
    "Construction": ["construction", "contractor", "site", "project", "chantier", "building site"],
    "Innovation": ["innovation", "technology", "research", "sustainable", "climate", "ai", "robot", "automation"],
    "Matériaux": ["material", "materials", "steel", "timber", "composite", "cement", "aggregate"],
    "Infrastructures": ["infrastructure", "airport", "rail", "metro", "public works", "utility"],
    "Environnement": ["climate", "carbon", "sustainable", "energy", "resilience", "environment"],
    "Sécurité chantier": ["safety", "accident", "worker", "risk", "site safety"],
}


def main() -> int:
    articles: list[dict[str, str]] = []
    successes: list[str] = []
    failures: list[str] = []

    for source in SOURCES:
        try:
            fetched = fetch_source(source)
            articles.extend(fetched)
            successes.append(f"{source['name']} ({len(fetched)} article(s))")
        except Exception as exc:
            failures.append(f"{source['name']} : {exc}")

    clean_articles = deduplicate(articles)
    clean_articles.sort(key=sort_key, reverse=True)
    clean_articles = clean_articles[:MAX_ARTICLES]

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(clean_articles, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("Sources réussies :")
    for item in successes:
        print(f"  - {item}")

    if failures:
        print("Sources échouées :")
        for item in failures:
            print(f"  - {item}")

    print(f"{len(clean_articles)} article(s) sauvegardé(s) dans {OUTPUT_FILE}")
    return 0


def fetch_source(source: dict[str, str]) -> list[dict[str, str]]:
    if source.get("type") == "html":
        return fetch_html_source(source)
    return fetch_rss_source(source)


def fetch_rss_source(source: dict[str, str]) -> list[dict[str, str]]:
    response = requests.get(source["url"], timeout=REQUEST_TIMEOUT, headers=request_headers())
    response.raise_for_status()
    feed = feedparser.parse(response.content)
    entries = feed.entries[:MAX_PER_SOURCE]
    return [entry_to_article(entry, source) for entry in entries if entry.get("link") or entry.get("title")]


def fetch_html_source(source: dict[str, str]) -> list[dict[str, str]]:
    response = requests.get(source["url"], timeout=REQUEST_TIMEOUT, headers=request_headers())
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    articles: list[dict[str, str]] = []

    for link in soup.select("article a[href], h2 a[href], h3 a[href]")[:MAX_PER_SOURCE]:
        title = clean_text(link.get_text(" ", strip=True))
        url = absolute_url(link.get("href", ""), source["url"])
        if not title or not url:
            continue
        image = extract_html_image(link, soup, source["url"])
        articles.append(build_article(source=source, title=title, summary="", url=url, published_at="", image=image))

    return articles


def entry_to_article(entry: Any, source: dict[str, str]) -> dict[str, str]:
    title = clean_text(entry.get("title", ""))
    summary = clean_text(entry.get("summary", "") or entry.get("description", ""))
    summary = truncate(summary, 220)
    url = entry.get("link", "")
    published_at = parse_date(
        entry.get("published", "")
        or entry.get("updated", "")
        or entry.get("created", "")
        or ""
    )
    image = extract_entry_image(entry)
    return build_article(source=source, title=title, summary=summary, url=url, published_at=published_at, image=image)


def build_article(source: dict[str, str], title: str, summary: str, url: str, published_at: str, image: str = "") -> dict[str, str]:
    combined_text = f"{title} {summary}"
    category = detect_category(combined_text, source.get("category_hint", "Actualité"))
    translated_title = translate_to_french(title)
    translated_summary = translate_to_french(summary)
    return {
        "id": make_id(source["name"], title, url),
        "source": source["name"],
        "category": category,
        "title_original": title,
        "summary_original": summary,
        "title_fr": translated_title or "Titre non disponible",
        "summary_fr": translated_summary or "Résumé non disponible",
        "url": url,
        "image": image,
        "published_at": published_at or datetime.now(timezone.utc).date().isoformat(),
        "language": source.get("language", "auto"),
    }


def translate_to_french(text: str) -> str:
    text = clean_text(text)
    if not text:
        return ""

    if text in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[text]

    if GoogleTranslator is None:
        TRANSLATION_CACHE[text] = text
        return text

    try:
        translated = GoogleTranslator(source="auto", target="fr").translate(text)
    except Exception as exc:
        print(f"Traduction échouée, texte conservé : {exc}")
        translated = text

    TRANSLATION_CACHE[text] = translated or text
    return TRANSLATION_CACHE[text]


def extract_entry_image(entry: Any) -> str:
    candidates: list[str] = []

    for key in ("media_content", "media_thumbnail"):
        for media in entry.get(key, []) or []:
            if isinstance(media, dict):
                candidates.append(media.get("url", ""))

    for enclosure in entry.get("enclosures", []) or []:
        if isinstance(enclosure, dict):
            href = enclosure.get("href", "")
            kind = enclosure.get("type", "")
            if href and ("image" in kind or href.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))):
                candidates.append(href)

    summary = entry.get("summary", "") or entry.get("description", "")
    if summary:
        soup = BeautifulSoup(summary, "html.parser")
        image = soup.find("img")
        if image:
            candidates.append(image.get("src", ""))

    return first_valid_image(candidates)


def extract_html_image(link: Any, soup: BeautifulSoup, base_url: str) -> str:
    candidates: list[str] = []
    article = link.find_parent("article")
    if article:
        image = article.find("img")
        if image:
            candidates.extend([image.get("src", ""), image.get("data-src", "")])

    og_image = soup.select_one('meta[property="og:image"], meta[name="twitter:image"]')
    if og_image:
        candidates.append(og_image.get("content", ""))

    return first_valid_image(absolute_url(candidate, base_url) for candidate in candidates)


def first_valid_image(candidates: Any) -> str:
    for candidate in candidates:
        if not isinstance(candidate, str):
            continue
        candidate = candidate.strip()
        if candidate.startswith("//"):
            candidate = f"https:{candidate}"
        if candidate.startswith(("http://", "https://")):
            return candidate
    return ""


def detect_category(text: str, fallback: str) -> str:
    searchable = text.lower()
    scores: dict[str, int] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        scores[category] = sum(1 for keyword in keywords if keyword.lower() in searchable)

    best_category, best_score = max(scores.items(), key=lambda item: item[1])
    return best_category if best_score > 0 else fallback


def deduplicate(articles: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for article in articles:
        key = normalize_duplicate_key(article.get("url") or article.get("title_fr", ""))
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(article)
    return unique


def normalize_duplicate_key(value: str) -> str:
    return re.sub(r"\W+", "", value.lower())


def make_id(source_name: str, title: str, url: str) -> str:
    digest = hashlib.sha1(f"{source_name}|{title}|{url}".encode("utf-8")).hexdigest()[:12]
    return f"civil-{digest}"


def clean_text(value: str) -> str:
    soup = BeautifulSoup(value or "", "html.parser")
    text = soup.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text).strip()


def truncate(value: str, max_length: int) -> str:
    if len(value) <= max_length:
        return value
    return value[: max_length - 1].rsplit(" ", 1)[0] + "…"


def parse_date(value: str) -> str:
    if not value:
        return ""
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            parsed = date_parser.parse(value)
        except (TypeError, ValueError, date_parser.ParserError):
            return ""

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.date().isoformat()


def sort_key(article: dict[str, str]) -> datetime:
    try:
        return date_parser.parse(article.get("published_at", ""))
    except (TypeError, ValueError, date_parser.ParserError):
        return datetime.min


def absolute_url(url: str, base_url: str) -> str:
    return requests.compat.urljoin(base_url, url)


def request_headers() -> dict[str, str]:
    return {
        "User-Agent": "GenieCivilActuBot/1.0 (+https://github.com/)",
        "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
    }


if __name__ == "__main__":
    sys.exit(main())
