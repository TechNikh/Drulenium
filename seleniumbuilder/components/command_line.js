var config = {
  description: "Drulenium command-line Component",
  extension: "drulenium",
  contract: "@drulenium.org/commandlinehandler/general-startup;1",
  error: "Error: incorrect parameter passed to -drulenium",
  help: "  -drulenium <uri>       Format: -drulenium <file>\n"
}

const Cc = Components.classes,
      Ci = Components.interfaces,
      Cu = Components.utils;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
/* Error log */
function jsdump(str) {
  Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
    .logStringMessage(str);
}
/* XPCOM */
function drulenium() {}
drulenium.prototype = {
  classDescription: config.description,
  classID: Components.ID("{ddcbaa33-76b8-48e8-8f36-823877497a16}"),
  contractID: config.contract + "?type=" + config.extension,
  _xpcom_categories: [{
    category: "command-line-handler",
    entry: "m-" + config.extension
  }],
  QueryInterface: XPCOMUtils.generateQI([Ci.nsICommandLineHandler]),
  handle : function(cmdLine) {
    try {
      var path = cmdLine.handleFlagWithParam(config.extension, false);
      if (path) {
        cmdLine.preventDefault = true;
        
        var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"]
          .getService(Ci.nsIWindowWatcher);
        var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        var win = ww.openWindow(null, "chrome://selenium-ide/content/selenium-ide.xul",
          "Selenium IDE", "chrome,centerscreen", null); 
        // Wait for selenium IDE to load
        var event = {
          notify: function(timer) {
            if (win.editor) {
              win.editor.app.loadTestCaseWithNewSuite(path);
            }
            else {
              timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);
            }
          }
        }
        timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);
      }
    }
    catch (e) {
      Cu.reportError(config.error);
    }
  },
  helpInfo : config.help
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.0 (Firefox 3.0).
 */
if (XPCOMUtils.generateNSGetFactory) {
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([drulenium]);
}
else {
  var NSGetModule = XPCOMUtils.generateNSGetModule([drulenium]);
}