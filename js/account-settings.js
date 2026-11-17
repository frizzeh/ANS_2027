/* Nastavenia: osobné údaje, jazyk a zmena hesla */

const profileForm = $("#profile-form");
const passwordForm = $("#password-form");

/** Predvyplní formulár údajmi z účtu. */
function fillProfile() {
  const fields = profileForm.elements;
  fields.titleBefore.value = currentUser.title_before ?? "";
  fields.titleAfter.value = currentUser.title_after ?? "";
  fields.firstName.value = currentUser.first_name;
  fields.lastName.value = currentUser.last_name;
  fields.email.value = currentUser.email;
  fields.organization.value = currentUser.organization ?? "";
  fields.organizationAddress.value = currentUser.organization_address ?? "";
  fields.department.value = currentUser.department ?? "";
  fields.country.value = currentUser.country ?? "";
  fields.language.value = currentUser.preferred_language;
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  try {
    const response = await api("user.update", {
      body: {
        email: data.get("email"),
        title_before: data.get("titleBefore"),
        title_after: data.get("titleAfter"),
        first_name: data.get("firstName"),
        last_name: data.get("lastName"),
        organization: data.get("organization"),
        organization_address: data.get("organizationAddress"),
        department: data.get("department"),
        country: data.get("country"),
        preferred_language: data.get("language"),
      },
    });
    currentUser = response.data;
    if (currentUser.preferred_language !== lang) setLanguage(currentUser.preferred_language);
    showNotice();
  } catch (error) {
    showError(error);
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(passwordForm);
  try {
    await api("password.change", {
      body: { current_password: data.get("currentPassword"), new_password: data.get("newPassword") },
    });
    passwordForm.reset();
    showNotice();
  } catch (error) {
    showError(error);
  }
});

startAccountPage(() => {});
// Formulár sa predvyplní po načítaní účtu (startAccountPage počká na prihlásenie).
ready.then(() => { if (currentUser) fillProfile(); });
