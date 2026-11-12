/* Admin panel: účastníci, platby, príspevky a tematické oblasti.
   Stránka je dostupná len pre rolu admin (a super admin). */

const PAYMENT_STATUSES = ["awaiting_payment", "partially_paid", "paid", "overdue", "cancelled", "refunded"];
const PAPER_STATUSES = [
  "submitted", "admin_check", "in_review", "committee_decision",
  "revision_requested", "conditionally_accepted", "accepted", "rejected",
];

const errorBox = $("#error");
const filterStatus = $("#filter-status");
let data = null;

/* Pomocné funkcie
   -------------------------------------------------------------------------- */
const fullName = (user) =>
  user ? [user.title_before, user.first_name, user.last_name, user.title_after].filter(Boolean).join(" ") : "–";

const paidSum = (registrationId) =>
  data.payments
    .filter((payment) => payment.registration_id === registrationId)
    .reduce((sum, payment) => sum + (payment.type === "refund" ? -1 : 1) * Number(payment.amount), 0);

const statusBadge = (text, isGood) => h("span", { class: "badge" + (isGood ? " badge--ok" : "") }, text);

function showError(error) {
  errorBox.textContent = errorText(error);
  errorBox.hidden = false;
}

/** Zavolá akciu API, potom znovu načíta dáta. Chyby ukáže hore na stránke. */
async function run(action, body) {
  errorBox.hidden = true;
  try {
    await api(action, { body });
    await refresh();
  } catch (error) {
    showError(error);
    await refresh().catch(() => {});
  }
}

/* Vykreslenie
   -------------------------------------------------------------------------- */
function renderStats() {
  const registrations = data.registrations;
  $("#stat-registrations").textContent = registrations.length;
  $("#stat-paid").textContent = registrations.filter((r) => r.payment_status === "paid").length;
  $("#stat-waiting").textContent = registrations.filter((r) => r.payment_status === "awaiting_payment").length;
  $("#stat-papers").textContent = data.submissions.length;
}

function visibleRegistrations() {
  const status = filterStatus.value;
  return data.registrations.filter((registration) => !status || registration.payment_status === status);
}

function renderPeople() {
  const rows = visibleRegistrations().map((registration) => {
    const user = data.users.find((item) => item.id === registration.user_id);
    const category = data.categories.find((item) => item.id === registration.category_id);
    const isOpen = !["paid", "cancelled", "refunded"].includes(registration.payment_status);

    return h("tr", {},
      h("td", {}, fullName(user)),
      h("td", {}, user?.organization || "–"),
      h("td", {}, category ? t("cat." + category.code) : "–"),
      h("td", {}, registration.amount_due + " €"),
      h("td", {}, registration.variable_symbol),
      h("td", {}, statusBadge(t("pay.status." + registration.payment_status), registration.payment_status === "paid")),
      h("td", {}, isOpen
        ? h("button", { class: "button button--small", type: "button", onclick: () => confirmPayment(registration) }, t("adm.confirm.pay"))
        : ""),
    );
  });
  $("#people-body").replaceChildren(...rows);
  $("#people-empty").hidden = rows.length > 0;
}

function renderPapers() {
  const rows = data.submissions.map((submission) => {
    const registration = data.registrations.find((item) => item.id === submission.registration_id);
    const author = registration && data.users.find((item) => item.id === registration.user_id);

    const select = h("select", {
      "aria-label": t("adm.col.change"),
      onchange: (event) => run("submission.status", {
        submission_id: submission.id,
        to_status: event.target.value,
        changed_by: currentUser.id,
      }),
    }, PAPER_STATUSES.map((status) =>
      h("option", { value: status, selected: status === submission.status }, t("paper.status." + status))));

    return h("tr", {},
      h("td", {}, submission.title),
      h("td", {}, fullName(author)),
      h("td", {}, t("pp.type." + submission.type)),
      h("td", {}, statusBadge(t("paper.status." + submission.status), submission.status === "accepted")),
      h("td", {}, select),
    );
  });
  $("#papers-body").replaceChildren(...rows);
  $("#papers-empty").hidden = rows.length > 0;
}

function renderSymposia() {
  const items = data.symposia.map((symposium) =>
    h("li", {}, lang === "sk" ? symposium.name_sk : symposium.name_en));
  $("#symposia-list").replaceChildren(...items);
}

function render() {
  if (!data) return;
  renderStats();
  renderPeople();
  renderPapers();
  renderSymposia();
}

/* Akcie
   -------------------------------------------------------------------------- */
function confirmPayment(registration) {
  if (!confirm(t("adm.confirm.ask"))) return;
  run("payment.create", {
    registration_id: registration.id,
    type: "payment",
    amount: Number(registration.amount_due) - paidSum(registration.id),
    note: "Potvrdil: " + currentUser.email,
  });
}

/** Stiahne zoznam účastníkov ako CSV (otvorí sa aj v Exceli). */
function exportCsv() {
  const header = ["Meno", "E-mail", "Organizácia", "Krajina", "Kategória", "Študent", "Suma", "Var. symbol", "Stav platby", "Strava"];
  const lines = visibleRegistrations().map((registration) => {
    const user = data.users.find((item) => item.id === registration.user_id);
    const category = data.categories.find((item) => item.id === registration.category_id);
    return [
      fullName(user), user?.email, user?.organization, user?.country, category?.code,
      registration.is_student ? "áno" : "nie", registration.amount_due, registration.variable_symbol,
      registration.payment_status, registration.dietary_requirements,
    ];
  });
  const quote = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  const csv = "\ufeff" + [header, ...lines].map((line) => line.map(quote).join(";")).join("\r\n");

  const link = h("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: "ucastnici-ans-2027.csv" });
  link.click();
  URL.revokeObjectURL(link.href);
}

/* Načítanie dát
   -------------------------------------------------------------------------- */
async function refresh() {
  const tables = ["users", "registrations", "participant_categories", "payments", "submissions", "symposia"];
  const [users, registrations, categories, payments, submissions, symposia] = await Promise.all(tables.map(listTable));
  data = { users, registrations, categories, payments, submissions, symposia };
  render();
}

filterStatus.addEventListener("change", renderPeople);
$("#export-button").addEventListener("click", exportCsv);

$("#symposium-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  await run("symposium.create", { name_sk: form.elements.nameSk.value, name_en: form.elements.nameEn.value });
  form.reset();
});

onLanguageChange = render;

(async () => {
  if (!(await requireRole("admin", "superadmin"))) return;
  $("#admin-main").hidden = false;
  await refresh();
})().catch(showError);
