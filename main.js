var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var dialog = require('dialog');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var mainWindow = null;
var projectInfo = {};

app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({ width: 800, "min-width": 768, height: 480, "min-height": 100, frame: false, resizable: false, icon: './inc/img/iojs.png' });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the devtools.
  //mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  ipc.on('minimize', function() {
    mainWindow.minimize();
  })

  ipc.on('openFileDialogGYP', function(event, arg) {
    dialog.showOpenDialog(mainWindow, { filters: [{ name: 'GYP', extensions: ['gyp'] }], properties: ['openFile'] }, function(file) {
      if (!file) return;
      projectInfo.gypFile = file[0];
      projectInfo.packageFile = path.join(path.dirname(file[0]), 'package.json');

      fs.readFile(projectInfo.gypFile, function(err, data) {
        if (err)
          return event.sender.send('openFileDialogGYP_ret', 'Error reading ' + path.basename(projectInfo.gypFile));

        try {
          projectInfo.gypData = yaml.safeLoad(data);
        } catch (err) {
          return event.sender.send('openFileDialogGYP_ret', 'Error parsing ' + path.basename(projectInfo.gypFile));
        }

        fs.readFile(projectInfo.packageFile, function(err, data) {
          if (err)
            return event.sender.send('openFileDialogGYP_ret', 'Error reading ' + path.basename(projectInfo.packageFile));

          try {
            projectInfo.packageData = JSON.parse(data);
          } catch (err) {
            return event.sender.send('openFileDialogGYP_ret', 'Error parsing ' + path.basename(projectInfo.packageFile));
          }
          event.sender.send('openFileDialogGYP_ret', null, projectInfo.packageData);
        });
      });
    })
  });

  ipc.on('openFolderDialogNodePath', function(event, arg) {
    dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }, function(dir) {
      if (!dir) return;
      projectInfo.nodePath = dir[0];
      //TODO: Do some checks, read common.gypi
      event.sender.send('openFolderDialogNodePath_ret', null, projectInfo.nodePath);
    });
  });
});
