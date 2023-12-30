const express = require("express");
const app = express();
const port = 3000;
const routes = require("./routes"); // Importing the router from routes.js
const server = require("./server"); // This will be the new file for starting the server

// General request logging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static("public"));

app.use(routes); // Using the routes defined in routes.js

// Placeholder for additional middleware and configurations

server.start(app, port); // Moved the server start logic to server.js