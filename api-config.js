const PROD_API_BASE_URL = "https://app.affiro.com";
const LOCAL_API_BASE_URL = "http://127.0.0.1:10380";

const API_MODE_STORAGE_KEY = "apiMode";

async function getAPIMode() {
    const browserAPI = getBrowserAPI();
    const result = await browserAPI.storage.local.get(API_MODE_STORAGE_KEY);
    return result[API_MODE_STORAGE_KEY] === "local" ? "local" : "prod";
}

async function getAPIBaseURL() {
    const mode = await getAPIMode();
    return mode === "local" ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
}

async function doToggleAPIMode() {
    const browserAPI = getBrowserAPI();
    const current = await getAPIMode();
    const next = current === "local" ? "prod" : "local";
    await browserAPI.storage.local.set({ [API_MODE_STORAGE_KEY]: next });
    return next;
}

// pendingToggle chains toggleAPIMode calls so concurrent callers (e.g. a held hotkey) each see
// the prior call's completed result instead of racing on the same read-then-write.
let pendingToggle = Promise.resolve();

// toggleAPIMode flips between "prod" and "local", persists the new mode, and returns it.
function toggleAPIMode() {
    const result = pendingToggle.then(doToggleAPIMode, doToggleAPIMode);
    pendingToggle = result.catch(() => {});
    return result;
}

// watchForModeToggleHotkey listens on `target` (defaults to the page document) for
// ctrl+shift+L (cmd+shift+L on Mac) and calls onTriggered when it's pressed. Returns a function
// that stops listening.
function watchForModeToggleHotkey(onTriggered, target = document) {
    const handler = (event) => {
        if (event.repeat || event.altKey) {
            return;
        }
        if (event.shiftKey && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
            onTriggered();
        }
    };
    target.addEventListener("keydown", handler);
    return () => target.removeEventListener("keydown", handler);
}

if (typeof module !== "undefined") {
    module.exports = {
        PROD_API_BASE_URL,
        LOCAL_API_BASE_URL,
        getAPIMode,
        getAPIBaseURL,
        toggleAPIMode,
        watchForModeToggleHotkey,
    };
}
