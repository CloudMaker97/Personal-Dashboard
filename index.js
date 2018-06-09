const fritz = require('fritzbox.js');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var ical = require('node-ical');
var Settings = require('./Settings');

// Settings
moment.locale("de");

// Dashboard-Routes
app.get('/', function(req, res){
  res.sendFile(__dirname + '/website/index.htm');
});
app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/website/style.css');
});
app.get('/script.js', function(req, res){
  res.sendFile(__dirname + '/website/script.js');
});

http.listen(61517, function(){
  console.log('Der Webserver wurde gestartet');
});

// Funktionen
function UpdateActiveModules() {
  var Modules = {
    CallMonitor: Settings.Modules.CallMonitor.IsActivated,
    FinTS_HCBI: Settings.Modules.FinTS_HCBI.IsActivated,
    GoogleCal: Settings.Modules.GoogleCal.IsActivated
  }

  return Modules;
}

function GetNextEvents() {
  ical.fromURL(Settings.Modules.GoogleCal.Url_ICS, {}, function(err, data) {
    return data;
  });
}

function GetKontoUmsatz() {
  var FinTSClient = require("open-fin-ts-js-client");
  var F_TSClient = new FinTSClient(Settings.Modules.FinTS_HCBI.Authentification.mBLZ, Settings.Modules.FinTS_HCBI.Authentification.mUser, Settings.Modules.FinTS_HCBI.Authentification.mPassword, Settings.Modules.FinTS_HCBI.Interfaces);

  F_TSClient.EstablishConnection(function(error){
      if(error){
          console.log("Fehler beim Verbindungsaufbau: "+error);
      }else{
          console.log("Erfolgreich mit HCBI Interface verbunden");
          F_TSClient.MsgGetSaldo(F_TSClient.konten[2].sepa_data,function(error,recvMsg,saldo){
              if(error) {
                  console.log("Fehler beim Laden der Umsätze: "+error);
              } else {

                  F_TSClient.MsgEndDialog(function(error,recvMsg2){
                      F_TSClient.closeSecure();
                  });

                  io.emit('UpdateKontenDaten', saldo);
              }
          });
      }
  });
}

function CurrentDateAndTime() {
  return {
      day: moment().format('dddd'),
      date: moment().format('L'),
      time: moment().format('LTS')
  };
}

if(Settings.Modules.CallMonitor.IsActivated) {
  var FritzMonitor = new fritz.CallMonitor(Settings.FritzBox);
  FritzMonitor.on('inbound', (call) => {
    io.emit('OnIncomingCall', call);
  })

  FritzMonitor.on('error', (error) => {
    console.log(error);
  })
}

// Socket.IO
io.on('connection', function(socket) {
  // Modulauswahl
  socket.emit('UpdateModules', UpdateActiveModules());

  // Lade Umsatz bei Seitenaufruf
  if(Settings.Modules.FinTS_HCBI.IsActivated) {
    GetKontoUmsatz();
  }

  // Aktualisiere Dashboard-Zeit
  setInterval(function(){
      io.emit('UpdateDateAndTime', CurrentDateAndTime());
  }, 1000);

  // Wähle Rufnummer bei Auswahl vor
  socket.on('FritzDialNumber', function(data) {
    console.log("Dialing number");
    let callNumber = fritz.dialNumber(data, Settings.FritzBox)
  })
});

// Aktualisiere Kontostand (HCBI)
if(Settings.Modules.FinTS_HCBI.IsActivated) {
  setInterval(function() {
    GetKontoUmsatz();
  }, 30000);
}

// Aktualisiere letzte Anrufe für alle
setInterval(function(){
  fritz.getCalls(Settings.FritzBox).then((callHistory) => {
    io.emit('UpdateCallHistory', callHistory);
  })
}, 2000);
