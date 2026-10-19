els.themeToggle.addEventListener("click", toggleTheme);
els.backBtn.addEventListener("click", () => setView("home"));
els.rail.forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));

els.copyBtn.addEventListener("click", () => {
    if (!state.sig) return;
    navigator.clipboard.writeText(state.sig);
    showToast("Signature copied");
});

els.refreshBtn.addEventListener("click", () => {
    resetSignature().then(() => {
        if (!state.sigUnavailable) showToast("Signature refreshed");
    });
});

els.loginBtn.addEventListener("click", loginClick);

els.version.textContent = `v${browserAPI.runtime.getManifest().version}`;

watchForModeToggleHotkey(() => {
    toggleAPIMode().then((mode) => {
        showToast(mode === "local" ? "Switched to local API" : "Switched to prod API");
    });
});

initTheme();
initAuthenticated();
initWatchAuthClaim();
setView("home");
fetchSignature();
