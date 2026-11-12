/* Úvodná stránka: poplatky sa načítajú z API */

let categories = [];

/** Vypíše poplatok do kariet. Ak API nie je dostupné, ostane [doplniť]. */
function showFees() {
  $$("[data-fee]").forEach((el) => {
    const category = categories.find((item) => item.code === el.dataset.fee);
    if (category) el.textContent = category.fee + " €";
  });
}

onLanguageChange = showFees;

listTable("participant_categories")
  .then((rows) => {
    categories = rows;
    showFees();
  })
  .catch(() => {});
