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

/**
 * Zavolá akciu API. Ak je zadané `body`, ide o POST s JSON, inak o GET.
 * Pri chybe vyhodí Error so správou zo servera a stavovým kódom (`status`).
 */
async function api(action, { params = {}, body } = {}) {
  const url = new URL(API_URL, location.href);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error || response.statusText), { status: response.status });
  }
  return data;
}

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

  $$("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
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

/** Prebehne pri načítaní každej stránky. Stránky na ňu čakajú cez `ready.then(...)`. */
const ready = api("auth.me")
  .then((response) => { currentUser = response.data; })
  .catch(() => { currentUser = null; });

/** Má prihlásený používateľ aspoň jednu z uvedených rolí (participant, admin, superadmin)? */
const hasRole = (...codes) => Boolean(currentUser) && codes.some((code) => currentUser.roles.includes(code));

/** Kam patrí používateľ po prihlásení podľa roly. */
const homePage = () => (hasRole("superadmin") ? "superadmin.html" : hasRole("admin") ? "admin.html" : "ucet.html");

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
    participant: Boolean(currentUser) && !hasRole("admin", "superadmin"),
    admin: hasRole("admin", "superadmin"),
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
