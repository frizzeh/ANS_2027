/* Super admin: administrátori, nastavenia konferencie a poplatky.
   Stránka je dostupná len pre rolu superadmin. */

const errorBox = $("#error");
const notice = $("#notice");
const conferenceForm = $("#conference-form");
let data = null;

function showError(error) {
  notice.hidden = true;
  errorBox.textContent = errorText(error);
  errorBox.hidden = false;
}

function showNotice() {
  errorBox.hidden = true;
  notice.hidden = false;
}

/** Zavolá akciu API, potom znovu načíta dáta. */
async function run(action, body) {
  errorBox.hidden = true;
  notice.hidden = true;
  try {
    await api(action, { body });
    await refresh();
    showNotice();
    return true;
  } catch (error) {
    showError(error);
    return false;
  }
}

/* Vykreslenie
   -------------------------------------------------------------------------- */
/** Názov roly v aktuálnom jazyku. */
const roleName = (role) => (lang === "sk" ? role.name_sk : role.name_en);

/** Roly, ktoré smie super admin prideľovať (rola superadmin sa v rozhraní nedáva ani neodoberá). */
const assignableRoles = () => data.roles.filter((role) => role.code !== "superadmin");

/** Roly používateľa (z tabuľky roles). */
const rolesOf = (userId) => data.userRoles
  .filter((item) => item.user_id === userId)
  .map((item) => data.roles.find((role) => role.id === item.role_id))
  .filter(Boolean);

/** Štítok roly; pri bežných rolách s tlačidlom × na odobratie. */
function roleChip(user, role) {
  if (role.code === "superadmin") return h("li", { class: "chip chip--fixed" }, roleName(role));
  return h("li", { class: "chip" },
    roleName(role),
    h("button", {
      type: "button",
      title: t("sup.role.remove"),
      "aria-label": `${t("sup.role.remove")}: ${roleName(role)}`,
      onclick: () => run("role.remove", { user_id: user.id, role: role.code }),
    }, "×"));
}

/** Výber chýbajúcej roly a tlačidlo na jej pridanie (vráti prvky do riadku akcií). */
function roleAdder(user) {
  const held = new Set(rolesOf(user.id).map((role) => role.code));
  const free = assignableRoles().filter((role) => !held.has(role.code));
  if (!free.length) return [];

  const select = h("select", { "aria-label": t("sup.role.choose") },
    new Option(t("sup.role.choose"), ""),
    ...free.map((role) => new Option(roleName(role), role.code)));
  return [select, h("button", {
    class: "button button--small button--ghost",
    type: "button",
    onclick: () => select.value && run("role.add", { user_id: user.id, role: select.value }),
  }, t("sup.role.add"))];
}

/** Zamestnanci = všetci používatelia, ktorí majú aspoň jednu rolu. */
function renderAdmins() {
  const staffIds = new Set(data.userRoles.map((item) => item.user_id));
  const superadminIds = new Set(
    data.userRoles.filter((item) => data.roles.find((role) => role.id === item.role_id)?.code === "superadmin").map((item) => item.user_id));

  const rows = data.users.filter((user) => staffIds.has(user.id)).map((user) =>
    h("tr", {},
      h("td", {}, [user.title_before, user.first_name, user.last_name].filter(Boolean).join(" ")),
      h("td", {}, user.email),
      h("td", {}, h("ul", { class: "chips" }, rolesOf(user.id).map((role) => roleChip(user, role)))),
      h("td", {}, h("span", { class: "badge" + (user.is_active ? " badge--ok" : "") },
        t(user.is_active ? "sup.active" : "sup.inactive"))),
      h("td", { class: "sup-actions" }, h("p", { class: "role-add" },
        ...roleAdder(user),
        superadminIds.has(user.id) ? "" : h("button", {
          class: "button button--small button--ghost",
          type: "button",
          onclick: () => run("admin.set_active", { user_id: user.id, is_active: !user.is_active }),
        }, t(user.is_active ? "sup.deactivate" : "sup.activate")))),
    ));
  $("#admins-body").replaceChildren(...rows);
}

/** Naplní výbery rolí vo formulároch (zachová aktuálny výber). */
function renderRoleSelects() {
  ["#new-role", "#existing-role"].forEach((selector) => {
    const select = $(selector);
    const previous = select.value;
    select.replaceChildren(...assignableRoles().map((role) => new Option(roleName(role), role.code)));
    if (previous) select.value = previous;
    else if (selector === "#new-role") select.value = "organizer";
  });
}

function renderCategories() {
  const rows = data.categories.map((category) => {
    const fee = h("input", { type: "number", min: "0", step: "0.01", value: category.fee, "aria-label": t("sup.cat.fee") });
    const studentFee = h("input", { type: "number", min: "0", step: "0.01", value: category.student_fee ?? "", "aria-label": t("sup.cat.student") });
    return h("tr", {},
      h("td", {}, t("cat." + category.code)),
      h("td", {}, fee),
      h("td", {}, studentFee),
      h("td", {}, h("button", {
        class: "button button--small",
        type: "button",
        onclick: () => run("category.update", { category_id: category.id, fee: fee.value, student_fee: studentFee.value }),
      }, t("sup.save"))),
    );
  });
  $("#categories-body").replaceChildren(...rows);
}

/** Predvyplní formulár s nastaveniami (len po načítaní, aby sa neprepisovali rozpísané zmeny). */
function fillConference() {
  const conference = data.conference;
  const form = conferenceForm.elements;
  form.name.value = conference.name;
  form.location.value = conference.location;
  form.start_date.value = conference.start_date;
  form.end_date.value = conference.end_date;
  form.iban.value = conference.iban;
  form.accommodation_info.value = conference.accommodation_info;
  form.program_published.checked = conference.program_published;
}

function render() {
  if (!data) return;
  renderAdmins();
  renderRoleSelects();
  renderCategories();
}

async function refresh() {
  const [users, userRoles, roles, categories, conferences] = await Promise.all(
    ["users", "user_roles", "roles", "participant_categories", "conferences"].map(listTable));
  data = { users, userRoles, roles, categories, conference: conferences[0] };
  render();
  fillConference();
}

/* Formuláre
   -------------------------------------------------------------------------- */
$("#admin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const saved = await run("admin.create", {
    first_name: form.elements.firstName.value,
    last_name: form.elements.lastName.value,
    email: form.elements.email.value,
    password: form.elements.password.value,
    role: form.elements.role.value,
  });
  if (saved) form.reset();
});

$("#role-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const saved = await run("role.add", { email: form.elements.email.value, role: form.elements.role.value });
  if (saved) form.elements.email.value = "";
});

conferenceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = conferenceForm.elements;
  run("conference.update", {
    name: form.name.value,
    location: form.location.value,
    start_date: form.start_date.value,
    end_date: form.end_date.value,
    iban: form.iban.value,
    accommodation_info: form.accommodation_info.value,
    program_published: form.program_published.checked,
  });
});

onLanguageChange = render;

(async () => {
  if (!(await requireRole("superadmin"))) return;
  $("#super-main").hidden = false;
  await refresh();
})().catch(showError);
