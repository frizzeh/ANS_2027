/* Účet účastníka */

let registration = null;
let category = null;
let conference = null;
let submission = null;
let latestVersion = null;

function render() {
  if (!currentUser || !registration) return;

  $("#user-name").textContent = [currentUser.title_before, currentUser.first_name, currentUser.last_name]
    .filter(Boolean)
    .join(" ");
  $("#user-category").textContent = t("cat." + category.code);

  // Platba
  const status = registration.payment_status;
  $("#pay-status").textContent = t("pay.status." + status);
  $("#pay-status").classList.toggle("badge--ok", status === "paid");
  $("#pay-amount").textContent = registration.amount_due + " €";
  $("#pay-iban").textContent = conference.iban || t("tba");
  $("#pay-symbol").textContent = registration.variable_symbol;
  $("#pay-due").textContent = registration.due_date || t("tba");

  // Príspevok
  const hasPaper = Boolean(category.submission_type);
  $("#paper-none").hidden = hasPaper;
  $("#paper-info").hidden = !hasPaper;
  if (!hasPaper) return;

  const draftTitle = sessionStorage.getItem("ans-draft-title");
  $("#paper-title").textContent = submission ? submission.title : (draftTitle || "–");
  $("#paper-type").textContent = t("pp.type." + category.submission_type);
  $("#paper-status").textContent = t(submission ? "paper.status." + submission.status : "paper.status.draft");
  $("#paper-status").classList.toggle("badge--ok", submission?.status === "accepted");
  $("#paper-file").textContent = latestVersion
    ? `${t("paper.file")}: ${latestVersion.original_filename} (v${latestVersion.version_number})`
    : "";
  $("#paper-button").textContent = t(submission ? "paper.newversion" : "paper.go");
}

async function load() {
  if (!(await requireLogin())) return;
  if (hasRole("admin", "superadmin")) { location.replace(homePage()); return; }

  const [registrations, categories, conferences, submissions, versions] = await Promise.all([
    listTable("registrations"),
    listTable("participant_categories"),
    listTable("conferences"),
    listTable("submissions"),
    listTable("submission_versions"),
  ]);

  registration = registrations.find((item) => item.user_id === currentUser.id);
  if (!registration) return;

  category = categories.find((item) => item.id === registration.category_id);
  conference = conferences.find((item) => item.id === registration.conference_id);
  submission = submissions.find((item) => item.registration_id === registration.id) || null;
  if (submission) {
    latestVersion = versions
      .filter((item) => item.submission_id === submission.id)
      .sort((a, b) => b.version_number - a.version_number)[0] || null;
  }
  render();
}

onLanguageChange = render;
load().catch((error) => alert(errorText(error)));
