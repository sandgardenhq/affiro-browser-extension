// console.log("loading content script")

const browserAPI = getBrowserAPI();
let monitor = new Affiro.Monitor();

watchForModeToggleHotkey(() => {
    toggleAPIMode().then((mode) => {
        console.log("[Affiro] switched to " + mode + " API");
    });
});

browserAPI.runtime.onMessage.addListener((message) => {
    if (message && message.action === "reset") {
        monitor.reset();
    }
    //console.log("sending string ", monitor.toString())
    return Promise.resolve({ signature: monitor.toString() });
});


// This section specifically enables tracking key events on google docs, but it could help other sites as well. 
// (or it might interfere with them such that we have to only do this on docs.google.com)
var iframes = document.getElementsByTagName("iframe");
if (iframes) {
    //console.log("iframes length", iframes.length)
    for (i = 0; i < iframes.length; i++) {
        let iframe = iframes[i];
        if (iframe && iframe.contentDocument) {
            iframe.contentDocument.addEventListener("keydown", function( { isTrusted, code, key, shiftKey, ctrlKey, metaKey } ) {
                //console.log("iframe keydown: " + code, isTrusted);
                let ev = {};
                ev.keyCode = code;
                ev.text = key;
                ev.shiftPressed = shiftKey;
                ev.controlPressed = ctrlKey;
                ev.specialPressed = metaKey;
                monitor.sig.writeEvent(ev)
            }, true); // true here is critical; without it another event listener can intercept the event and stop its propagation
        }
    }
}
// TODO: do we need to watch the DOM for the creation of new iframes? 
// theory: maybe once there's a website we find which does this, but for now we can target only websites we know we need
// to work on.

function findChunkForm1(text) {
    const needle = "DOCS_modelChunk = {"
    const chunkStart = text.indexOf(needle)
    if (chunkStart == -1) {
        //console.log("no docs_modelChunk")
        return ""
    }
    const chunk = text.slice(chunkStart+needle.length)
    // TODO: presumably, larger documents come in more chunks?
    // "chunk": [{
    //     "ty": "is",
    //     "ibi": 1,
    //     "s": "If you type something in here!as asaaasasasdasdasdasdsonaonsuvouasvnsvonasonsfnosabnoasfbinoadsbfnoadsfnobadfbadfbadfbadfbadfbadfba\n\n\n\n\n\n\nAbracadabra\n\n\n\n\n\n\n\n\n\n\n\nWhos watching\n\n\nTest "
    // },
    const openCurl = chunk.indexOf("{")
    const closeCurl = chunk.slice(openCurl).indexOf("}")
    const chunkCandidate = chunk.slice(openCurl, openCurl+closeCurl+1)
    //console.log(chunkCandidate)
    const parsedChunk = JSON.parse(chunkCandidate)
    const document = parsedChunk.s
    return document 
}

function findChunkForm2(text) {
    console.log("trying form 2")
    const needle = "var modelChunk = {"
    const chunkStart = text.indexOf(needle)
    if (chunkStart == -1) {
        return ""
    }
    const chunk = text.slice(chunkStart+needle.length)
    // TODO: presumably, larger documents come in more chunks?
    // "chunk": [{
    //     "ty": "is",
    //     "ibi": 1,
    //     "s": "If you type something in here!as asaaasasasdasdasdasdsonaonsuvouasvnsvonasonsfnosabnoasfbinoadsbfnoadsfnobadfbadfbadfbadfbadfbadfba\n\n\n\n\n\n\nAbracadabra\n\n\n\n\n\n\n\n\n\n\n\nWhos watching\n\n\nTest "
    // },
    const openCurl = chunk.indexOf("{")
    const closeCurl = chunk.slice(openCurl).indexOf("}")
    const chunkCandidate = chunk.slice(openCurl, openCurl+closeCurl+1)
    //console.log(chunkCandidate)
    const parsedChunk = JSON.parse(chunkCandidate)
    const document = parsedChunk.s
    // NEXT!!!
    // TODO: this document is incorrect!
    console.log(parsedChunk)
    return document 
}

if (window.location.hostname == 'docs.google.com' && window.location.pathname.startsWith("/document/d")) {
    //console.log("polling for document changes")
    const documentId = window.location.pathname.slice(12).slice(0,-5)
    //console.log("document id", documentId)
    const docPollURL = window.location 
    const checkContent = () => {
       // console.log("poll")
        const check = async () => {
            try {
                // TODO: provide headers?
                resp = await fetch(docPollURL)
                if (!resp.ok) {
                    throw new Error(`Response status: ${resp.status}`);
                }
                //console.info("fetching", docPollURL)
                const text = await resp.text();
                
                let documentContent = findChunkForm1(text)
                if (documentContent == "") {
                    documentContent = findChunkForm2(text)
                }
                if (documentContent == "") {
                    throw new Error(`no model chunk found in response`);
                }
                // TODO: how do we resubmit this document with a signature, if the user is freshly coming into the page? 
                // should we load the previous signature? No, this has to be a server responsibility; the server needs to 
                // check the signature timestamp and say "this is a continuation of the last signature, or this should be 
                // appended to the last signature".

                const postURL = (await getAPIBaseURL()) + "/api/v1/documents/"+documentId;
                let headers = {}
                await browserAPI.storage.local.get("authToken").then((result) => {
                    headers['Authorization'] = "Bearer " + result.authToken;
                });
                const response = await fetch(postURL, {
                    method: "POST",
                    headers: headers,
                    body: monitor.toString() + '\n' + documentContent
                });
                if (response.status !== 200) {
                    console.error("Post failed", response.status);
                } // else {
                //     console.info("Post success", postURL)
                // }
            } catch (error) {
                console.log("failed to fetch doc url", error)
            }
        }
        check()
        setTimeout(checkContent, 10000)
    }
    checkContent();
}

function extractAssignmentTitle(documentTitle) {
    const suffix = " - Classroom"
    if (documentTitle.endsWith(suffix)) {
        return documentTitle.slice(0, documentTitle.length-suffix.length)
    }
    //console.log(documentTitle)
    return ""
}

function extractClassroomTitle(document) {
    const span = document.getElementById("UGb2Qe")
    if (!span) {
        return ""
    }
    return span.innerText
}

function shipMetadata() {
    //console.log(document)
    const classroomTitle = extractClassroomTitle(document)
    const assignmentTitle = extractAssignmentTitle(document.title)
    if (!assignmentTitle || !classroomTitle) {
        //console.log("insufficient data to ship")
        return 
    }
    browserAPI.runtime.sendMessage({
        action: "documentData",
        classroomTitle: classroomTitle,
        assignmentTitle: assignmentTitle,
    });
}

// TODO: external IDs for classrooms / assignments as seen in these URLS
// classroom https://classroom.google.com/u/1/c/ODcyNDMyMjEzMjM4
// assignment https://classroom.google.com/u/1/c/ODcyNDMyMjEzMjM4/a/ODcyNDMyNTE5OTMw/details

if (window.location.hostname == 'classroom.google.com' && 
    window.location.pathname.startsWith("/u/") && 
    window.location.pathname.includes("/a/") &&
    window.location.pathname.endsWith("/details")) { 
    const titleElement = document.querySelector('title');

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            shipMetadata();
        });
    });

    observer.observe(titleElement, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

