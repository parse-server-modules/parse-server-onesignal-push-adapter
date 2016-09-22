# parse-server-onesignal-push-adapter-scheduled-push-version

[![Build Status](https://travis-ci.org/parse-server-modules/parse-server-onesignal-push-adapter.svg?branch=master)](https://travis-ci.org/parse-server-modules/parse-server-onesignal-push-adapter)
[![codecov.io](https://codecov.io/github/parse-server-modules/parse-server-onesignal-push-adapter/coverage.svg?branch=master)](https://codecov.io/github/parse-server-modules/parse-server-onesignal-push-adapter?branch=master)



OneSignal push adapter for parse-server that allows scheduled push notifications

Forked from https://github.com/parse-server-modules/parse-server-onesignal-push-adapter


## Installation

```
npm install --save parse-server-onesignal-push-adapter-scheduled-push-version
```

## Usage

```
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter-scheduled-push-version');
var oneSignalPushAdapter = new OneSignalPushAdapter({
  oneSignalAppId:"your-one-signal-app-id",
  oneSignalApiKey:"your-one-signal-api-key"
});

var api = new ParseServer({
  push: {
    adapter: oneSignalPushAdapter
  },
  ...otherOptions
});
```

To send schedule push notification, use the `push_time` option. For example:

```
Parse.Push.send({
  channels: ['Default'],
  data: {
    alert: 'Alert!',
    sound: 'www/beep.caf',
  },
  push_time: pushTime,
}
```