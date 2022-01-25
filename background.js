const redirectCache = new Map();

function onRequest(req) {
  const host = redirectCache.get(req.url);
  if (host) {
    return {
      type: 'http',
      host,
      port: '8080',
      proxyAuthorizationHeader: `Basic ${btoa('v1:' + req.url)}`
    }
  }
  const proxy = `${Math.random() * 100000000000000000}.proxy.edited.com`;
  console.dir(btoa('v1:' + req.url))
  console.dir(proxy)
  return {
    type: 'http',
    host: proxy,
    port: '8080',
    proxyAuthorizationHeader: `Basic ${btoa('v1:' + req.url)}`
  }
}

function onBeforeRedirect(req) {
  redirectCache.set(req.url, req.proxyInfo.host);
}

function onBeforeRequest(req) {
  if (redirectCache.has(req.url)) {
    redirectCache.delete(req.url);
  }
}

function onAuthRequired(req) {
  console.dir(req)
  return {
    username: 'v1',
    password: req.url
  }
}

function onBeforeSendHeaders(req) {
  const requestHeaders = req.requestHeaders;
  requestHeaders.push({name: 'connection', value: 'close'});
  if (redirectCache.get(req.url)) {
    const auth = btoa('v1:' + req.url);
    requestHeaders.push({name: 'proxy-authorization', value: `Basic ${auth}`});
  }
  return {requestHeaders};
}

const allUrlsFilter = {urls: ['<all_urls>']};
browser.proxy.onRequest.addListener(onRequest, allUrlsFilter, ['requestHeaders']);
browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, allUrlsFilter, ['responseHeaders']);
browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, allUrlsFilter, ['requestBody']);
browser.webRequest.onAuthRequired.addListener(onAuthRequired, allUrlsFilter, ['blocking']);
browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, allUrlsFilter, ['blocking', 'requestHeaders']);