const redirectCache = new Map();

function onRequest(req) {
  const host = redirectCache.has(req.url);
  if (host) {
    return {
      type: 'http',
      host,
      port: '8080',
      username: host,
      password: ''
    }
  }
  const proxy = `${Math.random() * 100000000000000000}.proxy.edited.com`;
  return {
    type: 'http',
    host: proxy,
    port: '8080',
    username: proxy,
    password: ''
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
    username: '',
    password: ''
  }
}

function onBeforeSendHeaders(req) {
  const requestHeaders = req.requestHeaders;
  requestHeaders.push({name: 'connection', value: 'close'});
  if (redirectCache.get(req.url)) {
    const auth = btoa(req.url + ':1');
    requestHeaders.push({name: 'proxy-authorization', value: `basic ${auth}`});
  }
  return {requestHeaders};
}

const allUrlsFilter = {urls: ['<all_urls>']};
browser.proxy.onRequest.addListener(onRequest, allUrlsFilter);
browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, allUrlsFilter, ['responseHeaders']);
browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, allUrlsFilter, ['requestBody']);
browser.webRequest.onAuthRequired.addListener(onAuthRequired, allUrlsFilter, ['blocking']);
browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, allUrlsFilter, ['blocking', 'requestHeaders']);