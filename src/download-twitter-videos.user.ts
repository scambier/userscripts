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
    src: string
  }

  // Do not reexecute script when Twitter location changes
  if (window.location.href.includes('twitter.com/i/cards')) {
    return
  }

  //#region JQuery events

  $(document).on('click', '[data-download-media]', function (e) {
    window.open($(this).attr('data-download-media'))
    e.stopPropagation()
  })

  $(document).on('click', 'a.tweet-action', function (e) {
    setTimeout(() => {
      const article: JQuery<HTMLElement> = $(this).closest('article')
      const url = article.attr('data-media-download')
      const actions = article.find('.js-dropdown-content ul')
      console.log(actions.find('[data-media-download]').length)
      if (url && !actions.find('[data-media-download]').length) {
        console.log('ok')
        actions.append('<li class="is-selectable" data-media-download><a href="#" data-action="embed">LOL</a></li>')
      }
    }, 100)
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

  function getTweetUrlTwitter(videoContainer: Element): string {
    return location.origin + videoContainer.closest('[data-permalink-path]')!.getAttribute('data-permalink-path')!
  }

  function addButtonOverVideo(video: IMediaBlock) {
    let tweetUrl = ''
    if (location.hostname === 'twitter.com') {
      tweetUrl = getTweetUrlTwitter(video.container)
    }
    else if (location.hostname === 'tweetdeck.twitter.com') {
      tweetUrl = getTweetUrlTweetDeck(video.container)
    }

    video.container.setAttribute('style', 'position: relative;')

    // Create the button (not a real button, just a link)
    const link = document.createElement('a')
    link.className = 'dtm-link'
    video.container.appendChild(link)

    // Add the download icon
    const icon = document.createElement('img')
    icon.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABhUlEQVQ4ja2UvWpUURSFvz0MQUKYYoiCU0qUFCIiqUVSTOETWOUxLHyD1FMFGzufwFLyAlNIggg+gPgHwWCISXB9FrlXruNMIpJzinvhnP2x9l7r3hK5itW/8FTWgGsA6sfq1dcL7s7fSVbUXfWtuq8+W3RXXKyoqpbVe8CwqgBu/39rrWrP51jUwju9yyCNmkvXn4pkGdhUh8igqpbUFrZm3Gre94A9inRqO1tHSXbVI/VYNYlJVM/UoyTf1Kdqv1s7z6376rsupAP7qU6SDGfr/jZSe+q4hbXABvIyyeo8++en4hz2IMl+wzpplNxYlKNKMgK2qupmx+5U1WvgVN2uqjfqpKoeA9c79nwCXlB8IMk4ycnsTNQvSZ6od9WNJK/Us+bMjtJxm+w+sNRmprVbXa2qHWAKjKpqHTgEPgO3gPfAnTZCvS5gThAHwCaw3rQ8rarnwA9g0jx/z+NRkoOZtrpuzdrf5utYPVAftsMeABvAyr9+Do0Aquo7MKU4rKv6sf0CJZXR6U2U6EQAAAAASUVORK5CYII=')
    link.appendChild(icon)

    if (video.src.includes('blob:')) {
      // If it's a blob video, redirect to twdownload.com
      link.setAttribute('data-download-media', getRandomItem(externalDomains) + tweetUrl)
    }
    else {
      // If it's a gif, we can open the file
      link.setAttribute('data-download-media', video.src)
    }
  }

  function getVideosTwitter() {
    const elems: IMediaBlock[] = []
    const videos: JQuery<HTMLVideoElement> = $('video')
    for (const video of videos) {
      const container = video.closest('.AdaptiveMedia.is-video')!
      if (container.querySelector('[data-download-media]')) continue
      elems.push({
        container,
        src: video.currentSrc
      })
    }
    return elems
  }

  //#endregion Twitter

  //#region Tweetdeck

  function getTweetUrlTweetDeck(video: Element) {
    const article = video.closest('article')!
    const id = video.getAttribute('data-tweet-id')
    const baseUrl = article.querySelector('a[rel="user"]')!.getAttribute('href')
    return baseUrl + '/' + id
  }

  function getVideosTweetdeck() {
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
      const videos = getVideosTwitter()
      for (const video of videos) {
        addButtonOverVideo(video)
      }
    }

    if (isTweetdeck()) {
      const videos = getVideosTweetdeck()
      for (const video of videos) {
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
