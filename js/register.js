/* Registrácia účastníka */

const form = $("#register-form");
const categoryGroup = $("#category-group");
const studentLabel = $("#student-label");
const categoryTemplate = $("#category-template");
const paperGroup = $("#paper-group");
const paperTitle = $("#paper-title");
const summaryCategory = $("#summary-category");
const summaryFee = $("#summary-fee");
const submitButton = $("#submit-button");
const formError = $("#form-error");

let categories = [];

const selectedCategory = () => {
  const id = Number(form.elements.category?.value);
  return categories.find((item) => item.id === id);
};

/** Vytvorí voľby kategórií podľa údajov z API (zachová aktuálny výber). */
function renderCategories() {
  const previous = form.elements.category?.value;
  $$(".option", categoryGroup).forEach((el) => el.remove());

  categories.forEach((category, index) => {
    const option = categoryTemplate.content.firstElementChild.cloneNode(true);
    const input = $("input", option);
    input.value = category.id;
    input.checked = previous ? String(category.id) === previous : index === 0;

    $(".option__title", option).textContent = t("cat." + category.code);
    $(".option__text", option).textContent = t("cat." + category.code + ".d");
    $(".option__fee", option).textContent =
      `${category.fee} € · ${t("fee.student")} ${category.student_fee} €`;

    categoryGroup.insertBefore(option, studentLabel);
  });
}

/** Prekreslí súhrn a skryje pole s príspevkom pre pasívneho účastníka. */
function render() {
  const category = selectedCategory();
  if (!category) return;

  const isPassive = !category.submission_type;
  const isStudent = form.elements.isStudent.checked;

  summaryCategory.textContent = t("cat." + category.code);
  summaryFee.textContent = (isStudent ? category.student_fee : category.fee) + " €";
  paperGroup.hidden = isPassive;
  paperGroup.disabled = isPassive; // vypnuté polia sa pri odoslaní nekontrolujú
}

/** Prekreslí voľby kategórií aj súhrn (po načítaní údajov a po zmene jazyka). */
function refresh() {
  renderCategories();
  render();
}

form.addEventListener("change", render);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  submitButton.disabled = true;

  const data = new FormData(form);
  const email = data.get("email");
  const password = data.get("password");

  try {
    const user = (await api("user.create", {
      body: {
        email,
        password,
        first_name: data.get("firstName"),
        last_name: data.get("lastName"),
        title_before: data.get("titleBefore"),
        title_after: data.get("titleAfter"),
        organization: data.get("organization"),
        department: data.get("department"),
        country: data.get("country"),
        preferred_language: lang,
      },
    })).data;

    await api("auth.login", { body: { email, password } });

    await api("registration.create", {
      body: {
        user_id: user.id,
        conference_id: CONFERENCE_ID,
        category_id: Number(data.get("category")),
        is_student: data.get("isStudent") === "on",
        billing_name: data.get("billingName"),
        billing_street: data.get("billingStreet"),
        billing_city: data.get("billingCity"),
        billing_zip: data.get("billingZip"),
        billing_country: data.get("billingCountry"),
        billing_ico: data.get("billingIco"),
        billing_dic: data.get("billingDic"),
        dietary_requirements: data.get("diet"),
        gdpr_consent: true,
      },
    });

    // Názov príspevku si len zapamätáme; API prijme príspevok až s abstraktom (stránka Príspevok).
    if (data.get("paperTitle")) sessionStorage.setItem("ans-draft-title", data.get("paperTitle"));
    location.href = "ucet.html";
  } catch (error) {
    formError.textContent = errorText(error);
    formError.hidden = false;
    submitButton.disabled = false;
  }
});

onLanguageChange = refresh;

listTable("participant_categories")
  .then((rows) => {
    categories = rows;
    refresh();
  })
  .catch((error) => {
    formError.textContent = errorText(error);
    formError.hidden = false;
  });
