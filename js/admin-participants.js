/* Admin: Účastníci (hľadanie, filtre, export, detail) */

const search = $("#search");
const filterStatus = $("#filter-status");
const filterCategory = $("#filter-category");
const dialog = $("#detail");
let openedId = null;

/** Registrácie podľa hľadaného textu a filtrov. */
function visibleRegistrations() {
  const text = search.value.trim().toLowerCase();
  return admin.registrations.filter((registration) => {
    const user = userById(registration.user_id);
    const haystack = [fullName(user), user?.organization, user?.email].join(" ").toLowerCase();
    return (!text || haystack.includes(text))
      && (!filterStatus.value || registration.payment_status === filterStatus.value)
      && (!filterCategory.value || String(registration.category_id) === filterCategory.value);
  });
}

function renderCategoryFilter() {
  const selected = filterCategory.value;
  filterCategory.replaceChildren(
    new Option(t("adm.col.category"), ""),
    ...admin.participant_categories.map((category) => new Option(t("cat." + category.code), category.id)));
  filterCategory.value = selected;
}

function renderStats() {
  const registrations = admin.registrations;
  $("#stat-registrations").textContent = registrations.length;
  $("#stat-paid").textContent = registrations.filter((item) => item.payment_status === "paid").length;
  $("#stat-waiting").textContent = registrations.filter((item) => item.payment_status === "awaiting_payment").length;
  $("#stat-review").textContent = admin.submissions.filter((item) => item.status === "in_review").length;
}

function renderTable() {
  const rows = visibleRegistrations().map((registration) => {
    const user = userById(registration.user_id);
    return h("tr", {},
      h("td", {}, fullName(user)),
      h("td", { class: "muted" }, user?.organization || "–"),
      h("td", {}, t("cat." + categoryById(registration.category_id).code)),
      h("td", {}, paymentBadge(registration.payment_status)),
      h("td", {}, paperBadge(submissionOf(registration.id))),
      h("td", {}, h("a", { href: "#", onclick: (event) => { event.preventDefault(); openDetail(registration.id); } }, t("adm.detail"))));
  });
  $("#people-body").replaceChildren(...rows);
  $("#people-empty").hidden = rows.length > 0;
}

function render() {
  renderCategoryFilter();
  renderStats();
  renderTable();
  if (dialog.open) renderDetail();
}

/* Detail účastníka (dialóg)
   -------------------------------------------------------------------------- */
function openDetail(registrationId) {
  openedId = registrationId;
  renderDetail();
  if (!dialog.open) dialog.showModal();
}

function renderDetail() {
  const registration = admin.registrations.find((item) => item.id === openedId);
  if (!registration) return dialog.close();

  const user = userById(registration.user_id);
  const submission = submissionOf(registration.id);
  const payments = admin.payments.filter((item) => item.registration_id === registration.id);

  $("#detail-name").textContent = fullName(user);

  const info = [
    ["f.email", user.email],
    ["f.org", user.organization],
    ["f.dept", user.department],
    ["f.country", user.country],
    ["acc.cat", t("cat." + categoryById(registration.category_id).code)],
    ["rp.student", yesNo(registration.is_student)],
    ["pay.amount", registration.amount_due + " €"],
    ["rp.exempt", yesNo(registration.fee_exempt) + (registration.exempt_reason ? ` (${registration.exempt_reason})` : "")],
    ["pay.vs", registration.variable_symbol],
    ["pay.due", registration.due_date ? formatDate(registration.due_date) : "–"],
    ["rp.created", formatDate(registration.created_at)],
    ["rp.gdpr", formatDate(registration.gdpr_consent_at)],
    ["f.diet", registration.dietary_requirements],
  ];
  $("#detail-info").replaceChildren(...info.flatMap(([key, value]) => [h("dt", {}, t(key)), h("dd", {}, value || "–")]));

  $("#detail-billing").textContent = [
    registration.billing_name, registration.billing_street,
    [registration.billing_zip, registration.billing_city].filter(Boolean).join(" "), registration.billing_country,
    registration.billing_ico && "IČO " + registration.billing_ico, registration.billing_dic && "DIČ " + registration.billing_dic,
  ].filter(Boolean).join(", ") || "–";

  $("#detail-payments").replaceChildren(...payments.map((payment) =>
    h("tr", {}, h("td", {}, formatDate(payment.received_at)), h("td", {}, t("payp.type." + payment.type)), h("td", {}, payment.amount + " €"))));
  $("#detail-payments-empty").hidden = payments.length > 0;

  $("#detail-paper").replaceChildren(
    ...(submission ? [h("strong", {}, submission.title), " ", paperBadge(submission)] : [paperBadge(null)]));

  const actions = [];
  if (!["paid", "cancelled", "refunded"].includes(registration.payment_status)) {
    actions.push(h("button", { class: "button", type: "button", onclick: () => confirmPayment(registration) }, t("adm.confirm.pay")));
  }
  actions.push(h("button", { class: "button button--ghost", type: "button", onclick: () => toggleExempt(registration) },
    t(registration.fee_exempt ? "adm.unexempt" : "adm.exempt")));
  $("#detail-actions").replaceChildren(...actions);
}

async function confirmPayment(registration) {
  if (!confirm(t("adm.confirm.ask"))) return;
  await act("payment.create", {
    registration_id: registration.id,
    type: "payment",
    amount: remaining(registration),
    note: "Potvrdil: " + currentUser.email,
  });
}

async function toggleExempt(registration) {
  const exempt = !registration.fee_exempt;
  const reason = exempt ? prompt(t("adm.exempt.reason")) : "";
  if (exempt && reason === null) return; // zrušené
  await act("registration.exempt", { registration_id: registration.id, exempt, reason });
}

/* Export (CSV/XLSX generuje server, rešpektuje aktuálne filtre)
   -------------------------------------------------------------------------- */
function exportParticipants(format) {
  const params = { type: "participants", format };
  if (filterStatus.value) params.payment_status = filterStatus.value;
  if (filterCategory.value) params.category_id = filterCategory.value;
  followLink(apiLink("export", params));
}

$("#export-button").addEventListener("click", () => exportParticipants("csv"));
$("#export-xlsx-button").addEventListener("click", () => exportParticipants("xlsx"));
$("#export-attendance-button").addEventListener("click", () => followLink(apiLink("export", { type: "attendance", format: "csv" })));
$("#detail-close").addEventListener("click", () => dialog.close());
[search, filterStatus, filterCategory].forEach((control) => control.addEventListener("input", renderTable));
$("#filters").addEventListener("submit", (event) => event.preventDefault());

startAdminPage(["users", "registrations", "participant_categories", "payments", "submissions"], render);
