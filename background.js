// console.log("background script started")
// TODO: dedupe this section:
///
function getBrowserAPI() {
    if (typeof browser !== "undefined") {
        return browser;
    }
    if (typeof chrome !== "undefined") {
        return chrome;
    }
    throw new Error("no WebExtension API found: neither `browser` nor `chrome` is defined");
}

const PROD_API_BASE_URL = "https://app.affiro.com";
const LOCAL_API_BASE_URL = "http://127.0.0.1:10380";

const API_MODE_STORAGE_KEY = "apiMode";

async function getAPIMode() {
    const browserAPI = getBrowserAPI();
    const result = await browserAPI.storage.local.get(API_MODE_STORAGE_KEY);
    return result[API_MODE_STORAGE_KEY] === "local" ? "local" : "prod";
}

async function getAPIBaseURL() {
    const mode = await getAPIMode();
    return mode === "local" ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
}
///

const uploadRPCID = "CVt8yf"
const googleAppDocumentID = "application/vnd.google-apps.document"

// TODO: other ways of submitting documents likely format their args very differently
function parseDocumentIDFromUploadRPC(args) {
    // example request body
    // [[["CVt8yf","[[3],[[[872432243584,[872432519930,[872432213238]]],[[872432243584,[872432519930,[872432213238]]],null,null,null,[[null,null,\"18-Nrm6wXqkc1aqPFy7enuw8PSDpov6FULt8wdsOlGDc\",2,\"application/vnd.google-apps.document\",null,null,null,null,null,null,null,null,null,[null,2],null,null,6198577632,null,null,1]]],[null,1]]],[null,1,null,1,1,null,1,1,1,null,null,null,1,null,[1],null,null,null,1,1,1,null,null,null,[[1,1]],[[1,1]],null,null,null,null,null,1]]",null,"generic"]]]
    // find all \" escaped strings 
    let strs = []
    let startAt = 0
    while (true) {
        const openPos = args.indexOf("\\\"", startAt)
        if (openPos == -1) {
            break 
        }
        const closePos = args.indexOf("\\\"", openPos+1)
        if (closePos == -1) {
            break 
        }
        startAt = closePos+1
        strs.push(args.slice(openPos+2, closePos)) //openPos+2 to move past the \\" characters
    }
    // In upload case (assigning a google doc to an assignment), [0] is the document ID, [1] is "application/vnd.google-apps.document"
    // In the cancel case (removing an uploaded document from an assignmet), list is empty
    if (strs.length == 2 && strs[1] == "application/vnd.google-apps.document") {
        return strs[0]
    } else if (strs.length == 0) {
        return ""
    }
    // log undocumented case 
    // console.log(strs)
    return ""
}

let observedClassroomName = ""
let observedAssignmentName = ""

const browserAPI = getBrowserAPI();

browserAPI.runtime.onMessage.addListener((message) => {
    //console.log("runtime message")
    if (message.action === "documentData") {
        // console.log("Received document:", message);
        observedAssignmentName = message.assignmentTitle;
        observedClassroomName = message.classroomTitle;
        const monitor = async () => {
            const postURL = (await getAPIBaseURL()) + "/api/v1/monitoring/assignment-exists?"+
                `assignment=${encodeURIComponent(message.assignmentTitle)}`+
                `&classroom=${encodeURIComponent(message.classroomTitle)}`;
            let headers = {}
            await browserAPI.storage.local.get("authToken").then((result) => {
                // console.log("auth result", result)
                headers['Authorization'] = "Bearer " + result.authToken;
            });
            //console.log("sending monitor fetch", postURL)
            const response = await fetch(postURL, {
                method: "POST",
                headers: headers,
            });
            if (response.status !== 200) {
                console.error("Monitor failed", response.status);
            }
        }
        monitor()
    } 
});


if (!browserAPI.webRequest) {
    console.log("no web request api available")
} else {
    //console.log("registering webRequest proxy")
    browserAPI.webRequest.onBeforeRequest.addListener((details) => {
        if (!details.url) {
            return 
        }
        if (details.method != "POST") {
            return
        }
        if (!details.url.includes("batchexecute")) {
            return 
        }
        if (!details.url.includes(uploadRPCID)) {
            return
        }
        if (!details.requestBody) {
            return 
        }
        if (!details.requestBody.formData) {
            return
        }
        // NB this is a string
        const rawReq = details.requestBody.formData["f.req"][0]

        //console.log("batchexecute request sent", rawReq)
        const docID = parseDocumentIDFromUploadRPC(rawReq)
        //console.log("document ID", docID)
        if (docID) {
            const submit = async () => {
                const postURL = (await getAPIBaseURL()) + "/api/v1/monitoring/assignment-submitted?"+
                    `assignment=${encodeURIComponent(observedAssignmentName)}`+
                    `&classroom=${encodeURIComponent(observedClassroomName)}`+
                    `&documentId=${encodeURIComponent(docID)}`;
                let headers = {}
                await browserAPI.storage.local.get("authToken").then((result) => {
                    headers['Authorization'] = "Bearer " + result.authToken;
                });
                //console.log("posting to", postURL)
                const response = await fetch(postURL, {
                    method: "POST",
                    headers: headers,
                });
                if (response.status !== 200) {
                    console.error("Submission failed", response.status);
                } // else {
                    //console.info("submission succeeded")
                // }
            }
            submit()
        }
    }, {
        urls: ["https://classroom.google.com/*"], 
        types: ["xmlhttprequest"]
    }, ["requestBody"])
}

// payload example from google classrooms
// POST https://classroom.google.com/u/0/_/ClassroomUi/data/batchexecute
// f.req=%5B%5B%5B%22CVt8yf%22%2C%22%5B%5B3%5D%2C%5B%5B%5B872432243584%2C%5B872432519930%2C%5B872432213238%5D%5D%5D%2C%5B%5B872432243584%2C%5B872432519930%2C%5B872432213238%5D%5D%5D%2Cnull%2Cnull%2Cnull%2C%5B%5Bnull%2Cnull%2C%5C%221LGox6qyJ2_KXgJO_cern-OLibp9AKy8lwO4Uq00N6JM%5C%22%2C2%2C%5C%22application%2Fvnd.google-apps.document%5C%22%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5Bnull%2C2%5D%2Cnull%2Cnull%2C-19931940520%2Cnull%2Cnull%2C1%5D%5D%5D%2C%5Bnull%2C1%5D%5D%5D%2C%5Bnull%2C1%2Cnull%2C1%2C1%2Cnull%2C1%2C1%2C1%2Cnull%2Cnull%2Cnull%2C1%2Cnull%2C%5B1%5D%2Cnull%2Cnull%2Cnull%2C1%2C1%2C1%2Cnull%2Cnull%2Cnull%2C%5B%5B1%2C1%5D%5D%2C%5B%5B1%2C1%5D%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C1%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at=ACv6I2t_VTGVnvReb0r9pbng7RgS%3A1789588106645&

function initWatchAuthClaim() {
    //console.log("watching auth")
    const claimAuthIfSlugPresent = () => {
        browserAPI.storage.local.get("clientSlug").then((result) => {
            if (!result.clientSlug) {
                return 
            }
            const claimAuth = async () => {
                // console.log("claiming auth")
                try {
                    const claimURL = (await getAPIBaseURL())+"/api/v1/auth/claim?client-slug="+result.clientSlug;
                    const response = await fetch(claimURL);
                    if (response.status !== 200) {
                        console.log("Auth failed");
                        return
                    }
                    const data = await response.json();
                    // console.log("auth success", data)
                    browserAPI.storage.local.set({ authToken: data.token });
                    applyAuthenticated("true");
                    browserAPI.storage.local.remove("clientSlug")
                } catch (error) {
                    // console.error('Error making API request:', error);
                    browserAPI.storage.local.remove("clientSlug")
                }
            };
            claimAuth();
        })
    }

    claimAuthIfSlugPresent();
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'visibilityChanged' && !message.isHidden) {
            // console.log("claiming auth on tab-in")
            claimAuthIfSlugPresent();
        }
    })
}

initWatchAuthClaim();