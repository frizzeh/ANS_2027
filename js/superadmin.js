/* Super admin: administrátori, nastavenia konferencie a poplatky.
   Stránka je dostupná len pre rolu superadmin. */

const ADMIN_ROLE_ID = 2;

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
function renderAdmins() {
  const adminIds = data.userRoles.filter((item) => item.role_id === ADMIN_ROLE_ID).map((item) => item.user_id);
  const rows = data.users.filter((user) => adminIds.includes(user.id)).map((user) =>
    h("tr", {},
      h("td", {}, user.first_name + " " + user.last_name),
      h("td", {}, user.email),
      h("td", {}, h("span", { class: "badge" + (user.is_active ? " badge--ok" : "") },
        t(user.is_active ? "sup.active" : "sup.inactive"))),
      h("td", {}, h("button", {
        class: "button button--small button--ghost",
        type: "button",
        onclick: () => run("admin.set_active", { user_id: user.id, is_active: !user.is_active }),
      }, t(user.is_active ? "sup.deactivate" : "sup.activate"))),
    ));
  $("#admins-body").replaceChildren(...rows);
}

function renderCategories() {
  const rows = data.categories.map((category) => {
    const fee = h("input", { type: "number", min: "0", step: "0.01", value: category.fee, "aria-label": t("sup.cat.fee") });
    const studentFee = h("input", { type: "number", min: "0", step: "0.01", value: category.student_fee, "aria-label": t("sup.cat.student") });
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
  renderCategories();
}

async function refresh() {
  const [users, userRoles, categories, conferences] = await Promise.all(
    ["users", "user_roles", "participant_categories", "conferences"].map(listTable));
  data = { users, userRoles, categories, conference: conferences[0] };
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
  });
  if (saved) form.reset();
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
