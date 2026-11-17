/* Admin: Platby (potvrdzovanie prijatých platieb) */

const filterStatus = $("#filter-status");

function render() {
  const rows = admin.registrations
    .filter((registration) => !filterStatus.value || registration.payment_status === filterStatus.value)
    .map((registration) => {
      const isOpen = !["paid", "cancelled", "refunded"].includes(registration.payment_status);
      return h("tr", {},
        h("td", {}, fullName(userById(registration.user_id))),
        h("td", { class: "muted" }, t("cat." + categoryById(registration.category_id).code)),
        h("td", {}, registration.amount_due + " €"),
        h("td", {}, paidSum(registration.id) + " €"),
        h("td", { class: "muted" }, registration.variable_symbol),
        h("td", {}, paymentBadge(registration.payment_status)),
        h("td", {}, isOpen
          ? h("button", { class: "button button--small", type: "button", onclick: () => confirmPayment(registration) }, t("adm.confirm.pay"))
          : ""));
    });
  $("#payments-body").replaceChildren(...rows);
  $("#payments-empty").hidden = rows.length > 0;
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

filterStatus.addEventListener("change", render);
startAdminPage(["users", "registrations", "participant_categories", "payments"], render);
