# parse-server-onesignal-push-adapter

[![Build Status](https://travis-ci.org/parse-server-modules/parse-server-onesignal-push-adapter.svg?branch=master)](https://travis-ci.org/parse-server-modules/parse-server-onesignal-push-adapter)
[![codecov.io](https://codecov.io/github/parse-server-modules/parse-server-onesignal-push-adapter/coverage.svg?branch=master)](https://codecov.io/github/parse-server-modules/parse-server-onesignal-push-adapter?branch=master)



OneSignal push adapter for parse-server


## Installation

```
npm install --save parse-server-onesignal-push-adapter
```

## SmackHigh Usage

We've modified the push adapter to support our use case. Parse service was able to support multiple push certificates in one project, so we didn't need to specify which certs to use when we push to targeted users. However, OneSignal, the free push service we use only supports one dev and one prod certificates per apiId and apiKey pair. Therefore we need to explicitly specify which set to use when we push to users. Since our server will host both Fam and SmackChat, we need a way to select which key pairs to use. And I've added convenience functions `toFam`, `toChat` in [https://github.com/Smack] which  will deliver pushes using the corresponding keys.

```
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');
var oneSignalPushAdapter = new OneSignalPushAdapter({
  fam: {
    oneSignalAppId:"your-one-signal-app-id",
    oneSignalApiKey:"your-one-signal-api-key"
  },
  chat: {
    oneSignalAppId:"your-one-signal-app-id",
    oneSignalApiKey:"your-one-signal-api-key"
  }
});

var api = new ParseServer({
  push: {
    adapter: oneSignalPushAdapter
  },
  ...otherOptions
});
```

