function getBrowserAPI() {
    if (typeof browser !== "undefined") {
        return browser;
    }
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    throw new Error("no WebExtension API found: neither `browser` nor `chrome` is defined");
}

if (typeof module !== "undefined") {
    module.exports = { getBrowserAPI };
}
