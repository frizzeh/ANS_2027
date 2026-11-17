/* Admin: E-maily (hromadný e-mail a zoznam odoslaných) */

const form = $("#email-form");
const audience = $("#audience");

function renderAudience() {
  const selected = audience.value;
  audience.replaceChildren(
    new Option(t("eml.audience.all"), ""),
    ...PAYMENT_STATUSES.map((status) => new Option(t("pay.status." + status), status)));
  audience.value = selected;
}

function render() {
  renderAudience();
  const rows = [...admin.email_log].sort((a, b) => b.id - a.id).slice(0, 50).map((entry) =>
    h("tr", {},
      h("td", {}, formatDate(entry.sent_at)),
      h("td", {}, entry.recipient_email),
      h("td", { class: "muted" }, entry.subject || "–")));
  $("#log-body").replaceChildren(...rows);
  $("#log-empty").hidden = rows.length > 0;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const response = await act("email.send", {
    payment_status: data.get("audience"),
    subject: data.get("subject"),
    message: data.get("message"),
  });
  if (response) {
    form.reset();
    showNotice(t("eml.result").replace("{n}", response.recipients).replace("{d}", response.accepted));
  }
});

startAdminPage(["email_log"], render);
