/* Prihlásenie príspevku a nahratie novej verzie */

const form = $("#paper-form");
const paperFields = $("#paper-fields");
const existingNote = $("#paper-existing");
const typeLine = $("#paper-type");
const topicField = $("#topic-field");
const topicSelect = $("#topic-select");
const submitButton = $("#submit-button");
const formError = $("#form-error");

let registration = null;
let category = null;
let submission = null;

function render() {
  if (!category) return;
  typeLine.textContent = `${t("pp.type")}: ${t("pp.type." + category.submission_type)}`;
  existingNote.hidden = !submission;
}

async function load() {
  if (!(await requireLogin())) return;

  const [registrations, categories, submissions, symposia] = await Promise.all([
    listTable("registrations"),
    listTable("participant_categories"),
    listTable("submissions"),
    listTable("symposia"),
  ]);

  registration = registrations.find((item) => item.user_id === currentUser.id);
  category = registration && categories.find((item) => item.id === registration.category_id);

  // Pasívny účastník príspevok nepodáva.
  if (!category || !category.submission_type) {
    location.replace("ucet.html");
    return;
  }

  submission = submissions.find((item) => item.registration_id === registration.id) || null;

  // Tematické oblasti: ak ich organizátor ešte nezadal, pole sa nezobrazí.
  symposia.forEach((symposium) => {
    const option = new Option(symposium.name_sk || symposium.name || "#" + symposium.id, symposium.id);
    topicSelect.append(option);
  });
  topicField.hidden = symposia.length === 0;
  topicSelect.required = symposia.length > 0;

  if (submission) {
    // Príspevok už existuje: API dovoľuje len nahrať novú verziu súboru.
    paperFields.hidden = true;
    paperFields.disabled = true;
  } else {
    form.elements.paperTitle.value = sessionStorage.getItem("ans-draft-title") || "";
  }
  render();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  submitButton.disabled = true;

  const data = new FormData(form);
  const file = data.get("file");

  try {
    let target = submission;
    if (!target) {
      target = (await api("submission.create", {
        body: {
          registration_id: registration.id,
          conference_id: CONFERENCE_ID,
          type: category.submission_type,
          symposium_id: data.get("topic") ? Number(data.get("topic")) : undefined,
          title: data.get("paperTitle"),
          abstract: data.get("abstract"),
          keywords: data.get("keywords"),
        },
      })).data;
    }

    // Prototyp API ukladá len metadáta súboru (názov, typ, veľkosť), nie jeho obsah.
    await api("submission.version", {
      body: {
        submission_id: target.id,
        uploaded_by: currentUser.id,
        original_filename: file.name,
        mime_type: file.type || "application/pdf",
        file_size: file.size,
      },
    });

    sessionStorage.removeItem("ans-draft-title");
    location.href = "ucet.html";
  } catch (error) {
    formError.textContent = errorText(error);
    formError.hidden = false;
    submitButton.disabled = false;
  }
});

onLanguageChange = render;
load().catch((error) => {
  formError.textContent = errorText(error);
  formError.hidden = false;
});
