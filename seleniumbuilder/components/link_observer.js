const Cc = Components.classes,
      Ci = Components.interfaces,
      Cu = Components.utils,
      Cr = Components.results,
      Ce = Components.Exception;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

/* Error log */
function jsdump(str) {
  Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
    .logStringMessage(str);
}

function HelloWorld() {
  this.wrappedJSObject = this;
}

HelloWorld.prototype = {
  classDescription: "My Hello World Javascript XPCOM Component",
  classID:          Components.ID("{9e8a2b30-ece9-44af-87cf-4f037befb727}"),
  contractID:       "@drulenium.org/linkobserver/general-startup;1",

  QueryInterface: function(aIID) {
    if(!aIID.equals(Ci.nsISupports) && !aIID.equals(Ci.nsIObserver) && !aIID.equals(Ci.nsISupportsWeakReference)) {
      throw Cr.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },
  _xpcom_categories: [{
    category: "profile-after-change",
  }],
  
  observe: function(aSubject, aTopic, aData) {
    switch(aTopic) {
    case "profile-after-change":
      http.initialize ();
      break;
    default:
      throw Ce("Unknown topic: " + aTopic);
    }
  }
};
var components = [HelloWorld];
if ("generateNSGetFactory" in XPCOMUtils) {
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);  // Firefox 4.0 and higher
}
else {
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);    // Firefox 3.x
}
  
/** HTTP Observer **/
var http = (function () {
  var cache = [];
  return {
    initialize: function () {
      Services.obs.addObserver(http.observer, "http-on-examine-response", false);
      Services.obs.addObserver(http.observer, "http-on-examine-cached-response", false);
    },
    destroy: function () {
      try {
        Services.obs.removeObserver(http.observer, "http-on-examine-response");
      }
      catch (e) {}
      try {
        Services.obs.removeObserver(http.observer, "http-on-examine-cached-response");
      }
      catch (e) {}
    },
    observer: {
      observe: function(aSubject, aTopic, aData) {
        var channel = aSubject.QueryInterface(Ci.nsIHttpChannel);
        if(channel.requestMethod != "GET") {
          return;
        }
        var request = aSubject.QueryInterface(Ci.nsIRequest);
        var url = request.name;
        var test = /(.*\.selenium)\b(.*)/.exec(url);
        if (test && test.length == 3 && !/noCheck/.test(url)) {
          var base = /baseURL=([^&]*)/.exec(url);
          base = (base && base.length == 2) ? base[1] : "";
          var auto = url.indexOf("auto=true") != -1 ? true : false;
          
          notify("Wait...", " Download in progress", "load.png");
          aSubject.cancel(Cr.NS_BINDING_ABORTED);

          var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
          jsdump(url);
          req.open('GET', test[1] + "?noCheck", true);  
          req.onreadystatechange = function (aEvt) {
            if (req.readyState == 4) {
              //active = true;
              if(req.status == 200) {
                var file = FileUtils.getFile("TmpD", ["data.selenium"]);
                var ostream = FileUtils.openSafeFileOutputStream(file)
                var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                                createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                converter.charset = "UTF-8";
                var istream = converter.convertToInputStream(req.responseText);
                NetUtil.asyncCopy(istream, ostream, function(status) {
                  if (!Components.isSuccessCode(status)) {
                    notify("Error...", "Problem writing data to disk", "alert.png");
                    return;
                  }
                  // Opening IDE
                  var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"]
                    .getService(Ci.nsIWindowWatcher);
                  var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                  var win = ww.openWindow(null, "chrome://selenium-ide/content/selenium-ide.xul",
                    "Selenium IDE", "chrome,centerscreen", null); 
                  // Wait for selenium IDE to load
                  var event = {
                    notify: function(timer) {
                      if (win.editor) {
                        win.editor.app.loadTestCaseWithNewSuite(file.path);
                        if (base) win.editor.app.setBaseURL(base);
                        if (auto) win.editor.playTestSuite();
                      }
                      else {
                        timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);
                      }
                    }
                  }
                  timer.initWithCallback(event, 100, Ci.nsITimer.TYPE_ONE_SHOT);
                });
              }
              else {
                notify("Error...", "Problem retrieving file", "alert.png"); 
              }
            } 
          };  
          req.send(null); 
        }
      }
    }
  }
})();

var notify = (function () {
  return function (title, text, image) {
    try {
      let alertServ = Cc["@mozilla.org/alerts-service;1"].
                      getService(Ci.nsIAlertsService);
      //In linux config.image does not work properly!
      alertServ.showAlertNotification("chrome://seleniumbuilder/skin/" + image, title, text);
    }
    catch(e) {
      let browser = windowutils.activeBrowserWindow.gBrowser,
          notificationBox = browser.getNotificationBox();

      notification = notificationBox.appendNotification(
        text, 
        'jetpack-notification-box',
        "chrome://seleniumbuilder/skin/" + image, 
        notificationBox.PRIORITY_INFO_MEDIUM, 
        []
      );
      timer.setTimeout(function() {
          notification.close();
      }, 3000);
    }
  }
})();
