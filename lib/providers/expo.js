// Copyright IBM Corp. 2013,2018. All Rights Reserved.
// Node module: loopback-component-push
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

var g = require('strong-globalize')();
const {Expo} = require('expo-server-sdk');
var inherits = require('util').inherits;
var extend = require('util')._extend;
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('loopback:component:push:provider:expo');

function ExpoProvider(pushSettings) {
  var settings = pushSettings.expo || {};
  this._setupPushConnection(settings);
}

inherits(ExpoProvider, EventEmitter);

exports = module.exports = ExpoProvider;

ExpoProvider.prototype._setupPushConnection = function(options) {
  debug('Using GCM Server API key %j', options.serverApiKey);
  this._connection = new Expo();
};

ExpoProvider.prototype.pushNotification = async function(notification, deviceToken) {
  var self = this;

  var registrationIds = (typeof deviceToken == 'string') ?
    [deviceToken] : deviceToken;
  var message = this._createMessage(notification);

  debug('Sending message to %j: %j', registrationIds, message);
  const messages = registrationIds.map(o => ({
    ...message,
    to: o,
  }));
  const chunks = this._connection.chunkPushNotifications(messages); // expo have limit, so break message into chunk
  const tickets = await Promise.all(chunks.map(async chunk => {
    return this._connection.sendPushNotificationsAsync(chunk);
  }));
  debug('Expo notification result: %j', tickets);
};

ExpoProvider.prototype._createMessage = function(notification) {
  // Message parameters are documented here:
  //   https://developers.google.com/cloud-messaging/server-ref
  const {
    title,
    alert,
    channelId,
    sound = 'default',
    priority = 'high',
    channelId,
    ...rest
  } = notification;
  var message = {
    // to: pushToken,
    channelId,
    sound,
    priority,
    title: title,
    body: alert,
    data: rest,
  };

  return message;
};
