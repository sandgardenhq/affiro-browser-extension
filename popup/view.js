function setView(view) {
    state.view = view;

    els.rail.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));

    const isHome = view === "home";
    const isQr = view === "qr";

    els.signaturePanel.hidden = !(isHome || isQr);
    els.qrBlock.hidden = !isQr;

    if (isHome || isQr) {
        renderSignature();
    }

    if (isQr) {
        drawQR();
    }
}
