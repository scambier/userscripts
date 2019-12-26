"use strict";
// ==UserScript==
// @name         Hacker News - Most upvoted & most commented links
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.0.4
// @description  Show top 🔥👄 links of Hacker News
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://news.ycombinator.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(() => {
    const rows = [...$('tr.athing')];
    // Get top 20%
    function getTop(items, key) {
        const count = rows.length;
        return [...items].sort((a, b) => b[key] - a[key]).slice(0, count * .2);
    }
    // Select lines
    const items = rows
        // Filter out ads
        .filter(tr => $(tr).find('td.votelinks').length)
        // Get id and score
        .map(tr => {
        var _a, _b;
        return {
            id: $(tr).attr('id'),
            score: Number((_a = $(tr).next().find('.score')[0].textContent) === null || _a === void 0 ? void 0 : _a.split(' ')[0]),
            // Weirdly, .split(' ') does not work
            comments: Number((_b = $(tr).next().find('a:contains("comments")').text().split('comments')[0].trim(), (_b !== null && _b !== void 0 ? _b : 0)))
        };
    });
    // Inject icons
    items.forEach(o => {
        if (getTop(items, 'comments').includes(o)) {
            const link = $(`tr#${o.id}`).find('a.storylink');
            link.html('<span title="Most commented">👄 </span>' + link.html());
        }
        if (getTop(items, 'score').includes(o)) {
            const link = $(`tr#${o.id}`).find('a.storylink');
            link.html('<span title="Most upvoted">🔥 </span>' + link.html());
        }
    });
})();
