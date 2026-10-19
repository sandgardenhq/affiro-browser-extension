/**
 * Sets the `textContent` of the specified element `el` to the given `text`
 * and truncates the text from the front with an ellipsis ("…") if it exceeds
 * the width of the element's visible content area.
 *
 * @param {HTMLElement} el - The HTML element whose text will be set and truncated if necessary.
 * @param {string} text - The full text to be displayed or truncated within the element.
 * @return {void} - This function does not return a value.
 */
function setSigTextTruncatingFront(el, text) {
    el.title = text;
    el.textContent = text;
    if (el.scrollWidth <= el.clientWidth) return;

    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        el.textContent = `…${text.slice(text.length - mid)}`;
        if (el.scrollWidth <= el.clientWidth) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    el.textContent = `…${text.slice(text.length - lo)}`;
}

function renderSignature() {
    if (state.sigUnavailable) {
        els.sigText.textContent = "Unavailable on this page";
        els.liveBadge.hidden = true;
        els.sigMeta.textContent = "Signature capture didn't respond. The page may block extension scripts.";
        els.copyBtn.disabled = true;
        return;
    }

    if (!state.sig) {
        els.sigText.textContent = "Loading…";
        els.liveBadge.hidden = true;
        els.sigMeta.textContent = "";
        els.copyBtn.disabled = true;
        return;
    }

    els.liveBadge.hidden = false;
    setSigTextTruncatingFront(els.sigText, state.sig);
    els.sigMeta.textContent = `${state.sig.length} chars · keystroke-derived`;
    els.copyBtn.disabled = false;
}

function onSignatureError(error) {
    console.error(`Error: ${error}`);
    state.sig = null;
    state.sigUnavailable = true;
    renderSignature();
    if (state.view === "qr") drawQR();
}

function fetchSignature(message = {}) {
    return browserAPI.tabs
        .query({currentWindow: true, active: true})
        .then((tabs) => {
            const tab = tabs[0];
            if (!tab) return Promise.reject(new Error("no active tab"));
            return browserAPI.tabs.sendMessage(tab.id, message);
        })
        .then(({signature}) => {
            state.sig = signature;
            state.sigUnavailable = !signature;
            renderSignature();
            if (state.view === "qr") drawQR();
        })
        .catch(onSignatureError);
}

function resetSignature() {
    return fetchSignature({action: "reset"});
}
