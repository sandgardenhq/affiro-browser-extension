let toastTimer = null;

function showToast(message) {
    clearTimeout(toastTimer);
    els.toastText.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => {
        els.toast.hidden = true;
    }, 1700);
}
