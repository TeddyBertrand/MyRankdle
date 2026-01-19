const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const clips = require("./clips.json");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let sessions = {};

io.on("connection", socket => {
  console.log("Nouveau joueur :", socket.id);

  // Créer une session
  socket.on("createSession", () => {
    const sessionId = Math.random().toString(36).substring(2, 8);
    sessions[sessionId] = { players: [socket.id], scores: {}, clipIndex: 0 };
    sessions[sessionId].scores[socket.id] = 0;
    socket.join(sessionId);
    socket.emit("sessionCreated", sessionId);
  });

  // Rejoindre une session
socket.on("joinSession", ({ sessionId, name }) => {
  if (!sessions[sessionId]) {
    socket.emit("errorMsg", "Session introuvable.");
    return;
  }
  if (!name) {
    socket.emit("errorMsg", "Pseudo invalide.");
    return;
  }

  sessions[sessionId].players[socket.id] = { name, score: 0 };
  socket.join(sessionId);

  // Envoyer info de la session au joueur qui vient de rejoindre
  socket.emit("sessionJoined", { sessionId, playerId: socket.id, players: sessions[sessionId].players });

  // Informer les autres joueurs
  socket.to(sessionId).emit("playerJoined", { playerId: socket.id, name });
});


  // Réception du choix du rang
  socket.on("chooseRank", ({ sessionId, rank }) => {
    const session = sessions[sessionId];
    if (!session) return;

    if (!session.choices) session.choices = {};
    session.choices[socket.id] = rank;

    // Vérifier si les deux joueurs ont choisi
    if (Object.keys(session.choices).length === 2) {
      // Calcul du score
      session.players.forEach(p => {
        const realRank = clips[session.clipIndex].rang;
        const diff = Math.abs(session.choices[p] - realRank);
        let score = 0;
        if (diff === 0) score = 1;
        else if (diff === 1) score = 0.5;
        else if (diff === 2) score = 0.25;
        session.scores[p] += score;
      });

      io.to(sessionId).emit("roundResult", {
        scores: session.scores,
        realRank: clips[session.clipIndex].rang
      });

      // Passer au clip suivant
      session.clipIndex++;
      session.choices = {};
      if (session.clipIndex < clips.length) {
        io.to(sessionId).emit("startClip", clips[session.clipIndex]);
      } else {
        io.to(sessionId).emit("gameOver", session.scores);
        delete sessions[sessionId];
      }
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log("Serveur lancé sur http://0.0.0.0:3000");
});
