/* ==========================================================================
   Rozcestník ukážok (demo.html): zapne demo režim a prihlási ukážkový účet
   ========================================================================== */

$$("[data-demo-login]").forEach((button) => {
  button.addEventListener("click", async () => {
    await enableDemo();
    demoLoginAs(button.dataset.demoLogin);
    location.href = button.dataset.demoTarget;
  });
});

$("#demo-reset").addEventListener("click", async () => {
  await enableDemo();
  demoReset();
  location.reload();
});
