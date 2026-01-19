document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  const createBtn = document.getElementById("createBtn");
  const joinBtn = document.getElementById("joinBtn");
  const joinId = document.getElementById("joinId");
  const playerNameInput = document.getElementById("playerName");
  const menu = document.getElementById("menu");
  const game = document.getElementById("game");
  const clipDiv = document.getElementById("clip-iframe");
  const choicesDiv = document.getElementById("choices");
  const scoreDiv = document.getElementById("score");
  const feedbackDiv = document.getElementById("round-feedback");
  const countdownDiv = document.getElementById("player-countdown");
  const playerInfoDiv = document.getElementById("playerInfo");

  let playerName = "";
  let sessionId = "";
  let playerId = "";
  let rankLogos = {};
  let ytPlayer;

  // --- Charger les logos ---
  fetch('rankLogos.json')
    .then(res => res.json())
    .then(data => rankLogos = data);

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
    playerId = data.playerId;
    menu.style.display = "none";
    game.style.display = "block";
    updatePlayerInfo(data.players);
    socket.emit("readyForGame", sessionId); // Préparer la partie
  });

  socket.on("playerJoined", data => {
    updatePlayerInfo(data.players || {});
  });

  socket.on("startClip", data => {
    feedbackDiv.innerHTML = "";
    countdownDiv.innerText = "Préparation...";
    choicesDiv.innerHTML = "";

    // Charger la vidéo en pause
    ytPlayer.loadVideoById({ videoId: extractVideoId(data.iframeUrl), startSeconds:0 });
    ytPlayer.pauseVideo();

    setTimeout(()=> ytPlayer.playVideo(), 1000); // Lancer après 1s

    // Créer les boutons rank
    for(let i=1;i<=9;i++){
      const btn = document.createElement("button");
      btn.classList.add("rank-btn");
      const img = document.createElement("img");
      img.src = rankLogos[i];
      img.alt = "Rank "+i;
      btn.appendChild(img);
      btn.onclick = () => {
        socket.emit("chooseRank",{sessionId, rank:i, playerId});
        btn.classList.add("chosen");
        feedbackDiv.innerHTML = "En attente de l'autre joueur...";
      };
      choicesDiv.appendChild(btn);
    }
  });

  socket.on("roundResult", data => {
    feedbackDiv.innerHTML = "";
    for(const pId in data.choices){
      const choice = data.choices[pId];
      const name = data.players[pId].name;
      const icon = rankLogos[choice];
      feedbackDiv.innerHTML += `<div>${name}: <img src="${icon}" width="50"/></div>`;
    }
    for(const pId in data.scores){
      const scoreEl = document.getElementById(`score-${pId}`);
      if(scoreEl) scoreEl.innerText = data.scores[pId];
    }
  });

  socket.on("gameOver", finalScores => {
    alert("Game terminé !\n" + JSON.stringify(finalScores, null, 2));
    location.reload();
  });

  socket.on("errorMsg", msg => alert(msg));

  function updatePlayerInfo(players){
    playerInfoDiv.innerHTML = "";
    for(const [id,p] of Object.entries(players)){
      playerInfoDiv.innerHTML += `<div>${p.name}: <span id="score-${id}">${p.score}</span></div>`;
    }
  }

  // --- YouTube IFrame API ---
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('clip-iframe', {
      height: '360',
      width: '640',
      videoId: '',
      playerVars: { 'controls': 1, 'rel': 0 }
    });
  };

  function extractVideoId(url){
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : "";
  }
});
