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

let sessionId;
let playerName;
let rankLogos = {};
let playerId;
let playerData = {};
let playerCount = 0;

// Charger les logos
fetch('rankLogos.json')
  .then(res => res.json())
  .then(data => rankLogos = data);

// --- Création / Rejoindre ---
createBtn.onclick = () => {
  playerName = playerNameInput.value.trim() || "Joueur";
  socket.emit("createSession", playerName);
};

joinBtn.onclick = () => {
  const name = playerNameInput.value.trim();
  const id = joinId.value.trim();

  if (!name) {
    alert("Veuillez entrer un pseudo !");
    return;
  }
  if (!id) {
    alert("Veuillez entrer l'ID de session !");
    return;
  }

  playerName = name;

  socket.emit("joinSession", { sessionId: id, name: playerName });
};


// --- Socket.io ---
socket.on("sessionCreated", id => {
  sessionId = id;
  alert(`Session créée ! ID: ${id}`);
});

socket.on("sessionJoined", data => {
  sessionId = data.sessionId;
  playerId = data.playerId;
  playerData = data.players;
  menu.style.display = "none";
  game.style.display = "block";
  updatePlayerInfo();
});

// --- Joueurs et scores ---
function updatePlayerInfo() {
  playerInfoDiv.innerHTML = "";
  for(const p of Object.values(playerData)) {
    playerInfoDiv.innerHTML += `<div>${p.name}: <span id="score-${p.id}">0</span></div>`;
  }
}

// --- YouTube IFrame API ---
let ytPlayer;
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('clip-iframe', {
    height: '360',
    width: '640',
    videoId: '',
    playerVars: { 'controls': 1, 'rel': 0 }
  });
}

// --- Nouveau clip ---
socket.on("startClip", data => {
  feedbackDiv.innerHTML = "";
  countdownDiv.innerText = "Préparation...";
  choicesDiv.innerHTML = "";

  // Charger la vidéo en pause
  ytPlayer.loadVideoById({ videoId: extractVideoId(data.iframeUrl), startSeconds:0 });
  ytPlayer.pauseVideo();

  // Après 1s, lancer pour synchronisation
  setTimeout(()=> ytPlayer.playVideo(), 1000);

  // Créer boutons logos
  for(let i=1;i<=9;i++){
    const btn = document.createElement("button");
    btn.classList.add("rank-btn");
    const img = document.createElement("img");
    img.src = rankLogos[i];
    img.alt = "Rank "+i;
    btn.appendChild(img);
    btn.onclick = () => {
      socket.emit("chooseRank",{sessionId, rank:i});
      btn.classList.add("chosen");
      feedbackDiv.innerHTML = "En attente de l'autre joueur...";
    };
    choicesDiv.appendChild(btn);
  }
});

// --- Résultat du round ---
socket.on("roundResult", data => {
  feedbackDiv.innerHTML = "";
  for(const pId in data.choices){
    const choice = data.choices[pId];
    const name = data.players[pId].name;
    const icon = rankLogos[choice];
    feedbackDiv.innerHTML += `<div>${name}: <img src="${icon}" width="50"/></div>`;
  }
  for(const pId in data.scores){
    document.getElementById(`score-${pId}`).innerText = data.scores[pId];
  }
});

// --- Game over ---
socket.on("gameOver", finalScores => {
  alert("Game terminé !\n" + JSON.stringify(finalScores, null, 2));
  location.reload();
});

// --- Helper ---
function extractVideoId(url){
  const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}
