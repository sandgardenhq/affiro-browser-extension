const test = require("node:test");
const assert = require("node:assert/strict");

function fakeBrowserAPI(initialStorage = {}) {
    const storage = { ...initialStorage };
    return {
        storage: {
            local: {
                get: async (key) => ({ [key]: storage[key] }),
                set: async (values) => Object.assign(storage, values),
            },
        },
        _storage: storage,
    };
}

function loadAPIConfig(browserAPI) {
    delete require.cache[require.resolve("./api-config.js")];
    globalThis.getBrowserAPI = () => browserAPI;
    globalThis.document = {
        addEventListener: (a, b) => {}
    }
    return require("./api-config.js");
}

test("getAPIBaseURL resolves to prod when no mode has been stored", async (t) => {
    const browserAPI = fakeBrowserAPI();
    const { getAPIBaseURL, PROD_API_BASE_URL } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    assert.strictEqual(await getAPIBaseURL(), PROD_API_BASE_URL);
});

test("getAPIBaseURL resolves to local once local mode is stored", async (t) => {
    const browserAPI = fakeBrowserAPI({ apiMode: "local" });
    const { getAPIBaseURL, LOCAL_API_BASE_URL } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    assert.strictEqual(await getAPIBaseURL(), LOCAL_API_BASE_URL);
});

test("toggleAPIMode flips prod to local and persists it", async (t) => {
    const browserAPI = fakeBrowserAPI();
    const { toggleAPIMode, getAPIBaseURL, LOCAL_API_BASE_URL } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const newMode = await toggleAPIMode();

    assert.strictEqual(newMode, "local");
    assert.strictEqual(await getAPIBaseURL(), LOCAL_API_BASE_URL);
});

test("toggleAPIMode flips local back to prod and persists it", async (t) => {
    const browserAPI = fakeBrowserAPI({ apiMode: "local" });
    const { toggleAPIMode, getAPIBaseURL, PROD_API_BASE_URL } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const newMode = await toggleAPIMode();

    assert.strictEqual(newMode, "prod");
    assert.strictEqual(await getAPIBaseURL(), PROD_API_BASE_URL);
});

test("watchForModeToggleHotkey fires the callback on ctrl+shift+L", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "L", ctrlKey: true, shiftKey: true });

    assert.strictEqual(calls, 1);
});

test("watchForModeToggleHotkey fires on cmd+shift+L (Mac)", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "l", metaKey: true, shiftKey: true });

    assert.strictEqual(calls, 1);
});

test("watchForModeToggleHotkey does not fire without the shift modifier", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "l", ctrlKey: true, shiftKey: false });

    assert.strictEqual(calls, 0);
});

test("watchForModeToggleHotkey does not fire for an unrelated key", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "k", ctrlKey: true, shiftKey: true });

    assert.strictEqual(calls, 0);
});

test("watchForModeToggleHotkey ignores repeated keydown events from a held key", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "l", ctrlKey: true, shiftKey: true, repeat: true });

    assert.strictEqual(calls, 0);
});

test("watchForModeToggleHotkey does not fire when altKey is held (AltGr false positive)", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    watchForModeToggleHotkey(() => { calls++; }, fakeDocument);

    listeners.keydown({ key: "l", ctrlKey: true, shiftKey: true, altKey: true });

    assert.strictEqual(calls, 0);
});

test("watchForModeToggleHotkey's returned stop function removes the listener", (t) => {
    const browserAPI = fakeBrowserAPI();
    const { watchForModeToggleHotkey } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const listeners = {};
    const fakeDocument = {
        addEventListener: (type, handler) => { listeners[type] = handler; },
        removeEventListener: (type) => { delete listeners[type]; },
    };

    let calls = 0;
    const stop = watchForModeToggleHotkey(() => { calls++; }, fakeDocument);
    stop();

    assert.strictEqual(listeners.keydown, undefined);
});

test("getAPIMode falls back to prod for a corrupted or unexpected stored value", async (t) => {
    const browserAPI = fakeBrowserAPI({ apiMode: "LOCAL" });
    const { getAPIMode } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    assert.strictEqual(await getAPIMode(), "prod");
});

test("toggleAPIMode serializes concurrent calls instead of racing", async (t) => {
    const browserAPI = fakeBrowserAPI();
    const { toggleAPIMode, getAPIMode } = loadAPIConfig(browserAPI);
    t.after(() => delete globalThis.getBrowserAPI);

    const [first, second] = await Promise.all([toggleAPIMode(), toggleAPIMode()]);

    assert.strictEqual(first, "local");
    assert.strictEqual(second, "prod");
    assert.strictEqual(await getAPIMode(), "prod");
});
