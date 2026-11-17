/* Recenzent: pridelené príspevky a odoslanie posudku
   Recenzent vidí len príspevky, ktoré mu pridelil organizátor (server vracia iba tie), a bez mien autorov. */

const data = {};
let editing = null; // pridelenie, ktorého posudok sa práve vypĺňa

const errorBox = $("#error");
const notice = $("#notice");
const dialog = $("#review-dialog");
const form = $("#review-form");
const dialogError = $("#review-error");

const badge = (text, modifier = "") => h("span", { class: ("badge " + modifier).trim() }, text);
const isPdf = (version) => /\.pdf$/i.test(version.original_filename || "");

/** Moje pridelenia (zrušené sa nezobrazujú). */
const myAssignments = () =>
  data.review_assignments.filter((item) => item.reviewer_id === currentUser.id && item.status !== "cancelled");

const reviewOf = (assignment) => data.reviews.find((item) => item.assignment_id === assignment.id);

/** Posudok sa dá odoslať alebo upraviť, kým je príspevok v recenznom konaní. */
const isOpen = (submission) => submission.status === "in_review";

function showError(error) {
  notice.hidden = true;
  errorBox.textContent = errorText(error);
  errorBox.hidden = false;
}

async function load() {
  const names = ["review_assignments", "submissions", "submission_versions", "reviews", "symposia"];
  const rows = await Promise.all(names.map(listTable));
  names.forEach((name, index) => { data[name] = rows[index]; });
}


/* Vykreslenie
   -------------------------------------------------------------------------- */
function renderPaper(assignment) {
  const submission = data.submissions.find((item) => item.id === assignment.submission_id);
  if (!submission) return null;
  const review = reviewOf(assignment);
  const symposium = data.symposia.find((item) => item.id === submission.symposium_id);
  const versions = data.submission_versions
    .filter((item) => item.submission_id === submission.id)
    .sort((a, b) => b.version_number - a.version_number);

  const files = versions.map((version) =>
    h("li", {},
      `v${version.version_number} – ${version.original_filename} `,
      h("a", { href: apiLink("download", { id: version.id }) }, t("file.download")),
      isPdf(version) ? " · " : "",
      isPdf(version) ? h("a", { href: apiLink("download", { id: version.id, inline: 1 }), target: "_blank", rel: "noopener" }, t("file.preview")) : ""));

  const button = isOpen(submission)
    ? h("button", { class: "button button--small", type: "button", onclick: () => openForm(assignment, submission) },
        t(review ? "rv.edit" : "rv.write"))
    : h("span", { class: "muted" }, t("rv.locked"));

  return h("article", { class: "paper" },
    h("header", { class: "paper__head" },
      h("h2", {}, submission.title),
      review ? badge(t("rv.status.done"), "badge--ok") : badge(t("rv.status.todo"), "")),
    h("ul", { class: "paper__meta muted" },
      h("li", {}, `${t("pp.type")}: ${t("pp.type." + submission.type)}`),
      symposium ? h("li", {}, lang === "sk" ? symposium.name_sk : symposium.name_en) : "",
      assignment.due_date ? h("li", {}, `${t("rv.due")}: ${formatDate(assignment.due_date)}`) : ""),
    submission.keywords ? h("p", { class: "muted" }, `${t("rv.keywords")}: ${submission.keywords}`) : "",
    h("p", {}, h("strong", {}, t("rv.abstract") + ": "), submission.abstract),
    h("ul", { class: "paper__files" }, files),
    review
      ? h("p", { class: "paper__mine" },
          h("strong", {}, t("rv.mine") + ": "),
          `${t("rec." + review.recommendation)}, ${t("rv.score.short")}: ${review.score}`)
      : "",
    h("p", { class: "actions" }, button));
}

function render() {
  const assignments = myAssignments();
  const done = assignments.filter((item) => reviewOf(item)).length;
  $("#stat-assigned").textContent = assignments.length;
  $("#stat-done").textContent = done;
  $("#stat-todo").textContent = assignments.length - done;

  $("#papers").replaceChildren(...assignments.map(renderPaper).filter(Boolean));
  $("#papers-empty").hidden = assignments.length > 0;
}


/* Formulár posudku
   -------------------------------------------------------------------------- */
function openForm(assignment, submission) {
  const review = reviewOf(assignment);
  editing = assignment;
  dialogError.hidden = true;
  $("#review-paper").textContent = submission.title;
  $("#review-score").replaceChildren(
    new Option("–", ""),
    ...Array.from({ length: 10 }, (_, index) => new Option(index + 1, index + 1)));
  $("#review-score").value = review ? review.score : "";
  form.elements.recommendation.value = review ? review.recommendation : "";
  $("#review-author").value = review?.comment_for_author ?? "";
  $("#review-committee").value = review?.comment_for_committee ?? "";
  dialog.showModal();
}

$("#review-close").addEventListener("click", () => dialog.close());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  dialogError.hidden = true;
  try {
    await api("review.submit", {
      body: {
        assignment_id: editing.id,
        score: Number($("#review-score").value),
        recommendation: form.elements.recommendation.value,
        comment_for_author: $("#review-author").value,
        comment_for_committee: $("#review-committee").value,
      },
    });
    dialog.close();
    await load();
    render();
    errorBox.hidden = true;
    notice.hidden = false;
  } catch (error) {
    dialogError.textContent = errorText(error);
    dialogError.hidden = false;
  }
});


/* Spustenie
   -------------------------------------------------------------------------- */
(async () => {
  try {
    if (!(await requireRole("reviewer"))) return;
    $("#reviewer-main").hidden = false;
    await load();
    onLanguageChange = render;
    render();
  } catch (error) {
    showError(error);
  }
})();
