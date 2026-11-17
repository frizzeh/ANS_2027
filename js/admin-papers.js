/* Admin: Príspevky (zmena stavu) a tematické oblasti */

function renderPapers() {
  const rows = admin.submissions.map((submission) => {
    const registration = admin.registrations.find((item) => item.id === submission.registration_id);
    const select = h("select", {
      "aria-label": t("adm.col.change"),
      onchange: (event) => act("submission.status", { submission_id: submission.id, to_status: event.target.value }),
    }, PAPER_STATUSES.map((status) =>
      h("option", { value: status, selected: status === submission.status }, t("paper.status." + status))));

    return h("tr", {},
      h("td", {}, submission.title),
      h("td", { class: "muted" }, fullName(userById(registration?.user_id))),
      h("td", {}, t("pp.type." + submission.type)),
      h("td", {}, paperBadge(submission)),
      h("td", {}, select));
  });
  $("#papers-body").replaceChildren(...rows);
  $("#papers-empty").hidden = rows.length > 0;
}

function renderSymposia() {
  $("#symposia-list").replaceChildren(...admin.symposia.map((symposium) =>
    h("li", {}, lang === "sk" ? symposium.name_sk : symposium.name_en)));
}

function render() {
  renderPapers();
  renderSymposia();
}

$("#symposium-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const response = await act("symposium.create", { name_sk: form.elements.nameSk.value, name_en: form.elements.nameEn.value });
  if (response) form.reset();
});

startAdminPage(["users", "registrations", "submissions", "symposia"], render);
