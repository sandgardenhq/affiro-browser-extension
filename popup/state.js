const browserAPI = getBrowserAPI();

const PLACEHOLDER_VIEWS = {
    history: {
        title: "Signature History",
        text: "Coming soon! This extension doesn't store signature history yet.",
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    },
    verify: {
        title: "Verify Document",
        text: "Coming soon! Document verification isn't available in the extension yet.",
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 12l3 3 5-6"/></svg>',
    },
    settings: {
        title: "Settings",
        text: "Coming soon! There's nothing to configure here yet.",
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    },
};

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
    placeholderPanel: document.getElementById("placeholder-panel"),
    placeholderIcon: document.getElementById("placeholder-icon"),
    placeholderText: document.getElementById("placeholder-text"),
    rail: document.querySelectorAll(".rail-btn"),
    toast: document.getElementById("toast"),
    toastText: document.getElementById("toast-text"),
};
