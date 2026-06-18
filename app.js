const NEWS_URL = "data/news.json";

const categories = [
  "Tous",
  "Structures",
  "Béton",
  "Routes",
  "Ponts",
  "BIM / Revit",
  "Hydraulique",
  "Géotechnique",
  "Construction",
  "Innovation",
  "Matériaux",
  "Infrastructures",
  "Environnement",
  "Sécurité chantier"
];

const state = {
  articles: [],
  search: "",
  category: "Tous"
};

const newsGrid = document.querySelector("#newsGrid");
const statusBox = document.querySelector("#statusBox");
const searchInput = document.querySelector("#searchInput");
const categoryFilters = document.querySelector("#categoryFilters");
const articleCount = document.querySelector("#articleCount");
const lastUpdated = document.querySelector("#lastUpdated");
const themeToggle = document.querySelector("#themeToggle");
const themeText = document.querySelector("#themeText");
const themeIcon = document.querySelector("#themeIcon");
const template = document.querySelector("#articleTemplate");

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupFilters();
  setupSearch();
  loadNews();
});

function setupTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(theme);

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  themeText.textContent = dark ? "Mode clair" : "Mode sombre";
  themeIcon.textContent = dark ? "☼" : "◐";
  themeToggle.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
}

function setupFilters() {
  categoryFilters.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = category;
    button.setAttribute("aria-pressed", category === state.category ? "true" : "false");
    if (category === state.category) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => {
      state.category = category;
      updateFilterButtons();
      renderArticles();
    });
    categoryFilters.appendChild(button);
  });
}

function updateFilterButtons() {
  categoryFilters.querySelectorAll(".chip").forEach((button) => {
    const active = button.textContent === state.category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setupSearch() {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderArticles();
  });
}

async function loadNews() {
  showStatus("Chargement des actualités...");
  try {
    const response = await fetch(NEWS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Réponse HTTP ${response.status}`);
    }
    const data = await response.json();
    state.articles = Array.isArray(data) ? normalizeArticles(data).sort(sortByDateDesc) : [];
    updateLastUpdated();
    renderArticles();
  } catch (error) {
    console.error(error);
    articleCount.textContent = "Aucun article disponible";
    lastUpdated.textContent = "Dernière mise à jour : non disponible";
    showError("Impossible de charger les actualités");
  }
}

function normalizeArticles(items) {
  return items.map((item, index) => ({
    id: safeText(item.id) || `article-${index}`,
    source: safeText(item.source) || "Source inconnue",
    category: safeText(item.category) || "Actualité",
    title_fr: safeText(item.title_fr) || "Titre non disponible",
    summary_fr: safeText(item.summary_fr) || "Résumé non disponible",
    url: safeUrl(item.url),
    image: safeUrl(item.image),
    published_at: safeText(item.published_at) || "Date non disponible"
  }));
}

function renderArticles() {
  const filtered = state.articles.filter(matchesCurrentFilters);
  newsGrid.innerHTML = "";

  articleCount.textContent = `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`;

  if (!state.articles.length) {
    showStatus("Aucun article disponible");
    return;
  }

  if (!filtered.length) {
    showStatus("Aucun résultat pour cette recherche");
    return;
  }

  statusBox.hidden = true;
  const fragment = document.createDocumentFragment();
  filtered.forEach((article) => fragment.appendChild(createArticleCard(article)));
  newsGrid.appendChild(fragment);
}

function matchesCurrentFilters(article) {
  const inCategory = state.category === "Tous" || article.category === state.category;
  const text = [
    article.title_fr,
    article.summary_fr,
    article.source,
    article.category,
    article.published_at
  ].join(" ").toLowerCase();
  return inCategory && text.includes(state.search);
}

function createArticleCard(article) {
  const card = template.content.firstElementChild.cloneNode(true);
  const media = card.querySelector(".card-media");
  const title = card.querySelector("h3");
  const summary = card.querySelector(".summary");
  const badge = card.querySelector(".badge");
  const source = card.querySelector(".source");
  const date = card.querySelector(".date");
  const link = card.querySelector(".read-link");

  badge.textContent = article.category;
  title.textContent = article.title_fr;
  summary.textContent = article.summary_fr;
  source.textContent = article.source;
  date.textContent = formatDate(article.published_at);

  if (article.image) {
    const image = document.createElement("img");
    image.src = article.image;
    image.alt = "";
    image.loading = "lazy";
    media.appendChild(image);
  } else {
    media.classList.add("placeholder-media");
    media.textContent = "Actualité génie civil";
  }

  if (article.url) {
    link.href = article.url;
    link.setAttribute("aria-label", `Lire l’article original : ${article.title_fr}`);
  } else {
    link.remove();
  }

  return card;
}

function showStatus(message) {
  statusBox.hidden = false;
  statusBox.textContent = message;
  newsGrid.innerHTML = "";
}

function showError(message) {
  statusBox.hidden = false;
  statusBox.innerHTML = "";
  const text = document.createElement("p");
  text.textContent = message;
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "retry-button";
  retry.textContent = "Réessayer";
  retry.addEventListener("click", loadNews);
  statusBox.append(text, retry);
  newsGrid.innerHTML = "";
}

function updateLastUpdated() {
  const dates = state.articles
    .map((article) => Date.parse(article.published_at))
    .filter((timestamp) => !Number.isNaN(timestamp));

  if (!dates.length) {
    lastUpdated.textContent = "Dernière mise à jour : non disponible";
    return;
  }

  const latest = new Date(Math.max(...dates));
  lastUpdated.textContent = `Dernière mise à jour : ${latest.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })}`;
}

function sortByDateDesc(a, b) {
  const dateA = Date.parse(a.published_at);
  const dateB = Date.parse(b.published_at);
  if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
  if (Number.isNaN(dateA)) return 1;
  if (Number.isNaN(dateB)) return -1;
  return dateB - dateA;
}

function formatDate(value) {
  const date = Date.parse(value);
  if (Number.isNaN(date)) {
    return value || "Date non disponible";
  }
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  try {
    const url = new URL(value.trim(), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
