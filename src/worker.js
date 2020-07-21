"use strict"

const ServiceWorker = require("@cosmic-plus/domutils/es5/service-worker")
const pkg = require("../package.json")

new ServiceWorker(pkg.name, pkg.version, "verbose")
  .fromCache([
    // Application"
    "/",
    "app.js",
    "index.css",
    "index.html",
    "index.js",
    "ledger.js",
    "stellar-sdk.js",
    "vendors~app.js",
    "vendors~ledger.js",
    "vendors~trezor.js",

    // Fonts
    "fonts/source-sans-pro.woff",
    "fonts/source-sans-pro.woff2",
    "fonts/roboto-slab.woff",
    "fonts/roboto-slab.woff2",

    // Images
    "images/activity.png",
    "images/balances.png",
    "images/cosmic-link.svg",
    "images/history.png",
    "images/repartition.png",
    "images/side-frame.png",

    // Vendor configuration
    "browserconfig.xml",
    "manifest.json",

    // Icons
    "favicon.ico",
    "icons/16x16.png",
    "icons/32x32.png",
    "icons/192x192.png",
    "icons/512x512.png",
    "icons/apple-touch.png",
    "icons/mstile.png",
    "icons/safari.svg"
  ])
  .precache()
  .register()
