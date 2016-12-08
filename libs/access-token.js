#!/usr/bin/env node
// -*- coding:utf-8 -*-
// File          : access-token.js
// Author        : bss
// Project       : wechat_alerter
// Description   : 定期获取 ACCESS_TOKEN
// 


const request = require('request');

var tokenExpireTime = 0;


/**
 * ACCESS_TOKEN 管理
 * @param accessTokenUri 更新 ACCESS_TOKEN 的地址
 * @param updateToken 更新 ACCESS_TOKEN 的回调
 * @constructor
 */
function AccessToken(accessTokenUri, updateToken) {

  getAccessToken(updateToken);

  // 定时检查 ACCESS_TOKEN
  var intervalSecond = 600;

  setInterval(function () {
    var ttl = tokenExpireTime - getTime();
    if (!(ttl > 3600)) {
      getAccessToken(updateToken);
    }
  }, intervalSecond * 1000);


  /**
   * 获取 ACCESS_TOKEN
   * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183&token=&lang=zh_CN
   */
  function getAccessToken(updateToken) {
    request(accessTokenUri, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        // 更新
        tokenExpireTime = getTime() + json.expires_in;
        updateToken(json.access_token);
      }
    });
  }


  function getTime() {
    return Math.floor(Date.now() / 1000);
  }
}


exports.AccessToken = AccessToken;
