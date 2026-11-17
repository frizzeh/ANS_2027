/* ==========================================================================
   Spoločná časť stránok účtu účastníka:
   načítanie dát, hlavička a karta príspevku
   ========================================================================== */

const account = {
  registration: null,
  category: null,
  conference: null,
  submission: null,
  symposia: [],
  versions: [],
  payments: [],
  invoices: [],
  deadlines: [],
  reviews: [],
};

const errorBox = $("#error");
const notice = $("#notice");

function showError(error) {
  if (notice) notice.hidden = true;
  errorBox.textContent = typeof error === "string" ? error : errorText(error);
  errorBox.hidden = false;
}

function showNotice() {
  errorBox.hidden = true;
  if (notice) notice.hidden = false;
}

/** Nastaví text štítku; zelená farba znamená "hotové". */
function setBadge(element, text, isGood = false) {
  element.textContent = text;
  element.classList.toggle("badge--ok", isGood);
}

/** Načíta údaje prihláseného účastníka. Vráti false, ak sa stránka nemá zobraziť. */
async function loadAccount() {
  if (!(await requireLogin())) return false;
  if (currentUser.roles.length) {
    location.replace(homePage()); // zamestnanci a recenzenti tu nemajú čo robiť
    return false;
  }

  const tables = [
    "registrations", "participant_categories", "conferences", "symposia", "submissions",
    "submission_versions", "payments", "invoices", "deadlines", "reviews",
  ];
  const [registrations, categories, conferences, symposia, submissions, versions, payments, invoices, deadlines, reviews] =
    await Promise.all(tables.map(listTable));

  const registration = registrations.find((item) => item.user_id === currentUser.id);
  if (!registration) {
    showError(t("acc.noreg"));
    return false;
  }

  const submission = submissions.find((item) => item.registration_id === registration.id) || null;
  Object.assign(account, {
    registration,
    category: categories.find((item) => item.id === registration.category_id),
    conference: conferences.find((item) => item.id === registration.conference_id),
    symposia,
    submission,
    versions: submission
      ? versions.filter((item) => item.submission_id === submission.id).sort((a, b) => b.version_number - a.version_number)
      : [],
    payments: payments.filter((item) => item.registration_id === registration.id),
    invoices: invoices.filter((item) => item.registration_id === registration.id),
    deadlines,
    reviews,
  });
  return true;
}

/** Podnadpis pod nadpisom stránky: "Registrovaný rečník | ANS 2027". */
function fillHeader() {
  const name = $("#user-name");
  if (name) name.textContent = currentUser.first_name;
  $("#user-subtitle").textContent = `${t("cat." + account.category.code)} | ${account.conference.name}`;
}


/* Karta "Môj príspevok" (Prehľad aj stránka Príspevky)
   -------------------------------------------------------------------------- */
/** Ktorý krok postupu je aktuálny (4 = všetko hotové). */
const CURRENT_STEP = {
  submitted: 0,
  admin_check: 1,
  in_review: 2,
  revision_requested: 2,
  committee_decision: 3,
  conditionally_accepted: 4,
  accepted: 4,
  rejected: 4,
};

function renderPaperCard() {
  const { category, submission, versions, symposia } = account;
  const hasPaper = Boolean(category.submission_type);

  $("#paper-card").hidden = !hasPaper;
  $("#paper-none").hidden = hasPaper;
  if (!hasPaper) return;

  const draftTitle = sessionStorage.getItem("ans-draft-title");
  $("#paper-title").textContent = submission ? submission.title : (draftTitle || "–");

  const meta = [t("pp.type." + category.submission_type)];
  if (submission) {
    const symposium = symposia.find((item) => item.id === submission.symposium_id);
    if (symposium) meta.push(lang === "sk" ? symposium.name_sk : symposium.name_en);
    meta.push(`${t("paper.version")} ${versions[0]?.version_number ?? 0}`);
  }
  $("#paper-meta").textContent = meta.join(" | ");

  const status = submission ? submission.status : "draft";
  const badge = $("#paper-status");
  setBadge(badge, t("paper.status." + status), status === "accepted");
  badge.classList.toggle("badge--info", Boolean(submission) && status !== "accepted");

  const progress = $("#paper-progress");
  progress.hidden = !submission;
  if (submission) {
    const current = CURRENT_STEP[submission.status];
    $$("li", progress).forEach((step, index) => {
      step.className = index < current ? "is-done" : index === current ? "is-current" : "";
    });
  }

  const upload = $("#paper-upload");
  upload.textContent = t(submission ? "paper.newversion" : "paper.go");
  upload.href = submission ? "ucet-prispevky.html#upload" : "ucet-prispevky.html";
  $("#paper-reviews").hidden = !submission;
}


/* Spustenie stránky
   -------------------------------------------------------------------------- */
/** Načíta dáta a vykreslí stránku; po zmene jazyka ju vykreslí znova. */
async function startAccountPage(render) {
  try {
    if (!(await loadAccount())) return;
    const draw = () => {
      fillHeader();
      render();
    };
    onLanguageChange = draw;
    draw();
  } catch (error) {
    showError(error);
  }
}
