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

  console.log(window.location.href)
  // Do not reexecute script when Twitter location changes
  if (window.location.href.includes('twitter.com/i/cards')) {
    return
  }

  $(document).on('click', '[data-download-media]', function (e) {
    window.open($(this).attr('data-download-media'))
    e.stopPropagation()
  })


  const externalDomains = [
    'https://twdownload.com/?url=',
    'http://twittervideodownloader.com/?url=',
    'http://savetweetvid.com/?url=',
  ]

  // Add styling for the download links
  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.appendChild(document.createTextNode(`
    .dtm-link {
      color: white;
      position: absolute;
      top: 7px;
      left: 7px;
      font-size: 1em;
      background-color: #14171A;
      padding: 2px 2px 0 3px;
      border-radius: 2px;
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
    /* Twitter.com, Tweetdeck */
    .AdaptiveMediaOuterContainer:hover .dtm-link {
      opacity: 1;
      transition: 0.2s;
    }
    .media-preview-container:hover .dtm-link {
      opacity: 1;
      transition: 0.2s;
    }
  `))
  document.head.appendChild(style)

  if (location.hostname.includes('twitter.com')) {
    setInterval(() => {
      createLinks()
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

  function getTweetUrlTwitter(videoContainer: Element): string {
    return location.origin + videoContainer.closest('[data-permalink-path]')!.getAttribute('data-permalink-path')!
  }

  function getTweetUrlTweetDeck(video: Element) {
    const article = video.closest('article')!
    const id = video.getAttribute('data-tweet-id')
    const baseUrl = article.querySelector('a[rel="user"]')!.getAttribute('href')
    return baseUrl + '/' + id
  }

  function addButtonOverVideo(videoContainer: Element, url: string) {
    let tweetUrl = ''
    if (location.hostname === 'twitter.com') {
      tweetUrl = getTweetUrlTwitter(videoContainer)
    }
    else if (location.hostname === 'tweetdeck.twitter.com') {
      tweetUrl = getTweetUrlTweetDeck(videoContainer)
    }

    videoContainer.setAttribute('style', 'position: relative;')

    // Create the button (not a real button, just a link)
    const link = document.createElement('a')
    link.className = 'dtm-link'
    videoContainer.appendChild(link)

    // Add the download icon
    const icon = document.createElement('img')
    icon.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABhUlEQVQ4ja2UvWpUURSFvz0MQUKYYoiCU0qUFCIiqUVSTOETWOUxLHyD1FMFGzufwFLyAlNIggg+gPgHwWCISXB9FrlXruNMIpJzinvhnP2x9l7r3hK5itW/8FTWgGsA6sfq1dcL7s7fSVbUXfWtuq8+W3RXXKyoqpbVe8CwqgBu/39rrWrP51jUwju9yyCNmkvXn4pkGdhUh8igqpbUFrZm3Gre94A9inRqO1tHSXbVI/VYNYlJVM/UoyTf1Kdqv1s7z6376rsupAP7qU6SDGfr/jZSe+q4hbXABvIyyeo8++en4hz2IMl+wzpplNxYlKNKMgK2qupmx+5U1WvgVN2uqjfqpKoeA9c79nwCXlB8IMk4ycnsTNQvSZ6od9WNJK/Us+bMjtJxm+w+sNRmprVbXa2qHWAKjKpqHTgEPgO3gPfAnTZCvS5gThAHwCaw3rQ8rarnwA9g0jx/z+NRkoOZtrpuzdrf5utYPVAftsMeABvAyr9+Do0Aquo7MKU4rKv6sf0CJZXR6U2U6EQAAAAASUVORK5CYII=')
    link.appendChild(icon)

    console.log(url)
    if (url.includes('blob:')) {
      // If it's a blob video, redirect to twdownload.com
      link.setAttribute('data-download-media', getRandomItem(externalDomains) + tweetUrl)
    }
    else {
      // If it's a gif, we can open the file
      link.setAttribute('data-download-media', url)
    }
    // link.setAttribute('href', '')
  }

  /**
   * Create download links on the timeline
   */
  function createLinks() {
    const videos: JQuery<HTMLVideoElement> = $('video')
    for (const video of videos) {
      const container = video.closest('.AdaptiveMedia.is-video') || video.closest('.js-media-gif-container')
      if (container && !container.querySelector('[data-download-media]')) {
        addButtonOverVideo(container, video.currentSrc)
      }
    }
  }

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

  function getUrlQuery() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('url')
  }

  function getRandomItem(items: any[]) {
    return items[Math.floor(Math.random() * items.length)]
  }

})()
