#!/usr/bin/env node
// -*- coding:utf-8 -*-
// File          : server.js
// Author        : bss
// Project       : wechat_filesaver
// Creation Date : 2016-12-08
// Description   : https://github.com/bssthu/wechat_filesaver
// 
// Module dependencies:
// - xml2js: https://github.com/Leonidas-from-XIV/node-xml2js
// 


const http = require('http');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');


// custom modules
const accessTokenMgr = require('./libs/access-token');
const mediaServer = require('./libs/media-server');

// configs
const config = require('./config');

// 接入验证及普通消息接收
mediaServer.serve(config.httpPort, config.token, handleXmlMessage);

// 获取 ACCESS_TOKEN
var ACCESS_TOKEN_URI =
    'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential' + '' +
    '&appid=' + config.appId + '&secret=' + config.appSecret;
var accessToken = '';

accessTokenMgr.AccessToken(ACCESS_TOKEN_URI, function(newAccessToken) {
  accessToken = newAccessToken;
});


// 处理普通消息
function handleXmlMessage(xmlMessage) {
  xml2js.parseString(xmlMessage, function(err, result) {
    if (!err && result.hasOwnProperty('xml')) {
      var xmlResult = result.xml;
      if (xmlResult.hasOwnProperty('MsgType') && xmlResult.hasOwnProperty('MediaId')) {
        writeLog([xmlResult.FromUserName[0], xmlResult.CreateTime[0], xmlResult.MediaId[0]].join(', '));
        handleMediaMessage(xmlResult.CreateTime[0], xmlResult.MediaId[0]);
      }
    }
  });
}


// 处理多媒体消息
function handleMediaMessage(createTime, mediaId) {
  if (mediaId !== null) {
    var uri = 'http://api.weixin.qq.com/cgi-bin/media/get?access_token='
        + accessToken + '&media_id=' + mediaId;
    http.get(uri, function(response) {
      if (response.statusCode == 200) {
        try {
          var disposition = response.headers['content-disposition'];
          var expStart = 'attachment; filename="';
          if (disposition.startsWith(expStart) && disposition.endsWith('"')) {
            var filename = createTime + '_' + disposition.slice(expStart.length, -1);
            var file = fs.createWriteStream(path.join(config.downloadPath, filename));
            response.pipe(file);
          }
        } catch (err) {
          showError(err);
        }
      }
    })
  }
}


function writeLog(text) {
  console.log(text);
  var filename = config.logName + '.log';
  fs.appendFile(filename, text + '\n', showError);
}


function showError(err) {
  if (err) {
    console.error(err);
  }
}
