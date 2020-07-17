"use strict";
// ==UserScript==
// @name         Hacker News - Most upvoted & most commented links
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.0.7
// @description  Show top 🔥👄 links of Hacker News
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://news.ycombinator.com/
// @include      https://news.ycombinator.com/ask*
// @include      https://news.ycombinator.com/news*
// @include      https://news.ycombinator.com/show*
// @include      https://news.ycombinator.com/front*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(() => {
    // Firefox mobile fix, do nothing if icons are already injected
    if ([...$('[data-userscript="scambier"]')].length)
        return;
    const rows = [...$('tr.athing')];
    /**
     * Get [ratio] best [items], ordered by [key]
     *
     * @param items
     * @param key
     * @param ratio
     */
    function getTop(items, key, ratio) {
        const count = rows.length;
        return [...items].sort((a, b) => b[key] - a[key]).slice(0, count * ratio);
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
            comments: Number((_b = $(tr).next().find('a:contains("comments")').text().split('comments')[0].trim()) !== null && _b !== void 0 ? _b : 0)
        };
    });
    // Top 10% for new entries, top 20% for other pages
    const ratio = location.href.includes('news.ycombinator.com/newest') ? .1 : .2;
    // Inject icons
    items.forEach(o => {
        if (getTop(items, 'comments', ratio).includes(o) && o.comments > 0) {
            const link = $(`tr#${o.id}`).find('a.storylink');
            link.html('<span title="Most commented" data-userscript="scambier">👄 </span>' + link.html());
        }
        if (getTop(items, 'score', ratio).includes(o) && o.score > 0) {
            const link = $(`tr#${o.id}`).find('a.storylink');
            link.html('<span title="Most upvoted" data-userscript="scambier">🔥 </span>' + link.html());
        }
    });
})();
