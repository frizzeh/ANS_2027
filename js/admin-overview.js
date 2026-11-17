/* Admin: Prehľad */

function render() {
  const registrations = admin.registrations;
  $("#stat-registrations").textContent = registrations.length;
  $("#stat-paid").textContent = registrations.filter((item) => item.payment_status === "paid").length;
  $("#stat-waiting").textContent = registrations.filter((item) => item.payment_status === "awaiting_payment").length;
  $("#stat-review").textContent = admin.submissions.filter((item) => item.status === "in_review").length;

  const latest = [...registrations].sort((a, b) => b.id - a.id).slice(0, 5);
  $("#latest-body").replaceChildren(...latest.map((registration) =>
    h("tr", {},
      h("td", {}, fullName(userById(registration.user_id))),
      h("td", { class: "muted" }, t("cat." + categoryById(registration.category_id).code)),
      h("td", {}, paymentBadge(registration.payment_status)),
      h("td", {}, paperBadge(submissionOf(registration.id))))));
}

startAdminPage(["users", "registrations", "participant_categories", "submissions"], render);
