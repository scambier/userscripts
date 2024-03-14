"use strict";
// ==UserScript==
// @name         Obsidian Omnisearch in Bing
// @version      0.3
// @description  Injects Obsidian notes into Bing search results
// @author       ever
// @namespace    https://github.com/scambier/userscripts
// @downloadURL  https://github.com/scambier/userscripts/raw/master/dist/obsidian-omnisearch-bing.user.js
// @updateURL    https://github.com/scambier/userscripts/raw/master/dist/obsidian-omnisearch-bing.user.js
// @match        *://*bing.com/*
// @match        https://bing.com/*
// @match        https://www.bing.com/*
// @icon         https://obsidian.md/favicon.ico
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @require      https://gist.githubusercontent.com/scambier/109932d45b7592d3decf24194008be4d/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==
(function () {
    "use strict";
    // Bing's right "sidebar" selector for additional content
    const sidebarSelector = "#b_context";
    // The results div
    const resultsDivId = "OmnisearchObsidianResultsBing";
    // The "loading"/"no results" label
    const loadingSpanId = "OmnisearchObsidianLoadingBing";
    // Configure GM_config
    // The `new GM_config()` syntax is not recognized by the TS compiler
    // @ts-ignore
    const gmc = new GM_config({
        id: "ObsidianOmnisearchBing",
        title: "Omnisearch in Bing - Configuration",
        fields: {
            port: {
                label: "HTTP Port",
                type: "text",
                default: "51361",
            },
            nbResults: {
                label: "Number of results to display",
                type: "int",
                default: 3,
            },
        },
        events: {
            save: () => location.reload(),
            init: () => { },
        },
    });
    // Promise resolves when initialization completes
    const onInit = (config) => new Promise((resolve) => {
        let isInit = () => setTimeout(() => (config.isInit ? resolve() : isInit()), 0);
        isInit();
    });
    function omnisearch() {
        const port = gmc.get("port");
        const nbResults = gmc.get("nbResults");
        const params = new URLSearchParams(window.location.search);
        const query = params.get("q");
        if (!query)
            return;
        injectLoadingLabel();
        GM.xmlHttpRequest({
            method: "GET",
            url: `http://localhost:${port}/search?q=${encodeURIComponent(query)}`,
            onload: function (response) {
                const data = JSON.parse(response.responseText);
                removeLoadingLabel(data.length > 0);
                data.splice(nbResults);
                const resultsDiv = $(`#${resultsDivId}`);
                resultsDiv.empty(); // Clear previous results
                data.forEach((item) => {
                    const url = `obsidian://open?vault=${encodeURIComponent(item.vault)}&file=${encodeURIComponent(item.path)}`;
                    const resultHTML = `
                        <div class="b_algo" data-omnisearch-result style="padding: 10px; border-bottom: 1px solid #ccc;">
                            <h2 class="b_attribution" style="margin-bottom: 5px;">
                                <a href="${url}" target="_blank"><span style="vertical-align: middle; margin-right: 0.5em;"><svg height="16" width="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 256"><path class="fill-current" d="M94.82 149.44c6.53-1.94 17.13-4.9 29.26-5.71a102.97 102.97 0 0 1-7.64-48.84c1.63-16.51 7.54-30.38 13.25-42.1l3.47-7.14 4.48-9.18c2.35-5 4.08-9.38 4.9-13.56.81-4.07.81-7.64-.2-11.11-1.03-3.47-3.07-7.14-7.15-11.21a17.02 17.02 0 0 0-15.8 3.77l-52.81 47.5a17.12 17.12 0 0 0-5.5 10.2l-4.5 30.18a149.26 149.26 0 0 1 38.24 57.2ZM54.45 106l-1.02 3.06-27.94 62.2a17.33 17.33 0 0 0 3.27 18.96l43.94 45.16a88.7 88.7 0 0 0 8.97-88.5A139.47 139.47 0 0 0 54.45 106Z"/><path class="fill-current" d="m82.9 240.79 2.34.2c8.26.2 22.33 1.02 33.64 3.06 9.28 1.73 27.73 6.83 42.82 11.21 11.52 3.47 23.45-5.8 25.08-17.73 1.23-8.67 3.57-18.46 7.75-27.53a94.81 94.81 0 0 0-25.9-40.99 56.48 56.48 0 0 0-29.56-13.35 96.55 96.55 0 0 0-40.99 4.79 98.89 98.89 0 0 1-15.29 80.34h.1Z"/><path class="fill-current" d="M201.87 197.76a574.87 574.87 0 0 0 19.78-31.6 8.67 8.67 0 0 0-.61-9.48 185.58 185.58 0 0 1-21.82-35.9c-5.91-14.16-6.73-36.08-6.83-46.69 0-4.07-1.22-8.05-3.77-11.21l-34.16-43.33c0 1.94-.4 3.87-.81 5.81a76.42 76.42 0 0 1-5.71 15.9l-4.7 9.8-3.36 6.72a111.95 111.95 0 0 0-12.03 38.23 93.9 93.9 0 0 0 8.67 47.92 67.9 67.9 0 0 1 39.56 16.52 99.4 99.4 0 0 1 25.8 37.31Z"/></svg></span>${item.basename}</a>
                            </h2>
                            <p>${item.excerpt.replace(/<br\s*\/?>/gi, " ")}</p>
                        </div>
                    `;
                    resultsDiv.append(resultHTML);
                });
            },
            onerror: function () {
                const span = $(`#${loadingSpanId}`);
                if (span.length) {
                    span.html(`Error: Obsidian is not running or the Omnisearch server is not enabled.
                      <br /><a href="Obsidian://open">Open Obsidian</a>.`);
                }
            }
        });
    }
    function injectLoadingLabel() {
        if (!$(`#${loadingSpanId}`).length) {
            $(sidebarSelector).prepend(`<span id="${loadingSpanId}">Loading...</span>`);
        }
    }
    function removeLoadingLabel(foundResults = true) {
        if (foundResults) {
            $(`#${loadingSpanId}`).remove();
        }
        else {
            $(`#${loadingSpanId}`).text("No results found");
        }
    }
    function injectResultsContainer() {
        if (!$(`#${resultsDivId}`).length) {
            $(sidebarSelector).prepend(`<div id="${resultsDivId}" style="margin-top: 20px; position: relative;"></div>`);
        }
    }
    function showSettingsDialog() {
        const nbResults = gmc.get("nbResults");
        const newNbResults = prompt("Enter the number of results to display:", nbResults);
        if (newNbResults !== null) {
            gmc.set("nbResults", parseInt(newNbResults));
            gmc.save();
        }
    }
    console.log("Loading Omnisearch injector");
    let init = onInit(gmc);
    init.then(() => {
        gmc.init();
        injectResultsContainer();
        omnisearch(); // Make an initial call, just to avoid an improbable race condition
        console.log("Loaded Omnisearch injector");
        // Add a button to show settings dialog
        const settingsButton = $("<button>Settings</button>").css({
            marginRight: "10px",
        }).click(showSettingsDialog);
        const headerContainer = $("<div></div>").css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
        });
        const resultsHeader = $(`<h2>Obsidian Search Results</h2>`);
        headerContainer.append(resultsHeader, settingsButton); // Append both the header and the button to the container
        $(sidebarSelector).prepend(headerContainer); // Prepend the container instead of the header
    });
})();
