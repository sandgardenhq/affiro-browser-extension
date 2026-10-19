const test = require("node:test");
const assert = require("node:assert/strict");

test("getBrowserAPI returns the global browser object when it is defined", (t) => {
    const fakeBrowser = { runtime: {} };
    globalThis.browser = fakeBrowser;
    globalThis.chrome = { runtime: {} };
    t.after(() => {
        delete globalThis.browser;
        delete globalThis.chrome;
    });

    delete require.cache[require.resolve("./browser-api.js")];
    const { getBrowserAPI } = require("./browser-api.js");

    assert.strictEqual(getBrowserAPI(), fakeBrowser);
});

test("getBrowserAPI returns the global chrome object when browser is undefined", (t) => {
    const fakeChrome = { runtime: {} };
    delete globalThis.browser;
    globalThis.chrome = fakeChrome;
    t.after(() => {
        delete globalThis.chrome;
    });

    delete require.cache[require.resolve("./browser-api.js")];
    const { getBrowserAPI } = require("./browser-api.js");

    assert.strictEqual(getBrowserAPI(), fakeChrome);
});

test("getBrowserAPI throws a clear error when neither browser nor chrome is defined", (t) => {
    delete globalThis.browser;
    delete globalThis.chrome;

    delete require.cache[require.resolve("./browser-api.js")];
    const { getBrowserAPI } = require("./browser-api.js");

    assert.throws(() => getBrowserAPI(), /no WebExtension API/);
});
