/* Admin: Program konferencie */

const form = $("#program-form");
const symposiumSelect = $("#symposium-select");

function renderSymposiumOptions() {
  const selected = symposiumSelect.value;
  symposiumSelect.replaceChildren(
    new Option("–", ""),
    ...admin.symposia.map((symposium) => new Option(lang === "sk" ? symposium.name_sk : symposium.name_en, symposium.id)));
  symposiumSelect.value = selected;
}

function render() {
  renderSymposiumOptions();

  const items = [...admin.program_items].sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
  const rows = items.map((item) => {
    const symposium = admin.symposia.find((entry) => entry.id === item.symposium_id);
    return h("tr", {},
      h("td", {}, item.title),
      h("td", { class: "muted" }, item.room || "–"),
      h("td", {}, item.start_at ? formatDate(item.start_at) + " " + String(item.start_at).slice(11, 16) : "–"),
      h("td", {}, item.end_at ? String(item.end_at).slice(11, 16) : "–"),
      h("td", { class: "muted" }, symposium ? (lang === "sk" ? symposium.name_sk : symposium.name_en) : "–"),
      h("td", {}, h("button", {
        class: "button button--small button--ghost", type: "button",
        onclick: () => confirm(t("prg.confirm")) && act("program.delete", { id: item.id }),
      }, t("prg.delete"))));
  });
  $("#program-body").replaceChildren(...rows);
  $("#program-empty").hidden = rows.length > 0;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const response = await act("program.create", {
    title: data.get("title"),
    room: data.get("room"),
    start_at: data.get("start"),
    end_at: data.get("end"),
    symposium_id: data.get("symposium") ? Number(data.get("symposium")) : null,
  });
  if (response) form.reset();
});

startAdminPage(["symposia", "program_items"], render);
