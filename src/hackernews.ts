// ==UserScript==
// @name         Hacker News - Most upvoted & most commented links
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.0.2
// @description  Show top 🔥👄 links of Hacker News
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://news.ycombinator.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {

  const rows = [...$('tr.athing')]

  // Get top 20%
  function getTop<T extends { [key: string]: any }>(items: T[], key: string): T[] {
    const count = rows.length;
    return items.sort((a, b) => b[key] - a[key]).slice(0, count * .2)
  }


  // Select lines
  const items = rows
    // Filter out ads
    .filter(tr => $(tr).find('td.votelinks').length)
    // Get id and score
    .map(tr => {
      return {
        id: $(tr).attr('id')!,
        score: Number($(tr).next().find('.score')[0].textContent?.split(' ')[0]),
        // Weirdly, .split(' ') does not work
        comments: Number($(tr).next().find('a:contains("comments")').text().split('comments')[0].trim() ?? 0)
      }
    })

  // Inject icons
  items.forEach(o => {
    const link = $(`tr#${o.id}`).find('a.storylink')
    const topScores = getTop(items, 'score')
    const topComments = getTop(items, 'comments')

    if (topScores.includes(o)) {
      link.html('<span title="Most upvoted">👄 </span>' + link.html())
    }
    if (topComments.includes(o)) {
      link.html('<span title="Most commented">🔥 </span>' + link.html())
    }
  })

})()
