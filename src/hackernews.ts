// ==UserScript==
// @name         Hackernews best
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.0.1
// @description  Show top 🔝 links of Hackernews
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://news.ycombinator.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {

  // Show arrows on top 20%
  const count = [...$('tr.athing')].length;

  // Select lines
  [...$('tr.athing')]
    // Filter out ads
    .filter(tr => $(tr).find('td.votelinks').length)
    // Get id and score
    .map(tr => {
      return {
        id: $(tr).attr('id')!,
        score: Number($(tr).next().find('.score')[0].textContent?.split(' ')[0])
      }
    })
    // Sort by score descending
    .sort((a, b) => b.score - a.score)
    // Keep the top items
    .slice(0, count * 0.2)
    // Mark those lines
    .forEach(o => {
      const link = $(`tr#${o.id}`).find('a.storylink')
      link.text('🔝 ' + link.text())
    })
})()
