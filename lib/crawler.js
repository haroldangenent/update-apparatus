const Crawler = require('js-crawler');
const fs = require('fs');
const urlParser = require('url');

module.exports = (crawlUrl, max) => {
  let allowedUrlList;
  const crawled = [];
  const directory = `.crawl-cache/${Date.now()}`
    .split('/')
    .reduce((dir, folder) => {
      dir += '/' + folder;

      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }

      return dir;
    }, '.');

  if (Array.isArray(crawlUrl)) {
    allowedUrlList = crawlUrl;
    crawlUrl = crawlUrl[0];
  }

  return {
    crawl() {
      return new Promise((resolve, reject) => {
        const crawler = new Crawler().configure({
          depth: Number.POSITIVE_INFINITY,
          shouldCrawl: (url) => {
            const allowedFromList = allowedUrlList ? (allowedUrlList.indexOf(url) !== -1) : true;
            const maxReached = max ? (crawled.length >= max) : false;

            return url.indexOf(crawlUrl) === 0 && crawled.indexOf(url) < 0 && allowedFromList && !maxReached;
          }
        });

        crawler.crawl({
          url: crawlUrl,
          failure: ({url, status}) => {
            console.log('Failed crawling', url, status);
          },
          success: ({url, status, referer, content}) => {
            crawled.push(url);
            
            const fileName = (urlParser.parse(url).hostname + url.replace(crawlUrl.replace(/\/$/, ''), '')).replace(/^\/|\/$/g, '').replace(/\//g, '\\');
            const fileContents = JSON.stringify({url, status, referer}, null, 2) + "\n\n" + content;

            fs.writeFileSync(`${directory}/${fileName}.log`, fileContents);
          },
          finished: () => {
            resolve({
              directory,
              crawled
            });
          }
        });
      });
    }
  }
}
