/* Admin: Nastavenia (osobné údaje, jazyk, heslo) */

const profileForm = $("#profile-form");
const passwordForm = $("#password-form");
let filled = false;

/** Formulár sa predvyplní len raz, aby sa neprepísali rozpísané zmeny. */
function fillProfile() {
  const fields = profileForm.elements;
  fields.titleBefore.value = currentUser.title_before ?? "";
  fields.titleAfter.value = currentUser.title_after ?? "";
  fields.firstName.value = currentUser.first_name;
  fields.lastName.value = currentUser.last_name;
  fields.email.value = currentUser.email;
  fields.organization.value = currentUser.organization ?? "";
  fields.department.value = currentUser.department ?? "";
  fields.language.value = currentUser.preferred_language;
}

function render() {
  if (filled) return;
  fillProfile();
  filled = true;
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  try {
    const response = await api("user.update", {
      body: {
        email: data.get("email"),
        // údaje, ktoré tento formulár nemá, sa nesmú prepísať prázdnou hodnotou
        organization_address: currentUser.organization_address,
        country: currentUser.country,
        title_before: data.get("titleBefore"),
        title_after: data.get("titleAfter"),
        first_name: data.get("firstName"),
        last_name: data.get("lastName"),
        organization: data.get("organization"),
        department: data.get("department"),
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
    await api("password.change", { body: { current_password: data.get("currentPassword"), new_password: data.get("newPassword") } });
    passwordForm.reset();
    showNotice();
  } catch (error) {
    showError(error);
  }
});

startAdminPage([], render);
