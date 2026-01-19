const socket = io();

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const joinId = document.getElementById("joinId");
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const iframe = document.getElementById("clip-iframe");
const choicesDiv = document.getElementById("choices");
const scoreDiv = document.getElementById("score");

let sessionId;
let rankLogos = {};

// Charger le JSON des logos
fetch('rankLogos.json')
  .then(res => res.json())
  .then(data => rankLogos = data)
  .catch(err => console.error("Erreur chargement rankLogos:", err));

createBtn.onclick = () => socket.emit("createSession");
joinBtn.onclick = () => {
  sessionId = joinId.value.trim();
  if (sessionId) socket.emit("joinSession", sessionId);
};

socket.on("sessionCreated", id => {
  sessionId = id;
  alert("Session créée ! ID: " + id);
});

socket.on("startClip", data => {
  menu.style.display = "none";
  game.style.display = "block";
  iframe.src = data.iframeUrl;

  // Création des boutons avec logos
  choicesDiv.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.classList.add("rank-btn");

    const img = document.createElement("img");
    img.src = rankLogos[i];
    img.alt = "Rank " + i;
    img.width = 80;
    img.height = 80;

    btn.appendChild(img);

    btn.onclick = () => {
      socket.emit("chooseRank", { sessionId, rank: i });
      choicesDiv.innerHTML = "En attente de l'autre joueur...";
    };

    choicesDiv.appendChild(btn);
  }
});

socket.on("roundResult", data => {
  scoreDiv.innerHTML = "Scores : <br>";
  for (let p in data.scores) {
    scoreDiv.innerHTML += `${p}: ${data.scores[p]} <br>`;
  }
  scoreDiv.innerHTML += `Rang réel : ${data.realRank}`;
});

socket.on("gameOver", finalScores => {
  alert("Game Over !\n" + JSON.stringify(finalScores, null, 2));
  location.reload();
});

socket.on("errorMsg", msg => alert(msg));
