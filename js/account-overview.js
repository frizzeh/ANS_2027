/* Prehľad účtu: platba, termíny a príspevok */

function render() {
  const { registration, conference, deadlines } = account;

  const status = registration.payment_status;
  setBadge($("#pay-status"), t("pay.status." + status), status === "paid");
  $("#pay-amount").textContent = registration.amount_due + " €";
  $("#pay-iban").textContent = conference.iban || t("tba");
  $("#pay-symbol").textContent = registration.variable_symbol;
  $("#pay-due").textContent = registration.due_date ? formatDate(registration.due_date) : t("tba");

  showDeadlines(deadlines, conference);
  renderPaperCard();
}

startAccountPage(render);
