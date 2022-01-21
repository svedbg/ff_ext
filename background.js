function FindProxyForURL(url) {
  const i = Math.random() * 100000000000000000;
  return 'PROXY ' + i + '.proxy.edited.com:8080';
}

const proxySettings = {
  proxyType: 'autoConfig',
  // proxyType: 'system',
  autoConfigUrl: 'data:text/javascript,' + encodeURIComponent(FindProxyForURL.toString()),
  httpProxyAll: true,
  http: '127.0.0.1:8080',
  socksVersion: 4,
  passthrough: ""
};
browser.proxy.settings.set({value: proxySettings});

const onBeforeRedirect = (request) => {
  console.log(`TCP Forwarding [${request.requestId}]: ${request.method} ${request.url}`);
};

const onAuthRequired = (request) => {
  console.log(`onAuthRequired [${request.requestId}]: ${request.method} ${request.url}`);

  // LATER check that it's a proxy credentials request, not a normal http auth request
  // LATER do the fragment truncation properly
  // truncate at the fragment because the http server wont get it either
  const url = request.url.replace(/#.*/, '');

  return {
    authCredentials: {
      username: 'v1',
      password: url
    }
  };
};

const allUrlsFilter = {urls: ['<all_urls>']};
browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, allUrlsFilter, ['responseHeaders']);
browser.webRequest.onAuthRequired.addListener(onAuthRequired, allUrlsFilter, ['blocking']);

browser.proxy.onError.addListener(function ({details, error, fatal}) {
  console.log(`onError: ${details} ${error} ${fatal}`);
});

function getRedirectId (request) {
  return request.responseHeaders.find(({name}) => name === 'x-proxy-redirect-id')?.value;
}

/*
browser requests http://postman-echo.com/get
browser does a proxy CONNECT to a unique proxy hostname
  proxy returns a 407 with a Proxy-Authenticate header
    browser fires onAuthRequired
    browser encodes the url into the credentials
    browser retries the CONNECT with credentials
      proxy reads auth headers and decodes url from the credentials
      proxy can't find a forwarding flag for the url so it passes connection to TLS server
      TLS server gets blocked & returns a 307 redirect with a state_id header (for logging purposes)
        browser fires onBeforeRedirect and logs the state_id header with the redirect url
        browser does a proxy CONNECT to a unique proxy hostname
          proxy returns a 407 with a Proxy-Authenticate header
            browser fires onAuthRequired
            browser encodes the url into the credentials
            browser retries the CONNECT with credentials
              proxy reads auth headers and decodes url from the credentials
              proxy finds a forwarding flag for the url so it passes connection to the forwarding server
              forwarding server opens a tcp connection to the destination & joins the streams
*/