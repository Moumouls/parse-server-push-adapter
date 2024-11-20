'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parse = require('parse');

var _parse2 = _interopRequireDefault(_parse);

var _npmlog = require('npmlog');

var _npmlog2 = _interopRequireDefault(_npmlog);

var _APNS = require('./APNS');

var _APNS2 = _interopRequireDefault(_APNS);

var _FCM = require('./FCM');

var _FCM2 = _interopRequireDefault(_FCM);

var _WEB = require('./WEB');

var _WEB2 = _interopRequireDefault(_WEB);

var _EXPO = require('./EXPO');

var _EXPO2 = _interopRequireDefault(_EXPO);

var _PushAdapterUtils = require('./PushAdapterUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LOG_PREFIX = 'parse-server-push-adapter';

var ParsePushAdapter = function () {
  function ParsePushAdapter() {
    var pushConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ParsePushAdapter);

    this.supportsPushTracking = true;

    this.validPushTypes = ['ios', 'osx', 'tvos', 'android', 'fcm', 'web', 'expo'];
    this.senderMap = {};
    // used in PushController for Dashboard Features
    this.feature = {
      immediatePush: true
    };
    var pushTypes = Object.keys(pushConfig);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = pushTypes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var pushType = _step.value;

        // adapter may be passed as part of the parse-server initialization
        if (this.validPushTypes.indexOf(pushType) < 0 && pushType != 'adapter') {
          throw new _parse2.default.Error(_parse2.default.Error.PUSH_MISCONFIGURED, 'Push to ' + pushType + ' is not supported');
        }
        switch (pushType) {
          case 'ios':
          case 'tvos':
          case 'osx':
            if (pushConfig[pushType].hasOwnProperty('firebaseServiceAccount')) {
              this.senderMap[pushType] = new _FCM2.default(pushConfig[pushType], 'apple');
            } else {
              this.senderMap[pushType] = new _APNS2.default(pushConfig[pushType]);
            }
            break;
          case 'web':
            this.senderMap[pushType] = new _WEB2.default(pushConfig[pushType]);
            break;
          case 'expo':
            this.senderMap[pushType] = new _EXPO2.default(pushConfig[pushType]);
            break;
          case 'android':
          case 'fcm':
            if (pushConfig[pushType].hasOwnProperty('firebaseServiceAccount')) {
              this.senderMap[pushType] = new _FCM2.default(pushConfig[pushType], 'android');
            } else {
              throw new _parse2.default.Error(_parse2.default.Error.PUSH_MISCONFIGURED, 'GCM Configuration is invalid');
            }
            break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  _createClass(ParsePushAdapter, [{
    key: 'getValidPushTypes',
    value: function getValidPushTypes() {
      return this.validPushTypes;
    }
  }, {
    key: 'send',
    value: function send(data, installations) {
      var _this = this;

      var deviceMap = (0, _PushAdapterUtils.classifyInstallations)(installations, this.validPushTypes);
      var sendPromises = [];

      var _loop = function _loop(pushType) {
        var sender = _this.senderMap[pushType];
        var devices = deviceMap[pushType];

        if (Array.isArray(devices) && devices.length > 0) {
          if (!sender) {
            _npmlog2.default.verbose(LOG_PREFIX, 'Can not find sender for push type ' + pushType + ', ' + data);
            var results = devices.map(function (device) {
              return Promise.resolve({
                device: device,
                transmitted: false,
                response: { 'error': 'Can not find sender for push type ' + pushType + ', ' + data }
              });
            });
            sendPromises.push(Promise.all(results));
          } else {
            sendPromises.push(sender.send(data, devices));
          }
        }
      };

      for (var pushType in deviceMap) {
        _loop(pushType);
      }
      return Promise.all(sendPromises).then(function (promises) {
        // flatten all
        return [].concat.apply([], promises);
      });
    }
  }], [{
    key: 'classifyInstallations',
    value: function classifyInstallations(installations, validTypes) {
      return (0, _PushAdapterUtils.classifyInstallations)(installations, validTypes);
    }
  }]);

  return ParsePushAdapter;
}();

exports.default = ParsePushAdapter;