/* ==========================================================================
   Spoločná časť stránok administrácie: načítanie dát, pomocné funkcie, štítky
   Stránky sú dostupné len pre zamestnancov (STAFF_ROLES). Oprávnenia kontroluje server.
   ========================================================================== */

const admin = {}; // admin.users, admin.registrations ... (kľúč = názov tabuľky)

const errorBox = $("#error");
const notice = $("#notice");

let adminTables = [];
let drawPage = () => {};

function showError(error) {
  if (notice) notice.hidden = true;
  errorBox.textContent = errorText(error);
  errorBox.hidden = false;
}

function showNotice(text) {
  errorBox.hidden = true;
  if (!notice) return;
  if (text) notice.textContent = text;
  notice.hidden = false;
}


/* Pomocné funkcie
   -------------------------------------------------------------------------- */
const fullName = (user) =>
  user ? [user.title_before, user.first_name, user.last_name, user.title_after].filter(Boolean).join(" ") : "–";

const yesNo = (value) => t(value ? "common.yes" : "common.no");
const userById = (id) => admin.users.find((user) => user.id === id);
const categoryById = (id) => admin.participant_categories.find((category) => category.id === id);
const submissionOf = (registrationId) => admin.submissions.find((item) => item.registration_id === registrationId) || null;

/** Súčet prijatých platieb registrácie (vrátenia sa odpočítajú). */
const paidSum = (registrationId) =>
  admin.payments
    .filter((payment) => payment.registration_id === registrationId)
    .reduce((sum, payment) => sum + (payment.type === "refund" ? -1 : 1) * Number(payment.amount), 0);

/** Zostáva uhradiť. */
const remaining = (registration) => Number(registration.amount_due) - paidSum(registration.id);

const PAPER_STATUSES = [
  "submitted", "admin_check", "in_review", "committee_decision",
  "revision_requested", "conditionally_accepted", "accepted", "rejected",
];

const PAYMENT_STATUSES = ["awaiting_payment", "partially_paid", "paid", "overdue", "cancelled", "refunded"];

/* Štítky: zelený = v poriadku, modrý = prebieha, sivý = nič, červený = zamietnuté, žltý = pozor */
const PAYMENT_CLASS = {
  awaiting_payment: "", partially_paid: "badge--info", paid: "badge--ok",
  overdue: "", cancelled: "badge--muted", refunded: "badge--muted",
};
const PAPER_CLASS = {
  submitted: "badge--info", admin_check: "badge--info", in_review: "badge--info", committee_decision: "badge--info",
  revision_requested: "", conditionally_accepted: "", accepted: "badge--ok", rejected: "badge--bad",
};

const badge = (text, modifier = "") => h("span", { class: ("badge " + modifier).trim() }, text);
const paymentBadge = (status) => badge(t("pay.status." + status), PAYMENT_CLASS[status]);
const paperBadge = (submission) => submission
  ? badge(t("paper.status." + submission.status), PAPER_CLASS[submission.status])
  : badge(t("adm.paper.none"), "badge--muted");

/** Názov roly zamestnanca (zobrazí sa v bočnom menu). */
function roleLabel() {
  const code = STAFF_ROLES.find((item) => currentUser.roles.includes(item));
  const role = admin.roles.find((item) => item.code === code);
  return role ? (lang === "sk" ? role.name_sk : role.name_en) : "";
}


/* Načítanie a akcie
   -------------------------------------------------------------------------- */
async function loadAdmin() {
  const names = ["roles", ...adminTables];
  const rows = await Promise.all(names.map(listTable));
  names.forEach((name, index) => { admin[name] = rows[index]; });
}

/** Zavolá akciu API, znovu načíta dáta a prekreslí stránku. Pri chybe ukáže hlášku. */
async function act(action, body) {
  errorBox.hidden = true;
  if (notice) notice.hidden = true;
  try {
    const response = await api(action, { body });
    await loadAdmin();
    drawPage();
    return response;
  } catch (error) {
    showError(error);
    return null;
  }
}

/** Spustí stránku: overí rolu, načíta tabuľky a vykreslí obsah (aj po zmene jazyka). */
async function startAdminPage(tables, render) {
  try {
    if (!(await requireRole(...STAFF_ROLES))) return;
    $("#admin-main").hidden = false;
    adminTables = tables;
    await loadAdmin();
    drawPage = () => {
      $("#role-name").textContent = roleLabel();
      render();
    };
    onLanguageChange = drawPage;
    drawPage();
  } catch (error) {
    showError(error);
  }
}
