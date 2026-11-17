/* Príspevky: stav, verzie súboru, odoslanie príspevku a pripomienky recenzentov */

const form = $("#paper-form");
const paperFields = $("#paper-fields");
const topicField = $("#topic-field");
const topicSelect = $("#topic-select");
const submitButton = $("#submit-button");
let formFilled = false;

/** Zoznam tematických oblastí (zachová výber pri zmene jazyka). */
function renderTopics() {
  const selected = topicSelect.value;
  const options = account.symposia.map((symposium) =>
    new Option(lang === "sk" ? symposium.name_sk : symposium.name_en, symposium.id));
  topicSelect.replaceChildren(new Option(t("pp.topic.ph"), ""), ...options);
  topicSelect.value = selected;

  topicField.hidden = account.symposia.length === 0;
  topicSelect.required = account.symposia.length > 0 && !account.submission;
}

const isPdf = (version) => /\.pdf$/i.test(version.original_filename || "");

function renderVersions() {
  const rows = account.versions.map((version) =>
    h("tr", {},
      h("td", {}, "v" + version.version_number),
      h("td", {}, version.original_filename),
      h("td", {}, formatDate(version.uploaded_at)),
      h("td", { class: "actions" },
        h("a", { href: apiLink("download", { id: version.id }) }, t("file.download")),
        isPdf(version) ? h("a", { href: apiLink("download", { id: version.id, inline: 1 }), target: "_blank", rel: "noopener" }, t("file.preview")) : "")));
  $("#versions-body").replaceChildren(...rows);
}

function renderReviews() {
  const items = account.reviews.length
    ? account.reviews.map((review, index) =>
        h("li", { class: "review" },
          h("p", { class: "review__head" },
            h("strong", {}, `${t("papers.reviewer")} ${index + 1}`),
            h("span", { class: "badge badge--info" }, t("rec." + review.recommendation)),
            h("span", { class: "muted" }, formatDate(review.submitted_at))),
          h("p", {}, review.comment_for_author || "–")))
    : [h("li", { class: "muted" }, t("papers.reviews.none"))];
  $("#reviews-list").replaceChildren(...items);
}

function render() {
  const { category, submission } = account;
  renderPaperCard();

  const canSubmit = Boolean(category.submission_type);
  $("#upload").hidden = !canSubmit;
  $("#versions-card").hidden = !submission;
  $("#reviews").hidden = !submission;
  if (!canSubmit) return;

  $("#upload-title").textContent = t(submission ? "paper.newversion" : "pp.title");
  $("#paper-existing").hidden = !submission;
  paperFields.hidden = Boolean(submission);
  paperFields.disabled = Boolean(submission); // vypnuté polia sa pri odoslaní nekontrolujú

  renderTopics();
  renderVersions();
  renderReviews();

  if (!formFilled && !submission) {
    form.elements.paperTitle.value = sessionStorage.getItem("ans-draft-title") || "";
    formFilled = true;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  const data = new FormData(form);
  const file = data.get("file");

  try {
    let submission = account.submission;
    if (!submission) {
      submission = (await api("submission.create", {
        body: {
          registration_id: account.registration.id,
          conference_id: CONFERENCE_ID,
          type: account.category.submission_type,
          symposium_id: data.get("topic") ? Number(data.get("topic")) : undefined,
          title: data.get("paperTitle"),
          abstract: data.get("abstract"),
          keywords: data.get("keywords"),
        },
      })).data;
    }

    // Súbor sa posiela ako multipart; server skontroluje typ (PDF/DOCX), veľkosť a obsah.
    const upload = new FormData();
    upload.set("submission_id", submission.id);
    upload.set("file", file);
    await api("submission.version", { body: upload });

    sessionStorage.removeItem("ans-draft-title");
    location.href = "ucet-prispevky.html";
  } catch (error) {
    showError(error);
    submitButton.disabled = false;
  }
});

startAccountPage(render);
