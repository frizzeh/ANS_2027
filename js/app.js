/* ==========================================================================
   Spoločná logika webu ANS 2027
   - komunikácia s PHP API (api/index.php)
   - prepínanie jazyka SK / EN
   - prihlásený používateľ a odkazy v hlavičke
   ========================================================================== */

const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];


/* API
   -------------------------------------------------------------------------- */
const API_URL = "api/index.php";
const CONFERENCE_ID = 1; // systém obsluhuje jednu konferenciu

let cachedCsrf = null;

/** CSRF token relácie. Po prihlásení/odhlásení sa session mení, preto sa token obnovuje. */
async function csrfToken(refresh = false) {
  if (!cachedCsrf || refresh) {
    const response = await fetchApi(`${API_URL}?action=csrf`, { credentials: "same-origin" });
    cachedCsrf = (await response.json()).token;
  }
  return cachedCsrf;
}

/** Odkaz na chránené stiahnutie súboru alebo exportu (kontroluje sa oprávnenie na serveri). */
const apiLink = (action, params = {}) => `${API_URL}?${new URLSearchParams({ action, ...params })}`;

/**
 * Zavolá akciu API. Ak je zadané `body`, ide o POST s JSON, inak o GET.
 * Pri chybe vyhodí Error so správou zo servera a stavovým kódom (`status`).
 */
async function realApi(action, { params = {}, body } = {}) {
  const url = new URL(API_URL, location.href);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers = {};
  let payload;
  if (body !== undefined) {
    headers["X-CSRF-Token"] = await csrfToken();
    if (body instanceof FormData) {
      payload = body; // nahrávanie súboru: prehliadač sám nastaví multipart hlavičku
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetchApi(url, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers,
    body: payload,
  });

  const data = await response.json().catch(() => ({}));
  if (action.startsWith("auth.")) cachedCsrf = null; // po prihlásení a odhlásení sa token načíta nanovo
  if (!response.ok) {
    throw Object.assign(new Error(data.error || response.statusText), { status: response.status });
  }
  return data;
}

/* Demo režim
   Ak server (PHP + databáza) nebeží, stránky automaticky prejdú do demo režimu: dáta sú v prehliadači
   (js/demo-data.js, zmeny v localStorage). Zapnúť ho možno aj adresou ?demo=1, vypnúť adresou ?demo=0.
   -------------------------------------------------------------------------- */
const DEMO_FLAG = "ans-demo";
const pageQuery = new URLSearchParams(location.search);
try {
  if (pageQuery.get("demo") === "1") localStorage.setItem(DEMO_FLAG, "1");
  if (pageQuery.get("demo") === "0") localStorage.removeItem(DEMO_FLAG);
} catch { /* localStorage nemusí byť dostupné */ }

let demoMode = false;
try { demoMode = localStorage.getItem(DEMO_FLAG) === "1"; } catch { /* nič */ }

let demoLoading = null;

/** Načíta ukážkové dáta a demo API (raz) a zobrazí pruh "Demo režim". */
function loadDemo() {
  demoLoading ||= ["js/demo-data.js", "js/demo-api.js"].reduce(
    (previous, src) => previous.then(() => new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement("script"), { src, onload: resolve, onerror: reject });
      document.head.append(script);
    })),
    Promise.resolve(),
  ).then(showDemoBanner);
  return demoLoading;
}

function enableDemo() {
  demoMode = true;
  try { localStorage.setItem(DEMO_FLAG, "1"); } catch { /* nič */ }
  return loadDemo();
}

/** Pruh dole na stránke: upozorní, že dáta sú len v prehliadači, a umožní demo vypnúť alebo vynulovať. */
function showDemoBanner() {
  const show = () => {
    if (document.querySelector(".demo-banner")) return;
    const roleSelect = h("select", {
      id: "demo-role",
      "aria-label": "Rola",
      onchange: (event) => { location.href = demoSwitchRole(event.target.value); },
    }, ...DEMO_ROLES.map((role) => h("option", { value: role.key, "data-i18n": "demo.role." + role.key }, role.key)));
    roleSelect.value = demoCurrentRole();

    // Nenápadný odkaz "Demo" v ľavom hornom rohu; ovládanie sa ukáže až po rozkliknutí.
    const banner = h("details", { class: "demo-banner" },
      h("summary", { "aria-label": "Demo" }, "Demo"),
      h("section", { class: "demo-banner__panel", "aria-label": "Demo" },
        h("label", { class: "demo-banner__role" }, h("span", { "data-i18n": "demo.role" }, "Rola"), roleSelect),
        h("p", { "data-i18n": "demo.banner" }, "Demo režim: dáta sú len v tomto prehliadači."),
        h("a", { href: "demo.html", "data-i18n": "demo.hub" }, "Ukážky"),
        h("button", { type: "button", "data-i18n": "demo.reset", onclick: () => { demoReset(); location.href = "demo.html"; } }, "Obnoviť dáta"),
        h("button", { type: "button", "data-i18n": "demo.exit", onclick: () => { try { localStorage.removeItem(DEMO_FLAG); } catch { /* nič */ } demoReset(); location.href = "index.html"; } }, "Ukončiť demo")));
    document.body.append(banner);
    translatePage();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
  else show();
}

/** Server nie je k dispozícii (nebeží PHP, otvorený súbor z disku, odpoveď nie je JSON). */
const noServer = () => Object.assign(new Error("no server"), { noServer: true });

async function fetchApi(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (location.protocol === "file:") throw noServer();
    throw error;
  }
  if (!(response.headers.get("content-type") || "").includes("json")) throw noServer();
  return response;
}

/** Zavolá akciu API (skutočný server, alebo demo režim, ak server nebeží). */
async function api(action, options = {}) {
  if (!demoMode) {
    try {
      return await realApi(action, options);
    } catch (error) {
      if (!error.noServer) throw error;
      await enableDemo();
    }
  }
  await loadDemo();
  return demoCall(action, options);
}

/** Otvorí odkaz na sťahovanie alebo export (v demo režime ich vytvorí prehliadač). */
function followLink(url) {
  if (demoMode) demoFile(url);
  else location.href = url;
}

// Odkazy na sťahovanie v demo režime nemajú kam viesť, preto ich obslúži demo modul.
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[href*='action=download'], a[href*='action=export']");
  if (!demoMode || !link) return;
  event.preventDefault();
  demoFile(link.href);
});

/** Zoznam riadkov tabuľky z API. */
const listTable = async (table) => (await api("list", { params: { table } })).data;

/** Vytvorí HTML prvok: h("td", { class: "x" }, "text", ďalšíPrvok). Texty sa vkladajú bezpečne. */
function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (name.startsWith("on")) element.addEventListener(name.slice(2), value);
    else if (value === true) element.setAttribute(name, "");
    else if (value !== false && value != null) element.setAttribute(name, value);
  });
  element.append(...children.flat());
  return element;
}

/** Dátum podľa jazyka stránky (SK alebo EN). */
const formatDate = (value) =>
  value ? new Date(String(value).replace(" ", "T")).toLocaleDateString(lang === "sk" ? "sk-SK" : "en-GB") : t("tba");

/** Doplní termíny do prvkov data-deadline="submission|review|payment|..." a data-conference-date. */
function showDeadlines(deadlines, conference) {
  $$("[data-deadline]").forEach((el) => {
    const deadline = deadlines.find((item) => item.step === el.dataset.deadline);
    el.textContent = deadline ? formatDate(deadline.deadline_at) : t("tba");
  });
  $$("[data-conference-date]").forEach((el) => {
    el.textContent = conference ? formatDate(conference.start_date) : t("tba");
  });
  showConferenceDays(conference);
}

/** Obdobie konania: "13.–14. mája 2027" (SK), "13–14 May 2027" (EN); pri rôznych mesiacoch obe dátumy celé. */
function formatDateRange(start, end, locale) {
  const full = (date) => date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  if (start.getTime() === end.getTime()) return full(start);

  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (!sameMonth) return `${full(start)} – ${full(end)}`;

  const dot = locale.startsWith("sk") ? "." : "";
  return `${start.getDate()}${dot}–${full(end)}`;
}

/**
 * Dátumy podľa termínu konferencie, ktorý nastavuje super admin (conference.start_date a end_date):
 *  - data-conference-range: celé obdobie konania, napr. "13.–14. mája 2027"
 *  - data-conference-location: miesto konania (conference.location)
 *  - data-day="0" data-time="08:30": bod programu, deň 0 = prvý deň konferencie, 1 = druhý atď.
 * Kým sa dáta nenačítajú, ostáva text napísaný priamo v HTML.
 */
function showConferenceDays(conference) {
  if (!conference?.start_date) return;
  const locale = lang === "sk" ? "sk-SK" : "en-GB";
  const start = new Date(conference.start_date + "T00:00:00");
  const end = new Date((conference.end_date || conference.start_date) + "T00:00:00");

  $$("[data-conference-range]").forEach((el) => {
    el.textContent = formatDateRange(start, end, locale);
  });

  $$("[data-conference-location]").forEach((el) => {
    if (conference.location) el.textContent = conference.location;
  });

  $$("[data-day]").forEach((el) => {
    const day = new Date(start);
    day.setDate(day.getDate() + Number(el.dataset.day));
    el.textContent = `${day.toLocaleDateString(locale, { day: "numeric", month: "numeric" })} · ${el.dataset.time}`;
  });
}

/** Text chyby pre používateľa: správa zo servera, alebo hláška o nedostupnom serveri. */
const errorText = (error) => (error.status ? error.message : t("err.network"));


/* Jazyk
   -------------------------------------------------------------------------- */
let lang = localStorage.getItem("ans-lang")
  || (navigator.language.startsWith("sk") ? "sk" : "en");

/** Vráti preklad pre kľúč v aktuálnom jazyku. */
const t = (key) => I18N[lang]?.[key] ?? key;

/** Stránka môže sem uložiť funkciu, ktorá po zmene jazyka prekreslí dynamický obsah. */
let onLanguageChange = null;

function translatePage() {
  document.documentElement.lang = lang;

  // Slovenský text je priamo v HTML (upravuješ ho tam), ostatné jazyky sa berú z js/i18n.js.
  $$("[data-i18n]").forEach((el) => {
    el.dataset.sk ??= el.textContent;
    el.textContent = lang === "sk" ? el.dataset.sk : t(el.dataset.i18n);
  });

  $$("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  $$("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });

  if (onLanguageChange) onLanguageChange();
}

function setLanguage(newLang) {
  lang = newLang;
  localStorage.setItem("ans-lang", lang);
  translatePage();
}


/* Prihlásený používateľ
   -------------------------------------------------------------------------- */
let currentUser = null;

if (demoMode) loadDemo();

/** Prebehne pri načítaní každej stránky. Stránky na ňu čakajú cez `ready.then(...)`. */
const ready = api("auth.me")
  .then((response) => { currentUser = response.data; })
  .catch(() => { currentUser = null; });

/** Má prihlásený používateľ aspoň jednu z uvedených rolí (participant, admin, superadmin)? */
const hasRole = (...codes) => Boolean(currentUser) && codes.some((code) => currentUser.roles.includes(code));

/** Roly z databázy, ktoré smú do administrácie (organizer = "admin" v rozhraní). */
const STAFF_ROLES = ["superadmin", "organizer", "program_committee", "finance"];
const isStaff = () => hasRole(...STAFF_ROLES);

/** Kam patrí používateľ po prihlásení podľa roly (recenzent zatiaľ nemá vlastnú stránku). */
const homePage = () => {
  if (hasRole("superadmin")) return "superadmin.html";
  if (isStaff()) return "admin.html";
  if (hasRole("reviewer")) return "recenzent.html";
  return currentUser?.roles.length ? "index.html" : "ucet.html";
};

/** Presmeruje na prihlásenie, ak používateľ nie je prihlásený. */
async function requireLogin() {
  await ready;
  if (currentUser) return true;
  location.replace("prihlasenie.html");
  return false;
}

/**
 * Pustí ďalej len používateľa s jednou z rolí, ostatných presmeruje.
 * POZOR: toto len skrýva stránku. Skutočnú ochranu dát robí server (api/index.php).
 */
async function requireRole(...codes) {
  if (!(await requireLogin())) return false;
  if (hasRole(...codes)) return true;
  location.replace(homePage());
  return false;
}

/** Zobrazí odkazy v hlavičke podľa roly (data-auth="guest | user | participant | admin | superadmin"). */
function updateAuthLinks() {
  const visible = {
    guest: !currentUser,
    user: Boolean(currentUser),
    participant: Boolean(currentUser) && currentUser.roles.length === 0,
    admin: isStaff(),
    reviewer: hasRole("reviewer"),
    superadmin: hasRole("superadmin"),
  };
  $$("[data-auth]").forEach((el) => {
    el.hidden = !visible[el.dataset.auth];
  });
}


/* Spustenie
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  $$("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  $$("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api("auth.logout", { body: {} }).catch(() => {});
      sessionStorage.removeItem("ans-draft-title");
      location.href = "index.html";
    });
  });

  translatePage();
  ready.then(updateAuthLinks);
});
