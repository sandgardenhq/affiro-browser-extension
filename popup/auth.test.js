const test = require("node:test");
const assert = require("node:assert/strict");

function fakeDocument(authenticated) {
    return {
        documentElement: {
            _authenticated: authenticated,
            getAttribute(name) {
                return name === "authenticated" ? this._authenticated : null;
            },
            setAttribute(name, value) {
                if (name === "authenticated") this._authenticated = value;
            },
        },
    };
}

function loadAuth({
    authenticated = "false",
    getAPIBaseURL,
    tabsCreateCalls = [],
    storageSetCalls = [],
    storageRemoveCalls = [],
    storedAuthToken,
} = {}) {
    delete require.cache[require.resolve("./auth.js")];
    globalThis.document = fakeDocument(authenticated);
    globalThis.els = { loginBtn: {setAttribute: (a,b) => {}}}
    globalThis.getAPIBaseURL = getAPIBaseURL;
    globalThis.browserAPI = {
        tabs: {
            create: (opts) => tabsCreateCalls.push(opts),
        },
        storage: {
            local: {
                get: async (key) => (key === "authToken" ? { authToken: storedAuthToken } : {}),
                set: (values) => storageSetCalls.push(values),
                remove: (key) => storageRemoveCalls.push(key),
            },
        },
    };
    return require("./auth.js");
}

test("loginClick revokes the stored token, then removes it locally, when already authenticated", async (t) => {
    const tabsCreateCalls = [];
    const storageRemoveCalls = [];
    const fetchCalls = [];
    globalThis.fetch = async (url, opts) => {
        fetchCalls.push({ url, opts });
        return { status: 200 };
    };
    const { loginClick } = loadAuth({
        authenticated: "true",
        getAPIBaseURL: async () => "https://example.test",
        tabsCreateCalls,
        storageRemoveCalls,
        storedAuthToken: "crd-1.secret",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await loginClick();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "false");
    assert.strictEqual(tabsCreateCalls.length, 0);
    assert.strictEqual(fetchCalls.length, 1);
    assert.strictEqual(fetchCalls[0].url, "https://example.test/api/v1/auth/logout");
    assert.strictEqual(fetchCalls[0].opts.method, "POST");
    assert.strictEqual(fetchCalls[0].opts.headers.Authorization, "Bearer crd-1.secret");
    assert.deepStrictEqual(storageRemoveCalls, ["authToken"]);
});

test("loginClick still signs out locally when revoking the token fails (offline)", async (t) => {
    const tabsCreateCalls = [];
    const storageRemoveCalls = [];
    globalThis.fetch = async () => { throw new Error("network unavailable"); };
    const { loginClick } = loadAuth({
        authenticated: "true",
        getAPIBaseURL: async () => "https://example.test",
        tabsCreateCalls,
        storageRemoveCalls,
        storedAuthToken: "crd-1.secret",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await loginClick();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "false");
    assert.deepStrictEqual(storageRemoveCalls, ["authToken"]);
});

test("loginClick signs out locally without a network call when there is no stored token", async (t) => {
    const tabsCreateCalls = [];
    const storageRemoveCalls = [];
    const fetchCalls = [];
    globalThis.fetch = async (url, opts) => { fetchCalls.push({ url, opts }); return { status: 200 }; };
    const { loginClick } = loadAuth({
        authenticated: "true",
        getAPIBaseURL: async () => { throw new Error("should not be called without a stored token"); },
        tabsCreateCalls,
        storageRemoveCalls,
        storedAuthToken: undefined,
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await loginClick();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "false");
    assert.strictEqual(fetchCalls.length, 0);
    assert.deepStrictEqual(storageRemoveCalls, ["authToken"]);
});

test("loginClick opens the auth-initiate tab using the resolved API base URL", async (t) => {
    const tabsCreateCalls = [];
    const storageSetCalls = [];
    const { loginClick } = loadAuth({
        authenticated: "false",
        getAPIBaseURL: async () => "https://example.test",
        tabsCreateCalls,
        storageSetCalls,
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; });

    await loginClick();

    assert.strictEqual(tabsCreateCalls.length, 1);
    assert.match(tabsCreateCalls[0].url, /^https:\/\/example\.test\/api\/v1\/auth\/initiate\?client-slug=/);
    assert.strictEqual(storageSetCalls.length, 1);
    assert.ok(storageSetCalls[0].clientSlug);
});

test("loginClick does not throw or leave an unhandled rejection when getAPIBaseURL rejects", async (t) => {
    const tabsCreateCalls = [];
    const { loginClick } = loadAuth({
        authenticated: "false",
        getAPIBaseURL: async () => { throw new Error("storage unavailable"); },
        tabsCreateCalls,
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; });

    await assert.doesNotReject(() => loginClick());
    assert.strictEqual(tabsCreateCalls.length, 0);
});

test("initAuthenticated clears a token the server no longer honours", async (t) => {
    const storageRemoveCalls = [];
    const fetchCalls = [];
    globalThis.fetch = async (url, opts) => {
        fetchCalls.push({ url, opts });
        return { status: 401 };
    };
    const { initAuthenticated } = loadAuth({
        authenticated: "true",
        getAPIBaseURL: async () => "https://example.test",
        storageRemoveCalls,
        storedAuthToken: "crd-1.secret",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await initAuthenticated();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "false");
    assert.strictEqual(fetchCalls[0].url, "https://example.test/api/v1/auth/session");
    assert.strictEqual(fetchCalls[0].opts.headers.Authorization, "Bearer crd-1.secret");
    assert.deepStrictEqual(storageRemoveCalls, ["authToken"]);
});

test("initAuthenticated keeps a token the server still honours", async (t) => {
    const storageRemoveCalls = [];
    globalThis.fetch = async () => ({ status: 200 });
    const { initAuthenticated } = loadAuth({
        authenticated: "false",
        getAPIBaseURL: async () => "https://example.test",
        storageRemoveCalls,
        storedAuthToken: "crd-1.secret",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await initAuthenticated();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "true");
    assert.deepStrictEqual(storageRemoveCalls, []);
});

test("initAuthenticated keeps the token when the server is unreachable", async (t) => {
    const storageRemoveCalls = [];
    globalThis.fetch = async () => { throw new Error("network unavailable"); };
    const { initAuthenticated } = loadAuth({
        authenticated: "false",
        getAPIBaseURL: async () => "https://example.test",
        storageRemoveCalls,
        storedAuthToken: "crd-1.secret",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await initAuthenticated();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "true");
    assert.deepStrictEqual(storageRemoveCalls, []);
});

test("initAuthenticated signs out with no stored token and makes no request", async (t) => {
    const fetchCalls = [];
    globalThis.fetch = async (url) => { fetchCalls.push(url); return { status: 200 }; };
    const { initAuthenticated } = loadAuth({
        authenticated: "true",
        getAPIBaseURL: async () => "https://example.test",
    });
    t.after(() => { delete globalThis.document; delete globalThis.getAPIBaseURL; delete globalThis.browserAPI; delete globalThis.fetch; });

    await initAuthenticated();

    assert.strictEqual(globalThis.document.documentElement.getAttribute("authenticated"), "false");
    assert.strictEqual(fetchCalls.length, 0);
});
