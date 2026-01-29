/**
 * @format
 */
var reactNative = require('react-native');
var AppRegistry = reactNative.AppRegistry;

var AppModule = require('./App');
var App = AppModule && AppModule.default ? AppModule.default : AppModule;

var appJson = require('./app.json');
var appName = appJson && appJson.name ? appJson.name : 'App';

AppRegistry.registerComponent(appName, function () {
  return App;
});
