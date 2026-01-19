const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const sessions = {};
const clips = [
  "https://www.youtube.com/embed/_oZyikeIEls",
  "https://www.youtube.com/embed/Gs_ONuZhbd0",
  "https://www.youtube.com/embed/zQQJvllEDds"
]; // Exemple

function generateId() { return Math.random().toString(36).substr(2,6); }

io.on("connection", socket => {
  console.log("Nouveau joueur connecté", socket.id);

  socket.on("createSession", name => {
    const id = generateId();
    sessions[id] = {
      players: { [socket.id]: { name, score: 0 } },
      currentClip: 0,
      choices: {}
    };
    socket.join(id);
    socket.emit("sessionCreated", id);
  });

  socket.on("joinSession", ({ sessionId, name }) => {
    if(!sessions[sessionId]) { socket.emit("errorMsg","Session introuvable"); return; }
    sessions[sessionId].players[socket.id] = { name, score: 0 };
    socket.join(sessionId);
    socket.emit("sessionJoined", { sessionId, playerId: socket.id, players: sessions[sessionId].players });
    socket.to(sessionId).emit("playerJoined", { players: sessions[sessionId].players });
  });

  socket.on("readyForGame", sessionId => {
    const session = sessions[sessionId];
    if(Object.keys(session.players).length === 2){
      startClip(sessionId);
    }
  });

  socket.on("chooseRank", ({ sessionId, rank, playerId }) => {
    const session = sessions[sessionId];
    session.choices[playerId] = rank;

    if(Object.keys(session.choices).length === 2){
      // Calcul score simple : +1 pour chaque bon choix, ici juste exemple
      for(const pid in session.players){
        session.players[pid].score += 1;
      }
      io.to(sessionId).emit("roundResult", { choices: session.choices, scores: session.players, players: session.players });
      session.choices = {};
      session.currentClip++;
      if(session.currentClip < clips.length){
        setTimeout(()=> startClip(sessionId), 3000); // Pause 3s avant le prochain clip
      } else {
        io.to(sessionId).emit("gameOver", session.players);
      }
    }
  });
});

function startClip(sessionId){
  const session = sessions[sessionId];
  const clipUrl = clips[session.currentClip];
  io.to(sessionId).emit("startClip", { iframeUrl: clipUrl });
}

http.listen(PORT, () => console.log("Serveur lancé sur http://localhost:"+PORT));
