const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const SocketHandler = require('./src/server/SocketHandler');

// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(__dirname));

// Initialize socket handler
const socketHandler = new SocketHandler(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tron Game Server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR-WINDOWS-IP]:${PORT}`);
});