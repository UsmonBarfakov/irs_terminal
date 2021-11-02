const { app, BrowserWindow } = require('electron');
const path = require('path');

//подкключаем JQuery
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

//подключаем electron-virtual-keyboard

const CCNet = require('cashcode-bv');

let device = new CCNet.CCNet.BillValidator('COM3', true);
let counter = 0;
async function init (webContent) {
  /*  */
  device.on('status', function (status) {
    console.log('on:status', status);
  });
  device.on('power-up', function () {
    console.log('on:power-up');
  });

  /*  */
  device.on('power-up-with-bill', function () {
    console.log('on:power-up-with-bill');
  });

  /*  */
  device.on('power-up-with-bill-in-stacker', function () {
    console.log('on:power-up-with-bill-in-stacker');
  });

  /* ----------------------------------------------------------------------- */

  /*  */
  device.on('initialize', function () {
    console.log('on:initialize');
  });

  /*  */
  device.on('disabled', function () {
    console.log('on:disabled');
  });

  /*  */
  device.on('holding', function () {
    console.log('on:holding');
  });

  /* ----------------------------------------------------------------------- */

  /*  */
  device.on('cassette-full', function () {
    console.log('on:cassette-full');
  });

  /*  */
  device.on('cassette-out-of-position', function () {
    console.log('on:cassette-out-of-position');
  });

  /* ----------------------------------------------------------------------- */

  /*  */
  device.on('jammed', function () {
    console.log('on:jammed');
  });

  /*  */
  device.on('cassette-jammed', function () {
    console.log('on:cassette-jammed');
  });

  /*  */
  device.on('cheated', function () {
    console.log('on:cheated');
  });

  /*  */
  device.on('pause', function () {
    console.log('on:pause');
  });

  /* ----------------------------------------------------------------------- */

  /*  */
  device.on('idling', async function () {
    /*  */
    console.log('on:idling');

    /*  */
    if (counter >= 5) {
      await device.end();

      setTimeout(async function () {
        counter = 0;
        await device.begin();
      }, (60 * 1000) * 5);
    }
  });

  /*  */
  device.on('accepting', function () {
    console.log('on:accepting');
  });

  /*  */
  device.on('escrow', async function (bill) {
    /*  */
    console.log('on:escrow:', bill);

    if (bill.amount == 50) {
      /*  */
      await device.retrieve();
    } else {
      /*  */
      await device.stack();

      /*  */
      counter++;
    }
  });

  /*  */
  device.on('stacking', function () {
    console.log('on:stacking');
  });

  /*  */
  device.on('stacked', function (bill) {
    console.log('on:stacked:', bill);
    console.log('amount:', bill.amount);
    webContent.send('amount_from_bill_validator', bill.amount);
  });

  /*  */
  device.on('returning', function () {
    console.log('on:returning');
  });

  /*  */
  device.on('returned', function (bill) {
    console.log('on:returned:', bill);
  });

  /* ----------------------------------------------------------------------- */

  /*  */
  await device.connect();

  /* ----------------------------------------------------------------------- */

  console.log(device.info);
  console.log(device.billTable);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  init(mainWindow.webContents)
      .then(function () {
        mainWindow.webContents.send('statusCCNet', 'Ok')
      })
      .catch(function (error) {
        mainWindow.webContents.send('statusCCNet', error);
      });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

};

let ipcMain = require('electron').ipcMain;

ipcMain.on('commandFromRender', function (event, data){
  switch (data) {
    case 'begin':
      console.log(device.begin());
      event.sender.send('replyFromMain', 'please, insert amount');
      break;
    case 'end': //todo integrate printer for print ticket
      console.log(device.end());
      event.sender.send('replyFromMain', 'Thank you!!!');
      break;
    case 'closeWindow':
      console.log(device.end());
      app.quit();
      break;
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
