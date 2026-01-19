document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const createBtn = document.getElementById("createBtn");
  const joinBtn = document.getElementById("joinBtn");
  const joinId = document.getElementById("joinId");
  const playerNameInput = document.getElementById("playerName");
  const menu = document.getElementById("menu");
  const game = document.getElementById("game");

  let playerName = "";
  let sessionId = "";

  // --- Créer Partie ---
  createBtn.onclick = () => {
    const name = playerNameInput.value.trim();
    if(!name) { alert("Veuillez entrer un pseudo !"); return; }
    playerName = name;
    socket.emit("createSession", playerName);
  };

  // --- Rejoindre Partie ---
  joinBtn.onclick = () => {
    const name = playerNameInput.value.trim();
    const id = joinId.value.trim();
    if(!name) { alert("Veuillez entrer un pseudo !"); return; }
    if(!id) { alert("Veuillez entrer l'ID de session !"); return; }
    playerName = name;
    socket.emit("joinSession", { sessionId: id, name: playerName });
  };

  // --- Réception des events ---
  socket.on("sessionCreated", id => {
    sessionId = id;
    alert(`Session créée ! ID: ${id}`);
  });

  socket.on("sessionJoined", data => {
    sessionId = data.sessionId;
    menu.style.display = "none";
    game.style.display = "block";
    console.log("Rejoint la session", data);
  });

  socket.on("errorMsg", msg => alert(msg));
});
