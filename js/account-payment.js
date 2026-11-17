/* Platba: platobné údaje, prijaté platby a doklady */

function render() {
  const { registration, conference, payments, invoices } = account;

  const status = registration.payment_status;
  setBadge($("#pay-status"), t("pay.status." + status), status === "paid");
  $("#pay-amount").textContent = registration.amount_due + " €";
  $("#pay-iban").textContent = conference.iban || t("tba");
  $("#pay-symbol").textContent = registration.variable_symbol;
  $("#pay-due").textContent = registration.due_date ? formatDate(registration.due_date) : t("tba");

  const paymentRows = payments.map((payment) =>
    h("tr", {},
      h("td", {}, formatDate(payment.received_at)),
      h("td", {}, t("payp.type." + payment.type)),
      h("td", {}, payment.amount + " €")));
  $("#payments-body").replaceChildren(...paymentRows);
  $("#payments-empty").hidden = payments.length > 0;

  $("#invoices-card").hidden = invoices.length === 0;
  $("#invoices-body").replaceChildren(...invoices.map((invoice) =>
    h("tr", {},
      h("td", {}, invoice.invoice_number),
      h("td", {}, formatDate(invoice.issued_at)),
      h("td", {}, invoice.amount + " €"))));
}

startAccountPage(render);
