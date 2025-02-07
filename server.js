const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Keep track of users by their socket ID
let users = {}; // This will store socket IDs and usernames

app.use(express.static('public'));

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Set the user's username when they enter the chat
  socket.on('setUser', (username) => {
    users[socket.id] = username;
    // Emit the updated user list with usernames and their respective socket IDs
    io.emit('updateUserList', Object.entries(users).map(([id, name]) => ({ id, name })));
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id);
    delete users[socket.id];
    io.emit('updateUserList', Object.entries(users).map(([id, name]) => ({ id, name })));
  });

  // Handle sending a message from one user to another
  socket.on('sendMessage', (recipientSocketId, message) => {
    io.to(recipientSocketId).emit('receiveMessage', {
      sender: users[socket.id], 
      message: message,
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
