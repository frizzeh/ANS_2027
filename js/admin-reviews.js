/* Admin: Recenzie (pridelenie recenzentov a odovzdané posudky) */

/** Používatelia s rolou reviewer. */
function reviewers() {
  const role = admin.roles.find((item) => item.code === "reviewer");
  const ids = admin.user_roles.filter((item) => item.role_id === role?.id).map((item) => item.user_id);
  return admin.users.filter((user) => ids.includes(user.id));
}

function renderAssignments() {
  const allReviewers = reviewers();

  const rows = admin.submissions.map((submission) => {
    const registration = admin.registrations.find((item) => item.id === submission.registration_id);
    const assigned = admin.review_assignments.filter((item) => item.submission_id === submission.id);
    const assignedIds = assigned.map((item) => item.reviewer_id);

    const names = assigned.map((assignment) =>
      h("li", {}, `${fullName(userById(assignment.reviewer_id))} (${t("rev.status." + assignment.status)})`));

    const select = h("select", { "aria-label": t("rev.choose") },
      new Option(t("rev.choose"), ""),
      ...allReviewers.filter((user) => !assignedIds.includes(user.id)).map((user) => new Option(fullName(user), user.id)));
    const button = h("button", {
      class: "button button--small", type: "button",
      onclick: () => select.value && act("review.assign", { submission_id: submission.id, reviewer_id: Number(select.value) }),
    }, t("rev.assign"));

    return h("tr", {},
      h("td", {}, submission.title),
      h("td", { class: "muted" }, fullName(userById(registration?.user_id))),
      h("td", {}, paperBadge(submission)),
      h("td", {}, h("ul", { class: "reviewer-list" }, names)),
      h("td", { class: "assign" }, h("p", { class: "assign__row" }, select, button)));
  });

  $("#assign-body").replaceChildren(...rows);
  $("#no-reviewers").hidden = allReviewers.length > 0;
}

function renderReviews() {
  const cards = admin.reviews.map((review) => {
    const assignment = admin.review_assignments.find((item) => item.id === review.assignment_id);
    const submission = admin.submissions.find((item) => item.id === assignment?.submission_id);
    return h("article", { class: "review-card" },
      h("p", {},
        h("strong", {}, submission?.title ?? "–"), " ",
        badge(t("rec." + review.recommendation), "badge--info"), " ",
        h("span", { class: "muted" }, `${fullName(userById(assignment?.reviewer_id))}, ${t("rev.score")}: ${review.score ?? "–"}`)),
      h("p", {}, h("strong", {}, t("rev.comment.author") + ": "), review.comment_for_author || "–"),
      h("p", {}, h("strong", {}, t("rev.comment.committee") + ": "), review.comment_for_committee || "–"));
  });
  $("#reviews-list").replaceChildren(...cards);
  $("#reviews-empty").hidden = cards.length > 0;
}

function render() {
  renderAssignments();
  renderReviews();
}

startAdminPage(["users", "registrations", "submissions", "user_roles", "review_assignments", "reviews"], render);
