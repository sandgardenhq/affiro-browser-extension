# affiro-browser-extension

The Affiro browser extension allows users to track signatures and submit them to app.affiro.com to verify the authenticity of documents. It also automatically integrates with google docs and google classroom. 

## Running 

Official versions can be found in the chrome / firefox web stores, but this code can be run in the following ways:

Firefox: `about:debugging#/runtime/this-firefox` -> "Load Temporary Add-on" -> select this directory's `manifest.json`.

Chrome: `chrome://extensions` -> enable "Developer mode" -> "Load unpacked" -> select this directory.

Safari: Menu bar -> 'Safari' -> 'Safari Extensions' -> 'Developer' -> 'Allow unsigned extensions' -> 'Add Temporary Extension' -> select this directory.

You can also use `web-ext run` to deploy to firefox automatically.

## Third-party code

`vendor/qrcode.js` is [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase, MIT
licensed (license header retained at the top of the file). Used by the popup's QR view to encode the live signature
client-side.

`vendor/affiro.min.js` is a vendored, built copy of the [`@sandgarden/affiro`](https://www.npmjs.com/package/@sandgarden/affiro)
npm package (this extension's own signature-monitoring code, packaged for embedding on any page; source lives in the
public [sandgardenhq/affiro-js](https://github.com/sandgardenhq/affiro-js) repo). 

## Building for release 

`web-ext build` will produce an asset in the `web-ext-artifacts` directory to upload to mozilla, google, etc. 
