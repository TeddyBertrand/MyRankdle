const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const sessions = {};

function generateId() {
  return Math.random().toString(36).substr(2,6);
}

io.on("connection", socket => {
  console.log("Nouveau joueur connecté", socket.id);

  socket.on("createSession", name => {
    const id = generateId();
    sessions[id] = { players: { [socket.id]: { name, score: 0 } } };
    socket.join(id);
    socket.emit("sessionCreated", id);
    console.log("Session créée:", id, name);
  });

  socket.on("joinSession", ({ sessionId, name }) => {
    if(!sessions[sessionId]) { socket.emit("errorMsg","Session introuvable"); return; }
    sessions[sessionId].players[socket.id] = { name, score: 0 };
    socket.join(sessionId);
    socket.emit("sessionJoined", { sessionId, playerId: socket.id, players: sessions[sessionId].players });
    console.log("Joueur rejoint:", name, sessionId);
  });
});

http.listen(PORT, () => console.log("Serveur lancé sur http://localhost:"+PORT));
