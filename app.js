const NEWS_URL = "data/news.json";
const FAVORITES_KEY = "genie-civil-actu-favorites";
const READ_KEY = "genie-civil-actu-read";
const CACHE_KEY = "genie-civil-actu-cache";

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
  category: "Tous",
  source: "Tous",
  sort: "newest",
  period: "all",
  view: "grid",
  favoritesOnly: false,
  unreadOnly: false,
  compact: false,
  favorites: new Set(),
  read: new Set()
};

const newsGrid = document.querySelector("#newsGrid");
const statusBox = document.querySelector("#statusBox");
const searchInput = document.querySelector("#searchInput");
const categoryFilters = document.querySelector("#categoryFilters");
const sourceFilter = document.querySelector("#sourceFilter");
const sortSelect = document.querySelector("#sortSelect");
const periodFilter = document.querySelector("#periodFilter");
const clearFilters = document.querySelector("#clearFilters");
const favoritesOnly = document.querySelector("#favoritesOnly");
const unreadOnly = document.querySelector("#unreadOnly");
const compactMode = document.querySelector("#compactMode");
const randomArticle = document.querySelector("#randomArticle");
const refreshNews = document.querySelector("#refreshNews");
const articleCount = document.querySelector("#articleCount");
const lastUpdated = document.querySelector("#lastUpdated");
const statArticles = document.querySelector("#statArticles");
const statSources = document.querySelector("#statSources");
const statCategories = document.querySelector("#statCategories");
const statFavorites = document.querySelector("#statFavorites");
const statRead = document.querySelector("#statRead");
const spotlightCard = document.querySelector("#spotlightCard");
const trendList = document.querySelector("#trendList");
const categoryBars = document.querySelector("#categoryBars");
const sourceCloud = document.querySelector("#sourceCloud");
const timelineList = document.querySelector("#timelineList");
const themeToggle = document.querySelector("#themeToggle");
const themeText = document.querySelector("#themeText");
const themeIcon = document.querySelector("#themeIcon");
const template = document.querySelector("#articleTemplate");
const readerModal = document.querySelector("#readerModal");
const readerFrame = document.querySelector("#readerFrame");
const readerTitle = document.querySelector("#readerTitle");
const readerSummary = document.querySelector("#readerSummary");
const readerCategory = document.querySelector("#readerCategory");
const readerSource = document.querySelector("#readerSource");
const readerDate = document.querySelector("#readerDate");
const readerSourceLink = document.querySelector("#readerSourceLink");
const backToTop = document.querySelector("#backToTop");
const scrollProgress = document.querySelector("#scrollProgress");
const mobileSearchFocus = document.querySelector("#mobileSearchFocus");
const mobileFiltersFocus = document.querySelector("#mobileFiltersFocus");

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupBackToTop();
  setupScrollProgress();
  setupMobileShortcuts();
  setupKeyboardShortcuts();
  if (newsGrid && statusBox && searchInput && categoryFilters && template) {
    loadFavorites();
    loadReadArticles();
    setupFilters();
    setupSearch();
    setupAdvancedControls();
    setupReader();
    loadNews();
  }
});

function setupTheme() {
  if (!themeToggle || !themeText || !themeIcon) {
    return;
  }

  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (!themeToggle || !themeText || !themeIcon) {
    return;
  }

  const dark = theme === "dark";
  themeText.textContent = dark ? "Mode clair" : "Mode sombre";
  themeIcon.textContent = dark ? "☼" : "●";
  themeToggle.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
}

function setupFilters() {
  categoryFilters.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.category = category;
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

function setupSearch() {
  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderArticles();
  });
}

function setupAdvancedControls() {
  sourceFilter?.addEventListener("change", (event) => {
    state.source = event.target.value;
    renderArticles();
  });

  sortSelect?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderArticles();
  });

  periodFilter?.addEventListener("change", (event) => {
    state.period = event.target.value;
    renderArticles();
  });

  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view || "grid";
      updateViewButtons();
      renderArticles();
    });
  });

  favoritesOnly?.addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    favoritesOnly.classList.toggle("active", state.favoritesOnly);
    favoritesOnly.setAttribute("aria-pressed", state.favoritesOnly ? "true" : "false");
    renderArticles();
  });

  unreadOnly?.addEventListener("click", () => {
    state.unreadOnly = !state.unreadOnly;
    unreadOnly.classList.toggle("active", state.unreadOnly);
    unreadOnly.setAttribute("aria-pressed", state.unreadOnly ? "true" : "false");
    renderArticles();
  });

  compactMode?.addEventListener("click", () => {
    state.compact = !state.compact;
    compactMode.classList.toggle("active", state.compact);
    compactMode.setAttribute("aria-pressed", state.compact ? "true" : "false");
    renderArticles();
  });

  randomArticle?.addEventListener("click", () => {
    const filtered = sortArticles(state.articles.filter(matchesCurrentFilters));
    const pool = filtered.length ? filtered : state.articles;
    const article = pool[Math.floor(Math.random() * pool.length)];
    if (article) openReader(article);
  });

  refreshNews?.addEventListener("click", () => {
    loadNews();
    flashButton(refreshNews, "Actualisé");
  });

  clearFilters?.addEventListener("click", () => {
    state.search = "";
    state.category = "Tous";
    state.source = "Tous";
    state.sort = "newest";
    state.period = "all";
    state.favoritesOnly = false;
    state.unreadOnly = false;
    state.compact = false;
    searchInput.value = "";
    if (sourceFilter) sourceFilter.value = "Tous";
    if (sortSelect) sortSelect.value = "newest";
    if (periodFilter) periodFilter.value = "all";
    favoritesOnly?.classList.remove("active");
    favoritesOnly?.setAttribute("aria-pressed", "false");
    unreadOnly?.classList.remove("active");
    unreadOnly?.setAttribute("aria-pressed", "false");
    compactMode?.classList.remove("active");
    compactMode?.setAttribute("aria-pressed", "false");
    updateFilterButtons();
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
    state.articles = Array.isArray(data) ? normalizeArticles(data) : [];
    cacheArticles();
    populateSourceFilter();
    updateLastUpdated();
    updateDashboard();
    renderArticles();
  } catch (error) {
    console.error(error);
    if (loadCachedArticles()) {
      populateSourceFilter();
      updateLastUpdated();
      updateDashboard();
      renderArticles();
      statusBox.hidden = false;
      statusBox.textContent = "Actualités affichées depuis la dernière sauvegarde locale.";
      window.setTimeout(() => {
        if (state.articles.length) statusBox.hidden = true;
      }, 1800);
      return;
    }
    articleCount.textContent = "Aucun article disponible";
    lastUpdated.textContent = "Dernière mise à jour: non disponible";
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
    published_at: safeText(item.published_at) || "Date non disponible",
    language: safeText(item.language) || "auto"
  }));
}

function populateSourceFilter() {
  if (!sourceFilter) {
    return;
  }

  const sources = [...new Set(state.articles.map((article) => article.source))].sort((a, b) => a.localeCompare(b, "fr"));
  sourceFilter.innerHTML = '<option value="Tous">Toutes les sources</option>';
  sources.forEach((source) => {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = source;
    sourceFilter.appendChild(option);
  });
}

function renderArticles() {
  const filtered = sortArticles(state.articles.filter(matchesCurrentFilters));
  newsGrid.innerHTML = "";
  newsGrid.classList.toggle("list-view", state.view === "list");
  newsGrid.classList.toggle("compact-view", state.compact);

  articleCount.textContent = `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`;
  updateFilterButtons();
  updateDashboard();
  renderSpotlight(filtered);
  renderInsights(filtered);
  renderTimeline(filtered);

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
  const inSource = state.source === "Tous" || article.source === state.source;
  const inFavorites = !state.favoritesOnly || state.favorites.has(article.id);
  const inUnread = !state.unreadOnly || !state.read.has(article.id);
  const inPeriod = matchesPeriod(article);
  const text = [
    article.title_fr,
    article.summary_fr,
    article.source,
    article.category,
    article.published_at
  ].join(" ").toLowerCase();
  return inCategory && inSource && inFavorites && inUnread && inPeriod && text.includes(state.search);
}

function matchesPeriod(article) {
  if (state.period === "all") {
    return true;
  }
  const days = Number(state.period);
  const published = Date.parse(article.published_at);
  if (!days || Number.isNaN(published)) {
    return true;
  }
  return published >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function sortArticles(articles) {
  return [...articles].sort((a, b) => {
    if (state.sort === "oldest") {
      return compareDates(a, b);
    }
    if (state.sort === "source") {
      return a.source.localeCompare(b.source, "fr") || compareDates(b, a);
    }
    if (state.sort === "category") {
      return a.category.localeCompare(b.category, "fr") || compareDates(b, a);
    }
    return compareDates(b, a);
  });
}

function compareDates(a, b) {
  const dateA = Date.parse(a.published_at);
  const dateB = Date.parse(b.published_at);
  if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
  if (Number.isNaN(dateA)) return 1;
  if (Number.isNaN(dateB)) return -1;
  return dateA - dateB;
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
  const readerButton = card.querySelector(".reader-button");
  const favoriteButton = card.querySelector(".favorite-button");
  const readStateButton = card.querySelector(".read-state-button");
  const shareButton = card.querySelector(".share-button");
  const translateLink = card.querySelector(".translate-link");

  badge.textContent = article.category;
  title.textContent = article.title_fr;
  summary.textContent = article.summary_fr;
  source.textContent = article.source;
  date.textContent = `${formatDate(article.published_at)} · ${estimateReadingTime(article.summary_fr)} min`;
  card.dataset.articleId = article.id;
  card.classList.toggle("is-read", state.read.has(article.id));

  renderMedia(media, article);
  updateFavoriteButton(favoriteButton, article);
  updateReadStateButton(readStateButton, article);
  favoriteButton?.addEventListener("click", () => toggleFavorite(article));
  readStateButton?.addEventListener("click", () => toggleRead(article));
  shareButton?.addEventListener("click", () => shareArticle(article, shareButton));

  if (article.url) {
    link.href = article.url;
    link.textContent = "Source";
    link.setAttribute("aria-label", `Ouvrir la source originale: ${article.title_fr}`);
    translateLink.href = getTranslatedArticleUrl(article.url);
    translateLink.textContent = "Traduire";
    translateLink.setAttribute("aria-label", `Lire la traduction française: ${article.title_fr}`);
    readerButton.textContent = "Lire ici en français";
    readerButton.addEventListener("click", () => openReader(article));
  } else {
    link.remove();
    readerButton.remove();
    translateLink?.remove();
  }

  return card;
}

function renderMedia(media, article) {
  if (article.image) {
    const image = document.createElement("img");
    image.src = article.image;
    image.alt = "";
    image.loading = "lazy";
    media.appendChild(image);
    return;
  }

  media.classList.add("placeholder-media");
  media.textContent = "Actualité génie civil";
}

function renderSpotlight(articles) {
  if (!spotlightCard) {
    return;
  }

  const article = articles[0] || state.articles[0];
  if (!article) {
    spotlightCard.innerHTML = "<p>Aucun article à mettre en avant pour le moment.</p>";
    return;
  }

  spotlightCard.innerHTML = "";
  const media = document.createElement("div");
  media.className = "spotlight-media";
  renderMedia(media, article);

  const content = document.createElement("div");
  content.className = "spotlight-content";
  content.innerHTML = `
    <span class="badge">${escapeHtml(article.category)}</span>
    <h3>${escapeHtml(article.title_fr)}</h3>
    <p>${escapeHtml(article.summary_fr)}</p>
    <div class="spotlight-meta">${escapeHtml(article.source)} · ${escapeHtml(formatDate(article.published_at))}</div>
  `;

  const action = document.createElement("button");
  action.type = "button";
  action.className = "reader-button";
  action.textContent = "Lire en français";
  action.addEventListener("click", () => openReader(article));
  content.appendChild(action);

  spotlightCard.append(media, content);
}

function updateFilterButtons() {
  const counts = getCategoryCounts();
  categoryFilters.querySelectorAll(".chip").forEach((button) => {
    const category = button.dataset.category || button.textContent;
    const active = category === state.category;
    const count = counts.get(category) || 0;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.textContent = category === "Tous" ? `Tous (${state.articles.length})` : `${category} (${count})`;
  });
}

function updateViewButtons() {
  document.querySelectorAll(".view-button").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateDashboard() {
  const sources = new Set(state.articles.map((article) => article.source));
  if (statArticles) statArticles.textContent = String(state.articles.length);
  if (statSources) statSources.textContent = String(sources.size || 40);
  if (statCategories) statCategories.textContent = String(categories.length - 1);
  if (statFavorites) statFavorites.textContent = String(state.favorites.size);
  if (statRead) statRead.textContent = String(state.read.size);
}

function getCategoryCounts() {
  const counts = new Map();
  categories.forEach((category) => counts.set(category, 0));
  state.articles.forEach((article) => {
    counts.set(article.category, (counts.get(article.category) || 0) + 1);
  });
  return counts;
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    state.favorites = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    state.favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
  updateDashboard();
}

function toggleFavorite(article) {
  if (state.favorites.has(article.id)) {
    state.favorites.delete(article.id);
  } else {
    state.favorites.add(article.id);
  }
  saveFavorites();
  renderArticles();
}

function updateFavoriteButton(button, article) {
  if (!button) {
    return;
  }
  const active = state.favorites.has(article.id);
  button.classList.toggle("active", active);
  button.textContent = active ? "Favori ✓" : "Favori";
  button.setAttribute("aria-label", active ? "Retirer des favoris" : "Ajouter aux favoris");
}

function loadReadArticles() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    state.read = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    state.read = new Set();
  }
}

function saveReadArticles() {
  localStorage.setItem(READ_KEY, JSON.stringify([...state.read]));
  updateDashboard();
}

function toggleRead(article) {
  if (state.read.has(article.id)) {
    state.read.delete(article.id);
  } else {
    state.read.add(article.id);
  }
  saveReadArticles();
  renderArticles();
}

function markRead(article) {
  if (!article?.id || state.read.has(article.id)) {
    return;
  }
  state.read.add(article.id);
  saveReadArticles();
  renderArticles();
}

function updateReadStateButton(button, article) {
  if (!button) {
    return;
  }
  const active = state.read.has(article.id);
  button.classList.toggle("active", active);
  button.textContent = active ? "Lu ✓" : "Non lu";
  button.setAttribute("aria-label", active ? "Marquer comme non lu" : "Marquer comme lu");
}

async function shareArticle(article, button) {
  const shareUrl = article.url || window.location.href;
  const payload = {
    title: article.title_fr,
    text: article.summary_fr,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      flashButton(button, "Copié");
    }
  } catch {
    flashButton(button, "Erreur");
  }
}

function flashButton(button, text) {
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function cacheArticles() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state.articles));
  } catch {
    // Le cache est une aide, pas une condition de fonctionnement.
  }
}

function loadCachedArticles() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    if (!Array.isArray(saved) || !saved.length) {
      return false;
    }
    state.articles = normalizeArticles(saved);
    return true;
  } catch {
    return false;
  }
}

function renderInsights(articles) {
  renderTrends(articles);
  renderCategoryBars(articles);
  renderSourceCloud(articles);
}

function renderTrends(articles) {
  if (!trendList) return;
  const stopWords = new Set([
    "avec", "dans", "des", "les", "une", "pour", "sur", "aux", "par", "plus",
    "son", "ses", "qui", "que", "est", "sont", "civil", "genie", "construction"
  ]);
  const counts = new Map();
  articles.forEach((article) => {
    getArticleText(article)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(/[a-z0-9]{4,}/g)
      ?.forEach((word) => {
        if (!stopWords.has(word)) {
          counts.set(word, (counts.get(word) || 0) + 1);
        }
      });
  });

  const trends = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, 12);

  trendList.innerHTML = "";
  if (!trends.length) {
    trendList.textContent = "Aucune tendance pour ce filtre.";
    return;
  }

  trends.forEach(([word, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "trend-chip";
    button.textContent = `${word} ${count}`;
    button.addEventListener("click", () => {
      state.search = word;
      searchInput.value = word;
      renderArticles();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    trendList.appendChild(button);
  });
}

function renderCategoryBars(articles) {
  if (!categoryBars) return;
  const counts = new Map();
  articles.forEach((article) => {
    counts.set(article.category, (counts.get(article.category) || 0) + 1);
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...rows.map(([, count]) => count));

  categoryBars.innerHTML = "";
  if (!rows.length) {
    categoryBars.textContent = "Aucune categorie disponible.";
    return;
  }

  rows.forEach(([category, count]) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "category-bar";
    row.innerHTML = `
      <span>${escapeHtml(category)}</span>
      <strong>${count}</strong>
      <i class="bar-track" aria-hidden="true"><b class="bar-fill" style="width: ${(count / max) * 100}%"></b></i>
    `;
    row.addEventListener("click", () => {
      state.category = category;
      updateFilterButtons();
      renderArticles();
      document.querySelector("#actualites")?.scrollIntoView({ behavior: "smooth" });
    });
    categoryBars.appendChild(row);
  });
}

function renderSourceCloud(articles) {
  if (!sourceCloud) return;
  const counts = new Map();
  articles.forEach((article) => {
    counts.set(article.source, (counts.get(article.source) || 0) + 1);
  });
  const sources = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, 16);

  sourceCloud.innerHTML = "";
  if (!sources.length) {
    sourceCloud.textContent = "Aucune source active pour ce filtre.";
    return;
  }

  sources.forEach(([source, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "source-pill";
    button.textContent = `${source} (${count})`;
    button.addEventListener("click", () => {
      state.source = source;
      if (sourceFilter) sourceFilter.value = source;
      renderArticles();
      document.querySelector("#actualites")?.scrollIntoView({ behavior: "smooth" });
    });
    sourceCloud.appendChild(button);
  });
}

function renderTimeline(articles) {
  if (!timelineList) return;
  const latest = sortArticles(articles).slice(0, 7);
  timelineList.innerHTML = "";
  if (!latest.length) {
    timelineList.textContent = "Aucun mouvement recent.";
    return;
  }

  latest.forEach((article) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "timeline-item";
    item.innerHTML = `
      <span>${escapeHtml(formatDate(article.published_at))}</span>
      <strong>${escapeHtml(article.title_fr)}</strong>
      <small>${escapeHtml(article.source)} · ${escapeHtml(article.category)}</small>
    `;
    item.addEventListener("click", () => openReader(article));
    timelineList.appendChild(item);
  });
}

function getArticleText(article) {
  return [article.title_fr, article.summary_fr, article.category, article.source].join(" ");
}

function setupReader() {
  if (!readerModal) {
    return;
  }

  readerModal.querySelectorAll("[data-close-reader]").forEach((element) => {
    element.addEventListener("click", closeReader);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && readerModal.getAttribute("aria-hidden") === "false") {
      closeReader();
    }
  });
}

function openReader(article) {
  if (!readerModal || !readerFrame || !article?.url) {
    return;
  }

  markRead(article);
  readerTitle.textContent = article.title_fr;
  readerSummary.textContent = article.summary_fr;
  readerCategory.textContent = article.category;
  readerSource.textContent = article.source;
  readerDate.textContent = formatDate(article.published_at);
  readerSourceLink.href = article.url;
  readerSourceLink.setAttribute("aria-label", `Lire la source originale: ${article.title_fr}`);
  readerFrame.src = getTranslatedArticleUrl(article.url);

  readerModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function getTranslatedArticleUrl(url) {
  const translated = new URL("https://translate.google.com/translate");
  translated.searchParams.set("sl", "auto");
  translated.searchParams.set("tl", "fr");
  translated.searchParams.set("u", url);
  return translated.href;
}

function closeReader() {
  if (!readerModal || !readerFrame) {
    return;
  }

  readerModal.setAttribute("aria-hidden", "true");
  readerFrame.src = "about:blank";
  document.body.classList.remove("modal-open");
}

function setupBackToTop() {
  if (!backToTop) {
    return;
  }

  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 600);
  }, { passive: true });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupScrollProgress() {
  if (!scrollProgress) {
    return;
  }

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupMobileShortcuts() {
  mobileSearchFocus?.addEventListener("click", () => {
    searchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => searchInput?.focus(), 260);
  });

  mobileFiltersFocus?.addEventListener("click", () => {
    document.querySelector(".controls-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      searchInput?.focus();
    }
    if (event.key === "Escape" && isTyping && searchInput) {
      state.search = "";
      searchInput.value = "";
      renderArticles();
      searchInput.blur();
    }
  });
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
    lastUpdated.textContent = "Dernière mise à jour: non disponible";
    return;
  }

  const latest = new Date(Math.max(...dates));
  lastUpdated.textContent = `Dernière mise à jour: ${latest.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })}`;
}

function estimateReadingTime(text) {
  const words = cleanString(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
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

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return cleanString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
