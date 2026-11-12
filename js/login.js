/* Prihlásenie */

const form = $("#login-form");
const error = $("#login-error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  const data = new FormData(form);

  try {
    const response = await api("auth.login", { body: { email: data.get("email"), password: data.get("password") } });
    currentUser = response.data;
    location.href = homePage();
  } catch (problem) {
    error.textContent = problem.status === 401 ? t("login.error") : errorText(problem);
    error.hidden = false;
  }
});
