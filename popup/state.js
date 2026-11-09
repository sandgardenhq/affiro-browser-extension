const browserAPI = getBrowserAPI();

const state = {
    view: "home",
    sig: null,
    sigUnavailable: false,
};

const els = {
    version: document.getElementById("version"),
    themeToggle: document.getElementById("theme-toggle"),
    subheader: document.getElementById("subheader"),
    subheaderTitle: document.getElementById("subheader-title"),
    backBtn: document.getElementById("back-btn"),
    signaturePanel: document.getElementById("signature-panel"),
    sigText: document.getElementById("sig-text"),
    liveBadge: document.getElementById("live-badge"),
    sigMeta: document.getElementById("sig-meta"),
    copyBtn: document.getElementById("copy-btn"),
    refreshBtn: document.getElementById("refresh-btn"),
    loginBtn: document.getElementById("login-btn"),
    qrBlock: document.getElementById("qr-block"),
    qrCanvas: document.getElementById("qr-canvas"),
    qrCaption: document.getElementById("qr-caption"),
    rail: document.querySelectorAll(".rail-btn"),
    toast: document.getElementById("toast"),
    toastText: document.getElementById("toast-text"),
};
