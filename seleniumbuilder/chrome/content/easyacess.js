(function () {
  var config = {
    name: "drulenium_software", //Application name
    extension: "selenium" //Extension to support
  }
  
  Cu.import("resource://gre/modules/FileUtils.jsm");
  
  /* Error log */
  function jsdump(str) {
    Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService)
      .logStringMessage(str);
  }
  /* Registering file extension */
  var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
  prefs = prefs.getBranch("extensions.seleniumbuilder.");

  /*
  REG.EXE adds new keys and values to the Registry. You can add a value to:
    1. An existing key,
    2. A new key with no values
    3. Create a new key and a value beneath it.

  REG ADD KeyName [/v ValueName | /ve] [/t Type] [/s Separator] [/d Data] [/f]

  */
  var register = (function () {
    var file = FileUtils.getFile("WinD", ["system32", "reg.exe"]),
        process = Cc["@mozilla.org/process/util;1"]
          .createInstance(Ci.nsIProcess);
          
    process.init(file);
    return function (key, value) {
      var args = ["ADD", key, "/ve", "/f", "/t", "REG_EXPAND_SZ", "/d", value];
      process.run(true, args, args.length);
    }
  })();

  if (!prefs.getBoolPref ("extensionAccess")) {
    var firefox = (function () {  //Firefox.exe path
      var file = FileUtils.getFile("CurProcD", [""]).parent;
      file.append("firefox.exe");
      return file.path;
    })();

    register("HKEY_CURRENT_USER\\Software\\Classes\\" + config.name + "\\shell\\open\\command", '"' + firefox + '" -drulenium "%1"');
    register("HKEY_CURRENT_USER\\Software\\Classes\\." + config.extension, config.name);
    
    prefs.setBoolPref ("extensionAccess", true);
  }
})();