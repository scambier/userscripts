"use strict";
// ==UserScript==
// @name         Dowload Twitter Videos
// @namespace    https://github.com/scambier/userscripts
// @author       Simon Cambier
// @version      0.5.4
// @description  Adds a download button to quickly fetch gifs and videos embedded in tweets
// @license      ISC
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.js
// @include      https://twitter.com/*
// @include      https://tweetdeck.twitter.com/*
// @include      http://twittervideodownloader.com/?url=*
// @include      https://www.savetweetvid.com/?url=*
// @grant        none
// @run-at       document-end
// ==/UserScript==
// console = unsafeWindow.console;
(() => {
    'use strict';
    const externalDomains = [
        // 'https://twdownload.com/?url=',
        'http://savetweetvid.com/?url=',
        'http://twittervideodownloader.com/?url=',
    ];
    const externalDomainsBlockquotes = [
        'http://twittervideodownloader.com/?url=',
    ];
    // Do not reexecute script when Twitter location changes
    if (window.location.href.includes('twitter.com/i/cards')) {
        return;
    }
    //#region JQuery events
    $(document).on('click', '[data-dtv]', function (e) {
        let mediaUrl = $(this).attr('data-dtv-media-url');
        const tweetUrl = $(this).attr('data-dtv-tweet-url');
        const blockquote = $(this).attr('data-dtv-blockquote') === 'true';
        if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('https://t.co')) {
            // If it's a blob video, redirect to twdownload.com
            mediaUrl = (blockquote
                ? getRandomItem(externalDomainsBlockquotes) // These urls are compatible with blockquotes
                : getRandomItem(externalDomains)) + tweetUrl;
        }
        e.stopPropagation();
        window.open(mediaUrl);
    });
    $(document).on('click', 'a.tweet-action, a.tweet-detail-action', function (e) {
        setTimeout(() => {
            const tweetUrl = getTweetUrl_tweetDeck(this);
            const article = $(this).closest('article');
            const mediaUrl = article.attr('data-dtv-video');
            const actions = article.find('.js-dropdown-content ul');
            if (mediaUrl && !actions.find('[data-dtv-video]').length) {
                actions.append(`
          <li class="is-selectable" data-dtv-video>
            <a href="#" data-action="download-media" data-dtv data-dtv-media-url="${mediaUrl}" data-dtv-tweet-url="${tweetUrl}" data-dtv-tweet-url>Download media</a>
          </li>`);
            }
        }, 0);
    });
    $(document).on('mouseenter', '.is-selectable', function (e) {
        $(this).addClass('is-selected');
    });
    $(document).on('mouseleave', '.is-selectable', function (e) {
        $(this).removeClass('is-selected');
    });
    //#endregion
    //#region CSS
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.appendChild(document.createTextNode(`
    .dtv-link {
      cursor: pointer;
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
    .dtv-link img {
      border: none;
    }
    .dtv-link:visited {
      color: white;
    }
    .dtv-link:hover {
      color: white;
    }

    article:hover .dtv-link {
      opacity: 1;
      transition: 0.2s;
    }

  `));
    document.head.appendChild(style);
    //#endregion CSS
    //#region Twitter
    function getTweetUrl_twitter(videoContainer) {
        return location.origin + $(videoContainer).closest('article').find('a[href*="status"]')[0].getAttribute('href');
    }
    function addButtonOverVideo(video) {
        // Make sure that the link exists
        if (!video.src) {
            return;
        }
        // If it's a blockquote
        const blockquote = $(video.videoContainer).closest('div[role="blockquote"]')[0];
        // If button is already added
        if ($(video.videoContainer).find('[data-dtv]').length) {
            return;
        }
        // video.container.setAttribute('style', 'position: relative;')
        // Create the button (not a real button, just a link)
        const link = document.createElement('a');
        link.className = 'dtv-link';
        // Add the download icon
        const icon = document.createElement('img');
        icon.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABhUlEQVQ4ja2UvWpUURSFvz0MQUKYYoiCU0qUFCIiqUVSTOETWOUxLHyD1FMFGzufwFLyAlNIggg+gPgHwWCISXB9FrlXruNMIpJzinvhnP2x9l7r3hK5itW/8FTWgGsA6sfq1dcL7s7fSVbUXfWtuq8+W3RXXKyoqpbVe8CwqgBu/39rrWrP51jUwju9yyCNmkvXn4pkGdhUh8igqpbUFrZm3Gre94A9inRqO1tHSXbVI/VYNYlJVM/UoyTf1Kdqv1s7z6376rsupAP7qU6SDGfr/jZSe+q4hbXABvIyyeo8++en4hz2IMl+wzpplNxYlKNKMgK2qupmx+5U1WvgVN2uqjfqpKoeA9c79nwCXlB8IMk4ycnsTNQvSZ6od9WNJK/Us+bMjtJxm+w+sNRmprVbXa2qHWAKjKpqHTgEPgO3gPfAnTZCvS5gThAHwCaw3rQ8rarnwA9g0jx/z+NRkoOZtrpuzdrf5utYPVAftsMeABvAyr9+Do0Aquo7MKU4rKv6sf0CJZXR6U2U6EQAAAAASUVORK5CYII=');
        link.setAttribute('data-dtv', '');
        link.setAttribute('data-dtv-media-url', video.src);
        link.setAttribute('data-dtv-tweet-url', getTweetUrl_twitter(video.videoContainer));
        if (blockquote) {
            link.setAttribute('data-dtv-blockquote', 'true');
        }
        link.appendChild(icon);
        video.videoContainer.appendChild(link);
    }
    function getVideos_twitter() {
        const elems = [];
        const videos = $('video');
        for (const video of videos) {
            const videoContainer = $(video).parent().get(0);
            // if (!container || container.querySelector('[data-dtv]')) { continue }
            elems.push({
                videoContainer,
                src: video.currentSrc
            });
        }
        return elems;
    }
    //#endregion Twitter
    //#region Tweetdeck
    function getTweetUrl_tweetDeck(elem) {
        const article = elem.closest('article');
        const tweetLink = article.querySelector('[rel="url"]');
        if (tweetLink) {
            return tweetLink.getAttribute('href');
        }
        throw new Error('DTV - Could not found tweet url');
    }
    function getVideos_tweetdeck() {
        const elems = [];
        const gifs = $('.js-media-gif.media-item-gif');
        for (const gif of gifs) {
            const container = gif.closest('article');
            if (container.querySelector('[data-dtv]')) {
                continue;
            }
            elems.push({
                videoContainer: container,
                src: gif.getAttribute('src')
            });
        }
        const videos = $('div.is-video');
        for (const video of videos) {
            // Only keep "internal" twitter videos
            const src = video.querySelector('[rel=mediaPreview]').getAttribute('href');
            const container = video.closest('article');
            if (src.startsWith('https://t.co/') && !container.querySelector('[data-dtv]')) {
                elems.push({
                    videoContainer: container,
                    src
                });
            }
        }
        return elems;
    }
    //#endregion Tweetdeck
    //#region External services
    function download_twdownload() {
        const url = getUrlQuery();
        if (url) {
            const form = document.querySelector('form[action="/download-track/"]');
            const input = form.querySelector('input[name="twitter-url"]');
            const submit = form.querySelector('[type="submit"]');
            input.setAttribute('value', url);
            submit.click();
        }
    }
    function download_twittervideodownloader() {
        const url = getUrlQuery();
        if (url) {
            const form = document.querySelector('form[action="/download"]');
            const input = form.querySelector('input[name="tweet"]');
            const submit = form.querySelector('[type="submit"]');
            input.setAttribute('value', url);
            submit.click();
        }
    }
    function download_savetweetvid() {
        const url = getUrlQuery();
        if (url) {
            const form = document.getElementById('form_download');
            const input = form.querySelector('input[name="url"]');
            const submit = form.querySelector('[type="submit"]');
            input.setAttribute('value', url);
            submit.click();
        }
    }
    function download_twdownloader() {
        const url = getUrlQuery();
        if (url) {
            const form = document.querySelector('form[action="/download/"]');
            const input = form.querySelector('input[name="tweet"]');
            const submit = form.querySelector('[type="submit"]');
            input.setAttribute('value', url);
            submit.click();
        }
    }
    //#endregion External services
    //#region Utils
    function isTwitter() {
        return location.host === 'twitter.com';
    }
    function isTweetdeck() {
        return location.host === 'tweetdeck.twitter.com';
    }
    function getUrlQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('url');
    }
    function getRandomItem(items) {
        return items[Math.floor(Math.random() * items.length)];
    }
    //#endregion Utils
    /**
     * Create download links on the timeline
     */
    function main() {
        if (isTwitter()) {
            const videos = getVideos_twitter();
            for (const video of videos) {
                addButtonOverVideo(video);
            }
        }
        else if (isTweetdeck()) {
            const videos = getVideos_tweetdeck();
            for (const video of videos) {
                if (!video.src) {
                    continue;
                }
                video.videoContainer.setAttribute('data-dtv-video', video.src);
            }
        }
    }
    if (location.hostname.includes('twitter.com')) {
        setInterval(() => {
            main();
        }, 1000);
    }
    else {
        switch (window.location.hostname) {
            case 'twdownload.com':
                download_twdownload();
                break;
            case 'www.savetweetvid.com':
                download_savetweetvid();
                break;
            case 'twittervideodownloader.com':
                download_twittervideodownloader();
                break;
            case 'twdownloader.net':
                console.log('ok');
                download_twdownloader();
                break;
        }
    }
})();
