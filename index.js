/**
 * @format
 */

var reactNative = require('react-native');
var AppRegistry = reactNative.AppRegistry;

var AppModule = require('./App');
var App = AppModule && AppModule.default ? AppModule.default : AppModule;

var appJson = require('./app.json');
var appName = appJson && appJson.name ? appJson.name : 'App';

// ---- Push BG handler (ES5 only) ----
var messagingModule = require('@react-native-firebase/messaging');
var messaging = messagingModule && messagingModule.default ? messagingModule.default : messagingModule;

var notifeeModule = require('@notifee/react-native');
var notifee = notifeeModule && notifeeModule.default ? notifeeModule.default : notifeeModule;

var AndroidImportance =
  (notifeeModule && notifeeModule.AndroidImportance) ||
  (notifee && notifee.AndroidImportance) ||
  null;

var CHANNEL_ID = 'default_high_v1';

function ensureChannel() {
  try {
    return notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Default High',
      importance: AndroidImportance && AndroidImportance.HIGH ? AndroidImportance.HIGH : 4, // HIGH fallback=4
    });
  } catch (e) {
    console.warn('⚠️ [PushBG] ensureChannel failed:', e);
    return Promise.resolve();
  }
}

function pickTitleBody(remoteMessage) {
  var notif = remoteMessage && remoteMessage.notification ? remoteMessage.notification : null;
  var data = remoteMessage && remoteMessage.data ? remoteMessage.data : null;

  var title =
    (notif && notif.title) ||
    (data && (data.title || data.notificationTitle)) ||
    '알림';

  var body =
    (notif && notif.body) ||
    (data && (data.body || data.message || data.notificationBody)) ||
    '';

  return { title: String(title), body: String(body) };
}

try {
  if (messaging && typeof messaging === 'function') {
    messaging().setBackgroundMessageHandler(function (remoteMessage) {
      try {
        console.log('📦 [PushBG] message:', {
          notification: remoteMessage ? remoteMessage.notification : null,
          data: remoteMessage ? remoteMessage.data : null,
        });

        return ensureChannel()
          .then(function () {
            var tb = pickTitleBody(remoteMessage);

            return notifee.displayNotification({
              title: tb.title,
              body: tb.body,
              android: {
                channelId: CHANNEL_ID,
                pressAction: { id: 'default' },
              },
            });
          })
          .catch(function (e) {
            console.error('❌ [PushBG] handler failed:', e);
          });
      } catch (e) {
        console.error('❌ [PushBG] handler outer failed:', e);
        return Promise.resolve();
      }
    });
  } else {
    console.warn('⚠️ [PushBG] messaging() not available');
  }
} catch (e) {
  console.warn('⚠️ [PushBG] setup failed:', e);
}

// ✅ 이건 RN 기본 형태(ES5)
AppRegistry.registerComponent(appName, function () {
  return App;
});
