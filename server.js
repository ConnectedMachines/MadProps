// ###############################
// REQUIRES
// ###############################
var cors = require('cors');
var ws = require('nodejs-websocket');
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// ###############################
// GLOBAL VARIABLES
// ###############################
var tesselConnected = false;
var tesselPreflightComplete = false;
var port = process.env.PORT || 8080;

// ###############################
// EXPRESS CONFIGURATION
// ###############################

app.use(cors());
app.use(express.static(__dirname));

// ###############################
// WEBSOCKETS SETUP - TO TESSEL
// ###############################

// This must match the web socket port on the Tessel side
var webSocketPort = 3000;
var webSocketServer = ws.createServer(function (conn) {
  console.log("Connected to Tessel");
  tesselConnected = true;
  // When the client closes the connection, notify us.
  // This is where there should be clean up of listeners
  conn.on("close", function (code, reason) {
    tesselConnected = false;
    console.log("Connection closed: ", code, reason);
  });
}).listen(webSocketPort);

console.log('Listening on port', webSocketPort,'for Tessel...');

var tesselToClientBridge = function (socket) {
  // When we get info back from the tessel websocket we want to let the client know
  webSocketServer.connections.forEach(function (conn) {
    conn.on('text', function (data) {
      console.log(data);
      socket.emit('droneData', data);
    });
  });
};

// ###############################
// HELPER FUNCTIONS
// ###############################

// Check to make sure that we have a connection before 
// trying to send that connection data
var tesselPreflight = function (callback) {
  console.log('inside preflight');
  setTimeout(function(){
    if (tesselConnected) {
  console.log('tesselConnected running');
      tesselPreflightComplete = true;
      webSocketServer.connections.forEach(function (conn) {
        conn.sendText('preflight');
      });
      callback();
    } else {
  console.log('tessel not connected');
      tesselPreflight(callback);
    }
  }, 250);
};

var tesselTakeoff = function (callback) {
  webSocketServer.connections.forEach(function (conn) {
    conn.sendText('takeoff');
  });
  callback();
};

var tesselLand = function (callback) {
  webSocketServer.connections.forEach(function (conn) {
    conn.sendText('land');
  });
  callback();
};

// ###############################
// ROUTING SETUP
// ###############################
app.get('/', function (req, res) {
  res.redirect('/client/');
});

io.on('connection', function (socket) {
  socket.emit('status', { status: 'Successfuly Connected' });
  socket.on('land', function (data) {
    tesselLand(function () {
      socket.emit('status', { status: 'Landing Command Recieved' });
    });
  });
  socket.on('preflight', function (data) {
    console.log(data);
    tesselPreflight(function () {
      socket.emit('status', { status: 'Preflight Command Recieved' });
    });
  });
  socket.on('takeoff', function (data) {
    tesselTakeoff(function () {
      socket.emit('status', { status: 'Takeoff Command Recieved' });
    });
  });
  tesselToClientBridge(socket);
});

// ###############################
// START LISTEINING
// ###############################

console.log('Client ready on port', port+'...');
server.listen(port);
