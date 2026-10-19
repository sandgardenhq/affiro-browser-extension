function drawQR() {
    if (!state.sig) {
        els.qrCanvas.getContext("2d").clearRect(0, 0, els.qrCanvas.width, els.qrCanvas.height);
        els.qrCaption.textContent = "No signature available to encode.";
        return;
    }

    els.qrCaption.textContent = "Scan to import this signature on another device.";

    const qr = qrcode(0, "M");
    qr.addData(state.sig);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const quiet = 2;
    const targetCss = 172;
    const cellSize = Math.max(2, Math.floor(targetCss / (moduleCount + quiet * 2)));
    const cssSize = (moduleCount + quiet * 2) * cellSize;
    const dpr = window.devicePixelRatio || 1;

    els.qrCanvas.width = cssSize * dpr;
    els.qrCanvas.height = cssSize * dpr;
    els.qrCanvas.style.width = `${cssSize}px`;
    els.qrCanvas.style.height = `${cssSize}px`;

    const ctx = els.qrCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssSize, cssSize);
    ctx.translate(quiet * cellSize, quiet * cellSize);
    qr.renderTo2dContext(ctx, cellSize);
}
