function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function initTheme() {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const fallback = prefersDark ? "dark" : "light";

    browserAPI.storage.local.get("theme").then((result) => {
        applyTheme(result.theme === "dark" || result.theme === "light" ? result.theme : fallback);
    }).catch(() => applyTheme(fallback));
}

function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    browserAPI.storage.local.set({theme: next}).catch(() => {
    });
}
