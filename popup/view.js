function setView(view) {
    state.view = view;

    els.rail.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));

    const isHome = view === "home";
    const isQr = view === "qr";
    const isPlaceholder = view in PLACEHOLDER_VIEWS;

    els.subheader.hidden = !isPlaceholder;
    els.signaturePanel.hidden = !(isHome || isQr);
    els.qrBlock.hidden = !isQr;
    els.placeholderPanel.hidden = !isPlaceholder;

    if (isPlaceholder) {
        const config = PLACEHOLDER_VIEWS[view];
        els.subheaderTitle.textContent = config.title;
        els.placeholderText.textContent = config.text;
    }

    if (isHome || isQr) {
        renderSignature();
    }

    if (isQr) {
        drawQR();
    }
}
