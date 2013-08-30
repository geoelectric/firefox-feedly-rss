/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var {Cc, Ci} = require("chrome");
var prefs = require("sdk/preferences/service");

const KEY_PREFIX = "browser.contentHandlers.types.";

const TITLE_KEY = ".title";
const TYPE_KEY = ".type";
const URI_KEY = ".uri";

const TITLE_VAL = "Feedly Cloud";
const TYPE_VAL = "application/vnd.mozilla.maybe.feed";
const URI_VAL = "https://cloud.feedly.com/#subscription/feed/%s"

const AUTO_KEY = "browser.contentHandlers.auto.application/vnd.mozilla.maybe.feed";

exports.main = function (options, callbacks) {
  if (options.loadReason !== "startup") {
    // Register the handler so it'll take effect without restarting
    Cc["@mozilla.org/embeddor.implemented/web-content-handler-registrar;1"]
      .getService(Ci.nsIWebContentHandlerRegistrar)
      .registerContentHandler(TYPE_VAL, URI_VAL, TITLE_VAL, null);
  }
};

exports.onUnload = function (reason) {
  var handlerFound = false;
  var handlerNumber = -1;
  var handlerTitle;

  if (reason !== "shutdown") {
    while (!handlerFound) {
      handlerNumber++;
      handlerTitle = prefs.get(KEY_PREFIX + handlerNumber + TITLE_KEY);
      if (!handlerTitle) {
        break;
      }
      handlerFound = handlerTitle === TITLE_VAL;
    }

    if (handlerFound) {
      // Remove the prefs, otherwise if it gets re-enabled this session it'll
      // keep incrementing the content handler number when it registers
      prefs.reset(KEY_PREFIX + handlerNumber + TITLE_KEY);
      prefs.reset(KEY_PREFIX + handlerNumber + TYPE_KEY);
      prefs.reset(KEY_PREFIX + handlerNumber + URI_KEY);

      // If it's set as the "always use", clear that.
      // TODO: Figure out how to make this work without a restart
      if (prefs.get(AUTO_KEY) === URI_VAL) {
        prefs.reset(AUTO_KEY);
      }

      // Unregister the handler, so it'll take effect without restarting
      Cc["@mozilla.org/embeddor.implemented/web-content-handler-registrar;1"]
        .getService(Ci.nsIWebContentConverterService)
        .removeContentHandler(TYPE_VAL, URI_VAL);
    }
  }
};
