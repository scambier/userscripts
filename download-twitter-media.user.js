// ==UserScript==
// @name         Twitter Video Download
// @namespace    https://github.com/scambier/userscripts
// @version      0.2
// @description  Adds a download button to quickly download gifs and videos embedded in tweets
// @author       Simon Cambier
// @match        https://twitter.com/*
// @match        https://twdownload.com/?url=*
// @match        http://twittervideodownloader.com/?url=*
// @match        https://www.savetweetvid.com/?url=*
// @grant        none
// @run-at       document-idle
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.1/js/all.js
// ==/UserScript==

(function () {
  'use strict'

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
      padding: 2px 4px;
      border-radius: 2px;
      opacity: 0;
      transition: 0.2s;
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

  switch (window.location.hostname) {
    case 'twitter.com':
      setInterval(() => {
        createLinks()
      }, 500)
      break

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

  /**
   * Create download links on the timeline
   */
  function createLinks() {
    const tweets = document.querySelectorAll('div.tweet')
    for (const tweet of tweets) {
      const path = 'https://twitter.com' + tweet.getAttribute('data-permalink-path')

      const videoContainer = tweet.getElementsByClassName('AdaptiveMediaOuterContainer')[0]
      if (videoContainer) {

        // We must have a video element
        const video = videoContainer.querySelectorAll('video')[0]
        if (video) {

          // If we already added the download link
          if (videoContainer.querySelectorAll('[data-download-media]')[0]) continue

          // Add a position: relative to the container, to absolutely position the button
          videoContainer.setAttribute('style', 'position: relative;')

          // Create the button (not a real button, just a link)
          const link = document.createElement('a')
          link.className = 'dtm-link'
          link.setAttribute('data-download-media', '')
          link.setAttribute('z-index', '100')
          videoContainer.appendChild(link)

          // Add the download icon
          const icon = document.createElement('i')
          icon.className = 'fas fa-download'
          link.appendChild(icon)

          const videoSrc = video.getAttribute('src')
          if (videoSrc.includes('blob:')) {
            // If it's a blob video, redirect to twdownload.com
            link.setAttribute('href', getRandomItem(externalDomains) + path)
          }
          else {
            // If it's a gif, we can open the file
            link.setAttribute('href', videoSrc)
          }
          link.setAttribute('target', '_blank')
        }
      }
    }
  }

  function download_twdownloader() {
    const url = getUrlQuery()
    if (url) {
      const form = document.querySelector('form[action="/download-track/"]')
      const input = form.querySelector('input[name="twitter-url"]')
      const submit = form.querySelector('[type="submit"]')
      input.value = url
      submit.click()
    }
  }

  function download_twittervideodownloader() {
    const url = getUrlQuery()
    if (url) {
      const form = document.querySelector('form[action="/download"]')
      const input = form.querySelector('input[name="tweet"]')
      const submit = form.querySelector('[type="submit"]')
      input.value = url
      submit.click()
    }
  }

  function download_savetweetvid() {
    const url = getUrlQuery()
    if (url) {
      const form = document.getElementById('form_download')
      const input = form.querySelector('input[name="url"]')
      const submit = form.querySelector('[type="submit"]')
      input.value = url
      submit.click()
    }
  }

  function getUrlQuery() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('url')
  }

  function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)]
  }

})()
