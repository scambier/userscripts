// ==UserScript==
// @name         Hacker News - Most upvoted & most commented links
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.0.5
// @description  Show top 🔥👄 links of Hacker News
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://news.ycombinator.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {

  const rows = [...$('tr.athing')]

  // Top 10% for new entries, top 20% for other pages
  const ratio = location.href.includes('news.ycombinator.com/newest') ? .1  : .2

  /**
   * Get [ratio]% best entries, ordered by [key]
   * @param items
   * @param key
   */
  function getTop<T extends { [key: string]: any }>(items: T[], key: string): T[] {
    const count = rows.length
    return [...items].sort((a, b) => b[key] - a[key]).slice(0, count * ratio)
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
    if (getTop(items, 'comments').includes(o) && o.comments > 0) {
      const link = $(`tr#${o.id}`).find('a.storylink')
      link.html('<span title="Most commented">👄 </span>' + link.html())
    }
    if (getTop(items, 'score').includes(o) && o.score > 0) {
      const link = $(`tr#${o.id}`).find('a.storylink')
      link.html('<span title="Most upvoted">🔥 </span>' + link.html())
    }

  })

})()
