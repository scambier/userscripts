// ==UserScript==
// @name         Dowload Twitter Videos
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.4
// @description  Adds a download button to quickly download gifs and videos embedded in tweets
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://twitter.com/*
// @include      https://tweetdeck.twitter.com/*
// @include      https://twdownload.com/?url=*
// @include      http://twittervideodownloader.com/?url=*
// @include      https://www.savetweetvid.com/?url=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict'

  interface IMediaBlock {
    container: Element,
    src?: string
  }

  // Do not reexecute script when Twitter location changes
  if (window.location.href.includes('twitter.com/i/cards')) {
    return
  }

  //#region JQuery events

  $(document).on('click', '[data-download-media]', function (e) {
    let mediaUrl = $(this).attr('data-download-media')!
    let tweetUrl = $(this).attr('data-tweet-url')!

    if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('https://t.co')) {
      // If it's a blob video, redirect to twdownload.com
      mediaUrl = getRandomItem(externalDomains) + tweetUrl
    }

    e.stopPropagation()
    window.open(mediaUrl)
  })

  $(document).on('click', 'a.tweet-action, a.tweet-detail-action', function (e) {
    setTimeout(() => {
      const tweetUrl = getTweetUrl_tweetDeck(this)
      const article: JQuery<HTMLElement> = $(this).closest('article')
      const mediaUrl = article.attr('data-media-download')
      const actions = article.find('.js-dropdown-content ul')
      if (mediaUrl && !actions.find('[data-media-download]').length) {
        actions.append(`
          <li class="is-selectable" data-media-download>
            <a href="#" data-action="download-media" data-download-media="${mediaUrl}" data-tweet-url="${tweetUrl}" data-tweet-url>Download media</a>
          </li>`)
      }
    }, 0)
  })

  $(document).on('mouseenter', '.is-selectable', function (e) {
    $(this).addClass('is-selected')
  })
  $(document).on('mouseleave', '.is-selectable', function (e) {
    $(this).removeClass('is-selected')
  })

  //#endregion

  //#region CSS

  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.appendChild(document.createTextNode(`
    .dtm-link {
      color: white;
      position: absolute;
      font-size: 1em;
      background-color: #14171A;
      padding: 2px 2px 0 3px;
      border-radius: 2px;
      top: 7px;
      left: 7px;
      opacity: 0;
      transition: 0.2s;
    }
    .dtm-link img {
      border: none;
    }
    .dtm-link:visited {
      color: white;
    }
    .dtm-link:hover {
      color: white;
    }

    .AdaptiveMediaOuterContainer:hover .dtm-link {
      opacity: 1;
      transition: 0.2s;
    }

  `))
  document.head.appendChild(style)

  //#endregion CSS

  //#region Twitter

  function getTweetUrl_twitter(videoContainer: Element): string {
    return location.origin + videoContainer.closest('[data-permalink-path]')!.getAttribute('data-permalink-path')!
  }

  function addButtonOverVideo(video: IMediaBlock) {
    // Make sure that the link exists
    if (!video.src) return

    video.container.setAttribute('style', 'position: relative;')

    // Create the button (not a real button, just a link)
    const link = document.createElement('a')
    link.className = 'dtm-link'

    // Add the download icon
    const icon = document.createElement('img')
    icon.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABhUlEQVQ4ja2UvWpUURSFvz0MQUKYYoiCU0qUFCIiqUVSTOETWOUxLHyD1FMFGzufwFLyAlNIggg+gPgHwWCISXB9FrlXruNMIpJzinvhnP2x9l7r3hK5itW/8FTWgGsA6sfq1dcL7s7fSVbUXfWtuq8+W3RXXKyoqpbVe8CwqgBu/39rrWrP51jUwju9yyCNmkvXn4pkGdhUh8igqpbUFrZm3Gre94A9inRqO1tHSXbVI/VYNYlJVM/UoyTf1Kdqv1s7z6376rsupAP7qU6SDGfr/jZSe+q4hbXABvIyyeo8++en4hz2IMl+wzpplNxYlKNKMgK2qupmx+5U1WvgVN2uqjfqpKoeA9c79nwCXlB8IMk4ycnsTNQvSZ6od9WNJK/Us+bMjtJxm+w+sNRmprVbXa2qHWAKjKpqHTgEPgO3gPfAnTZCvS5gThAHwCaw3rQ8rarnwA9g0jx/z+NRkoOZtrpuzdrf5utYPVAftsMeABvAyr9+Do0Aquo7MKU4rKv6sf0CJZXR6U2U6EQAAAAASUVORK5CYII=')

    link.setAttribute('data-download-media', video.src)
    link.setAttribute('data-tweet-url', getTweetUrl_twitter(video.container))

    link.appendChild(icon)
    video.container.appendChild(link)
  }

  function getVideos_twitter() {
    const elems: IMediaBlock[] = []
    const videos: JQuery<HTMLVideoElement> = $('video')
    for (const video of videos) {
      const container = video.closest('.AdaptiveMedia.is-video')
      if (!container || container.querySelector('[data-download-media]')) continue
      elems.push({
        container,
        src: video.currentSrc
      })
    }
    return elems
  }

  //#endregion Twitter

  //#region Tweetdeck

  function getTweetUrl_tweetDeck(elem: Element) {
    const article = elem.closest('article')!
    const tweetLink = article.querySelector('[rel="url"]')
    if (tweetLink) {
      return tweetLink.getAttribute('href')
    }
    throw new Error('DTV - Could not found tweet url')
  }

  function getVideos_tweetdeck() {
    const elems: IMediaBlock[] = []

    const gifs: JQuery<Element> = $('.js-media-gif.media-item-gif')
    for (const gif of gifs) {
      const container = gif.closest('article')!
      if (container.querySelector('[data-download-media]')) continue
      elems.push({
        container,
        src: gif.getAttribute('src')!
      })
    }

    const videos = $('div.is-video')
    for (const video of videos) {
      // Only keep "internal" twitter videos
      const src = video.querySelector('[rel=mediaPreview]')!.getAttribute('href')!
      const container = video.closest('article')!
      if (src.startsWith('https://t.co/') && !container.querySelector('[data-download-media]')) {
        elems.push({
          container,
          src
        })
      }
    }
    return elems
  }

  //#endregion Tweetdeck

  //#region External services

  const externalDomains = [
    'https://twdownload.com/?url=',
    'http://twittervideodownloader.com/?url=',
    'http://savetweetvid.com/?url=',
  ]

  function download_twdownloader() {
    const url = getUrlQuery()
    if (url) {
      const form = document.querySelector('form[action="/download-track/"]') as HTMLElement
      const input = form.querySelector('input[name="twitter-url"]') as HTMLElement
      const submit = form.querySelector('[type="submit"]') as HTMLElement
      input.setAttribute('value', url)
      submit.click()
    }
  }

  function download_twittervideodownloader() {
    const url = getUrlQuery()
    if (url) {
      const form = document.querySelector('form[action="/download"]') as HTMLElement
      const input = form.querySelector('input[name="tweet"]') as HTMLElement
      const submit = form.querySelector('[type="submit"]') as HTMLElement
      input.setAttribute('value', url)
      submit.click()
    }
  }

  function download_savetweetvid() {
    const url = getUrlQuery()
    if (url) {
      const form = document.getElementById('form_download') as HTMLElement
      const input = form.querySelector('input[name="url"]') as HTMLElement
      const submit = form.querySelector('[type="submit"]') as HTMLElement
      input.setAttribute('value', url)
      submit.click()
    }
  }

  //#endregion External services

  //#region Utils

  function isTwitter() {
    return location.host === 'twitter.com'
  }

  function isTweetdeck() {
    return location.host === 'tweetdeck.twitter.com'
  }

  function getUrlQuery() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('url')
  }

  function getRandomItem(items: any[]) {
    return items[Math.floor(Math.random() * items.length)]
  }

  //#endregion Utils

  /**
   * Create download links on the timeline
   */
  function main() {

    if (isTwitter()) {
      const videos = getVideos_twitter()
      for (const video of videos) {
        addButtonOverVideo(video)
      }
    }

    else if (isTweetdeck()) {
      const videos = getVideos_tweetdeck()
      for (const video of videos) {
        if (!video.src) continue
        video.container.setAttribute('data-media-download', video.src)
      }
    }
  }

  if (location.hostname.includes('twitter.com')) {
    setInterval(() => {
      main()
    }, 500)
  }

  else {
    switch (window.location.hostname) {
      case 'twdownload.com':
        download_twdownloader()
        break

      case 'twittervideodownloader.com':
        download_twittervideodownloader()
        break

      case 'www.savetweetvid.com':
        download_savetweetvid()
        break
    }
  }


})()
