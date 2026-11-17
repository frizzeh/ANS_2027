/* Úvodná stránka: poplatky a termíny sa načítajú z API */

let categories = [];
let deadlines = [];
let conference = null;

/** Vypíše poplatky a termíny. Ak API nie je dostupné, ostane [doplniť]. */
function showData() {
  $$("[data-fee]").forEach((el) => {
    const category = categories.find((item) => item.code === el.dataset.fee);
    if (category) el.textContent = category.fee + " €";
  });
  showDeadlines(deadlines, conference);
}

onLanguageChange = showData;

Promise.all([listTable("participant_categories"), listTable("deadlines"), listTable("conferences")])
  .then(([categoryRows, deadlineRows, conferenceRows]) => {
    categories = categoryRows;
    deadlines = deadlineRows;
    conference = conferenceRows[0] || null;
    showData();
  })
  .catch(() => {});
