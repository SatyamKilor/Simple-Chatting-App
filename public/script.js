const socket = io();

const enterChatBtn = document.getElementById('enterChatBtn');
const homePage = document.getElementById('home');
const chatPage = document.getElementById('chat');
const userList = document.getElementById('userList');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messagesDiv = document.getElementById('messages');
const chatUserName = document.getElementById('chatUserName');

let currentUser = prompt("Enter your username:");
let users = {}; // To store users and their respective socket IDs
let activeChat = null; // Track the currently active chat
let chatHistory = {}; // Store the chat history for each user (username as key)

if (currentUser) {
  socket.emit('setUser', currentUser); // Inform the server about the user's name
}

enterChatBtn.addEventListener('click', () => {
  homePage.style.display = 'none';
  chatPage.style.display = 'flex';
});

socket.on('updateUserList', (onlineUsers) => {
  users = {}; // Reset users map each time the list is updated

  userList.innerHTML = '';
  onlineUsers.forEach((user) => {
    const li = document.createElement('li');
    li.textContent = user.name;
    li.addEventListener('click', () => startChat(user));
    userList.appendChild(li);

    // Store the socket ID and username in a map
    users[user.name] = user.id;
  });
});

function startChat(user) {
  if (activeChat === user.name) return; // Prevent reloading the same chat

  // Set the active chat
  activeChat = user.name;
  chatUserName.textContent = user.name;

  // Clear the previous messages
  messagesDiv.innerHTML = '';

  // Load the chat history for the selected user
  loadChatHistory(user.name);

  // Update the button's click listener to send messages to the correct user
  sendMessageBtn.onclick = () => sendMessage(user.name);
}

// Load the chat history for the selected user
function loadChatHistory(username) {
  if (chatHistory[username]) {
    chatHistory[username].forEach(message => {
      displayMessage(message.sender, message.message);
    });
  }
}

// Send message to a specific user
function sendMessage(username) {
  const message = messageInput.value;
  if (message.trim()) {
    const recipientSocketId = users[username]; // Get the recipient's socket ID
    if (recipientSocketId) {
      socket.emit('sendMessage', recipientSocketId, message); // Send the message to the selected user
      displayMessage('You', message); // Display the message on the sender's side

      // Save the message to chat history
      saveChatHistory(username, 'You', message);

      messageInput.value = ''; // Clear the input
    }
  }
}

socket.on('receiveMessage', (data) => {
  // Only display the message if it's from the active chat
  if (data.sender === activeChat || data.sender === 'You') {
    displayMessage(data.sender, data.message);

    // Save the received message to chat history
    saveChatHistory(activeChat, data.sender, data.message);
  }
});

// Function to display messages in the chat area
function displayMessage(sender, message) {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = `${sender}: ${message}`;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
}

// Save messages to chat history
function saveChatHistory(username, sender, message) {
  if (!chatHistory[username]) {
    chatHistory[username] = []; // Initialize the array if it doesn't exist
  }

  chatHistory[username].push({ sender, message }); // Save the message for the user
}
