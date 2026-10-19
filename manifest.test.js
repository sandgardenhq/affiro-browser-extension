const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("manifest's action default_icon files exist on disk", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
    const icons = manifest.action.default_icon;

    for (const iconPath of Object.values(icons)) {
        const resolved = path.join(__dirname, iconPath.replace(/^\//, ""));
        assert.ok(fs.existsSync(resolved), `icon file does not exist: ${iconPath}`);
    }
});

test("manifest content_scripts loads api-config.js after browser-api.js and before content_script.js", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
    const scripts = manifest.content_scripts[0].js;
    const apiConfigIndex = scripts.indexOf("/api-config.js");
    const browserApiIndex = scripts.indexOf("/browser-api.js");
    const contentScriptIndex = scripts.indexOf("/content_script.js");

    assert.notStrictEqual(apiConfigIndex, -1, "api-config.js is not registered as a content script");
    assert.ok(browserApiIndex < apiConfigIndex, "browser-api.js must load before api-config.js");
    assert.ok(apiConfigIndex < contentScriptIndex, "api-config.js must load before content_script.js");
});

test("popup.html loads api-config.js after browser-api.js and before popup.js", () => {
    const html = fs.readFileSync(path.join(__dirname, "popup", "popup.html"), "utf8");
    const scriptSrcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

    const apiConfigIndex = scriptSrcs.indexOf("../api-config.js");
    const browserApiIndex = scriptSrcs.indexOf("../browser-api.js");
    const popupJsIndex = scriptSrcs.indexOf("popup.js");

    assert.notStrictEqual(apiConfigIndex, -1, "api-config.js is not loaded by popup.html");
    assert.ok(browserApiIndex < apiConfigIndex, "browser-api.js must load before api-config.js");
    assert.ok(apiConfigIndex < popupJsIndex, "api-config.js must load before popup.js");
});
