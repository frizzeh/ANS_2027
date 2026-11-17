/* Registrácia: prehľad registrácie a úprava fakturačných údajov */

const form = $("#billing-form");
let formFilled = false;

const yesNo = (value) => t(value ? "common.yes" : "common.no");

/** Fakturačné údaje sa do formulára vložia len raz, aby sa neprepísali rozpísané zmeny. */
function fillForm() {
  const r = account.registration;
  const fields = form.elements;
  fields.billingName.value = r.billing_name ?? "";
  fields.billingStreet.value = r.billing_street ?? "";
  fields.billingCity.value = r.billing_city ?? "";
  fields.billingZip.value = r.billing_zip ?? "";
  fields.billingCountry.value = r.billing_country ?? "";
  fields.billingIco.value = r.billing_ico ?? "";
  fields.billingDic.value = r.billing_dic ?? "";
  fields.billingIcDph.value = r.billing_ic_dph ?? "";
  fields.diet.value = r.dietary_requirements ?? "";
}

function render() {
  const { registration, category } = account;

  $("#r-category").textContent = t("cat." + category.code);
  $("#r-student").textContent = yesNo(registration.is_student);
  $("#r-amount").textContent = registration.amount_due + " €";
  $("#r-exempt").textContent = yesNo(registration.fee_exempt);
  $("#r-symbol").textContent = registration.variable_symbol;
  $("#r-created").textContent = formatDate(registration.created_at);
  $("#r-gdpr").textContent = formatDate(registration.gdpr_consent_at);

  $("#p-name").textContent = [currentUser.title_before, currentUser.first_name, currentUser.last_name, currentUser.title_after]
    .filter(Boolean).join(" ");
  $("#p-email").textContent = currentUser.email;
  $("#p-org").textContent = currentUser.organization || "–";
  $("#p-dept").textContent = currentUser.department || "–";
  $("#p-country").textContent = currentUser.country || "–";

  if (!formFilled) {
    fillForm();
    formFilled = true;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  try {
    const response = await api("registration.update", {
      body: {
        registration_id: account.registration.id,
        billing_name: data.get("billingName"),
        billing_street: data.get("billingStreet"),
        billing_city: data.get("billingCity"),
        billing_zip: data.get("billingZip"),
        billing_country: data.get("billingCountry"),
        billing_ico: data.get("billingIco"),
        billing_dic: data.get("billingDic"),
        billing_ic_dph: data.get("billingIcDph"),
        dietary_requirements: data.get("diet"),
      },
    });
    account.registration = response.data;
    showNotice();
  } catch (error) {
    showError(error);
  }
});

startAccountPage(render);
