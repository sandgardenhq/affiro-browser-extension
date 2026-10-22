function randomID(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    // /api/v1/auth/claim is unauthenticated and matches on this slug alone,
    // so it must not come from Math.random().
    var randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(randomValues[i] % charactersLength);
    }
    return result;
}

function applyAuthenticated(v) {
    document.documentElement.setAttribute("authenticated", v);
    if (v == "true") {
        els.loginBtn.setAttribute('title', 'Log Out')
    } else {
        els.loginBtn.setAttribute('title', 'Log In')
    }
}

// A stored token may already be dead, so ask the server and forget it if so.
async function initAuthenticated() {
    let token;
    try {
        ({ authToken: token } = await browserAPI.storage.local.get("authToken"));
    } catch (error) {
        applyAuthenticated("false");
        return;
    }
    if (!token) {
        applyAuthenticated("false");
        return;
    }
    applyAuthenticated("true");
    try {
        const response = await fetch((await getAPIBaseURL()) + "/api/v1/auth/session", {
            headers: { "Authorization": "Bearer " + token },
        });
        if (response.status === 401) {
            await browserAPI.storage.local.remove("authToken");
            applyAuthenticated("false");
        }
    } catch (error) {
        // Unreachable server is not proof the credential is dead; leave it be.
        console.error("Error checking session:", error);
    }
}


async function loginClick() {
     const authed = document.documentElement.getAttribute("authenticated")
    if (authed === "true") {
        // The credential stays live server-side until we revoke it.
        try {
            const result = await browserAPI.storage.local.get("authToken");
            if (result.authToken) {
                const baseURL = await getAPIBaseURL();
                await fetch(baseURL + "/api/v1/auth/logout", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + result.authToken },
                });
            }
        } catch (error) {
            console.error('Error revoking session:', error);
        }
        browserAPI.storage.local.remove("authToken")
        applyAuthenticated("false")
        return
    }
    const clientSlug =  randomID(64);
    try {
        const baseURL = await getAPIBaseURL();
        browserAPI.tabs.create({url: baseURL+"/api/v1/auth/initiate?client-slug="+clientSlug });
        browserAPI.storage.local.set({clientSlug:clientSlug})
    } catch (error) {
        console.error('Error starting login:', error);
    }
}

if (typeof module !== "undefined") {
    module.exports = { randomID, applyAuthenticated, initAuthenticated, loginClick };
}