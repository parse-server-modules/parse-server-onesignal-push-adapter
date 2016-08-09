"use strict";
// ParsePushAdapter is the default implementation of
// PushAdapter, it uses GCM for android push and APNS
// for ios push.

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OneSignalPushAdapter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parseServerPushAdapter = require('parse-server-push-adapter');

var _parseServerPushAdapter2 = _interopRequireDefault(_parseServerPushAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parse = require('parse/node').Parse;
var deepcopy = require('deepcopy');

var OneSignalPushAdapter = exports.OneSignalPushAdapter = function () {
  function OneSignalPushAdapter() {
    var pushConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, OneSignalPushAdapter);

    this.https = require('https');

    this.validPushTypes = ['ios', 'android'];
    this.senderMap = {};
    this.OneSignalConfig = {};
    var oneSignalAppId = pushConfig.oneSignalAppId;
    var oneSignalApiKey = pushConfig.oneSignalApiKey;

    if (!oneSignalAppId || !oneSignalApiKey) {
      var configs = {};
      for (var key in pushConfig) {
        var _pushConfig$key = pushConfig[key];
        var _oneSignalAppId = _pushConfig$key.oneSignalAppId;
        var _oneSignalApiKey = _pushConfig$key.oneSignalApiKey;

        if (!_oneSignalAppId || !_oneSignalApiKey) {
          continue;
        }
        configs[key] = {};
        configs[key]['appId'] = pushConfig[key]['oneSignalAppId'];
        configs[key]['apiKey'] = pushConfig[key]['oneSignalApiKey'];
      }
      if (!Object.keys(configs).length) {
        throw "Trying to initialize OneSignalPushAdapter without oneSignalAppId or oneSignalApiKey";
      }
      this.OneSignalConfig = configs;
    } else {
      this.OneSignalConfig['default'] = {};
      this.OneSignalConfig['default']['appId'] = pushConfig['oneSignalAppId'];
      this.OneSignalConfig['default']['apiKey'] = pushConfig['oneSignalApiKey'];
    }

    this.senderMap['ios'] = this.sendToAPNS.bind(this);
    this.senderMap['android'] = this.sendToGCM.bind(this);
  }

  _createClass(OneSignalPushAdapter, [{
    key: 'send',
    value: function send(body, installations) {
      var deviceMap = _parseServerPushAdapter.utils.classifyInstallations(installations, this.validPushTypes);
      var projectKey = body.data._pushTo || 'default';
      if (!this.OneSignalConfig[projectKey]) {
        console.log('Unknown OneSignal project: %s to send pushes to.', projectKey);
        var promise = new Parse.Promise();
        return promise.reject('Unknown OneSignal project: ' + projectKey);
      }

      var sendPromises = [];
      for (var pushType in deviceMap) {
        var sender = this.senderMap[pushType];
        if (!sender) {
          console.log('Can not find sender for push type %s, %j', pushType, body);
          continue;
        }
        var devices = deviceMap[pushType];

        if (devices.length > 0) {
          sendPromises.push(sender(body, devices, projectKey));
        }
      }
      return Parse.Promise.when(sendPromises);
    }
  }, {
    key: 'getValidPushTypes',
    value: function getValidPushTypes() {
      return this.validPushTypes;
    }
  }, {
    key: 'sendToAPNS',
    value: function sendToAPNS(data, tokens, projectKey) {

      data = deepcopy(data['data']);

      var post = {};
      if (data['badge']) {
        if (data['badge'] == "Increment") {
          post['ios_badgeType'] = 'Increase';
          post['ios_badgeCount'] = 1;
        } else {
          post['ios_badgeType'] = 'SetTo';
          post['ios_badgeCount'] = data['badge'];
        }
        delete data['badge'];
      }
      if (data['alert']) {
        post['contents'] = {
          en: data['alert']
        };
        delete data['alert'];
      }
      if (data['sound']) {
        post['ios_sound'] = data['sound'];
        delete data['sound'];
      }
      if (data['content-available'] == 1) {
        post['content_available'] = true;
        delete data['content-available'];
      }
      post['data'] = data;

      var promise = new Parse.Promise();

      var chunk = 2000; // OneSignal can process 2000 devices at a time
      var tokenlength = tokens.length;
      var offset = 0;
      // handle onesignal response. Start next batch if there's not an error.
      var handleResponse = function (wasSuccessful) {
        if (!wasSuccessful) {
          return promise.reject("OneSignal Error");
        }

        if (offset >= tokenlength) {
          promise.resolve();
        } else {
          this.sendNext();
        }
      }.bind(this);

      this.sendNext = function () {
        post['include_ios_tokens'] = [];
        tokens.slice(offset, offset + chunk).forEach(function (i) {
          post['include_ios_tokens'].push(i['deviceToken']);
        });
        offset += chunk;
        this.sendToOneSignal(post, handleResponse, projectKey);
      }.bind(this);

      this.sendNext();

      return promise;
    }
  }, {
    key: 'sendToGCM',
    value: function sendToGCM(data, tokens, projectKey) {
      data = deepcopy(data['data']);

      var post = {};

      if (data['alert']) {
        post['contents'] = {
          en: data['alert']
        };
        delete data['alert'];
      }
      if (data['title']) {
        post['title'] = {
          en: data['title']
        };
        delete data['title'];
      }
      if (data['uri']) {
        post['url'] = data['uri'];
      }

      post['data'] = data;

      var promise = new Parse.Promise();

      var chunk = 2000; // OneSignal can process 2000 devices at a time
      var tokenlength = tokens.length;
      var offset = 0;
      // handle onesignal response. Start next batch if there's not an error.
      var handleResponse = function (wasSuccessful) {
        if (!wasSuccessful) {
          return promise.reject("OneSignal Error");
        }

        if (offset >= tokenlength) {
          promise.resolve();
        } else {
          this.sendNext();
        }
      }.bind(this);

      this.sendNext = function () {
        post['include_android_reg_ids'] = [];
        tokens.slice(offset, offset + chunk).forEach(function (i) {
          post['include_android_reg_ids'].push(i['deviceToken']);
        });
        offset += chunk;
        this.sendToOneSignal(post, handleResponse, projectKey);
      }.bind(this);

      this.sendNext();
      return promise;
    }
  }, {
    key: 'sendToOneSignal',
    value: function sendToOneSignal(data, cb, projectKey) {
      projectKey = projectKey || 'default';

      var headers = {
        "Content-Type": "application/json",
        "Authorization": "Basic " + this.OneSignalConfig[projectKey]['apiKey']
      };
      var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
      };
      data['app_id'] = this.OneSignalConfig[projectKey]['appId'];

      var request = this.https.request(options, function (res) {
        if (res.statusCode < 299) {
          cb(true);
        } else {
          console.log('OneSignal Error');
          res.on('data', function (chunk) {
            console.log(chunk.toString());
          });
          cb(false);
        }
      });
      request.on('error', function (e) {
        console.log("Error connecting to OneSignal");
        console.log(e);
        cb(false);
      });
      request.write(JSON.stringify(data));
      request.end();
    }
  }], [{
    key: 'classifyInstallations',
    value: function classifyInstallations(installations, validTypes) {
      return _parseServerPushAdapter.utils.classifyInstallations(installations, validTypes);
    }
  }]);

  return OneSignalPushAdapter;
}();

exports.default = OneSignalPushAdapter;