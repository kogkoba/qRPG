/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/

// GASのURL（適切なものに変更してください）
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";

// プレイヤー移動距離
const STEP = 20;

// プレイヤーデータ・クイズ・モンスター
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// タイルマップ
let tileMap = null;  // 現在のマップ（村・フィールドを切り替え）
let currentMap = null; // "village" または "field"

// プレイヤー情報
let player = { x: 7, y: 7, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

// 戦闘状態管理
let inBattle = false;
let lastEncounterSteps = 0;
let encounterThreshold = 5;
let battleStartHp = 50;
let battleStartG = 0;

/*******************************************************
 *  2) データ取得（クイズ & モンスター）
 *******************************************************/

// クイズデータ取得
async function loadQuizData() {
  try {
    const params = new URLSearchParams({ mode: "quiz" });
    const resp = await fetch(GAS_URL, { method: "POST", body: params });
    const json = await resp.json();
    quizData = json.quizzes || [];
    console.log("✅ Quiz Data:", quizData);
  } catch (err) {
    console.error("⛔ loadQuizData Error:", err);
  }
}

// モンスターデータ取得
async function loadMonsterData() {
  try {
    const params = new URLSearchParams({ mode: "monster" });
    const resp = await fetch(GAS_URL, { method: "POST", body: params });
    const json = await resp.json();
    monsterData = json.monsters || [];
    console.log("✅ Monster Data:", monsterData);
  } catch (err) {
    console.error("⛔ loadMonsterData Error:", err);
  }
}

/*******************************************************
 *  3) ゲーム開始・マップ遷移
 *******************************************************/

// ゲーム開始
function startGame() {
  console.log("🎮 ゲーム開始！");
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  currentMap = null;
  switchMap("village");
}

// マップ切り替え
function switchMap(newMap) {
  if (newMap === "village") {
    tileMap = tileMapVillage;
    player.x = 7;
    player.y = 13;
    stopAllBgm();
    playVillageBgm();
  } else if (newMap === "field") {
    tileMap = tileMapField;
    player.x = 7;
    player.y = 0;
    stopAllBgm();
    playFieldBgm();
  }
  currentMap = newMap;
  drawMap();
  updatePlayerPosition();
}

// マップ描画
function drawMap() {
  const mapContainer = document.getElementById("mapContainer");
  mapContainer.innerHTML = "";
  for (let y = 0; y < tileMap.length; y++) {
    for (let x = 0; x < tileMap[y].length; x++) {
      const tile = document.createElement("div");
      tile.className = `tile tile-${tileMap[y][x]}`;
      tile.style.left = `${x * 32}px`;
      tile.style.top = `${y * 32}px`;
      mapContainer.appendChild(tile);
    }
  }
}

/*******************************************************
 *  4) プレイヤー移動
 *******************************************************/

// プレイヤー移動
function movePlayer(dx, dy) {
  if (inBattle) return;
  facingRight = dx >= 0;
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  document.getElementById("player").src = playerImages[currentImageIndex];

  let newX = player.x + dx;
  let newY = player.y + dy;
  if (tileMap[newY]?.[newX] !== undefined) {
    player.x = newX;
    player.y = newY;
    updatePlayerPosition();
  }

  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    startEncounter();
    lastEncounterSteps = player.steps;
  }
}

// プレイヤー位置更新
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  playerElement.style.left = `${player.x * 32}px`;
  playerElement.style.top = `${player.y * 32}px`;
  playerElement.style.transform = facingRight ? "scaleX(1)" : "scaleX(-1)";
}

/*******************************************************
 *  5) 戦闘（クイズ）
 *******************************************************/

// 戦闘開始
function startEncounter() {
  if (inBattle) return;
  inBattle = true;
  stopAllBgm();
  playBattleBgm();
  showQuiz();
}

// クイズ表示
function showQuiz() {
  const quiz = quizData[Math.floor(Math.random() * quizData.length)];
  document.getElementById("top-text-box").textContent = quiz.question;
  const choiceArea = document.getElementById("choice-area");
  choiceArea.innerHTML = "";
  quiz.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => answerQuiz(index, quiz);
    choiceArea.appendChild(btn);
  });
}

// クイズ解答処理
function answerQuiz(selected, quiz) {
  if (selected === quiz.correct) {
    playerData.exp += 20;
    playerData.g += 5;
    setTimeout(endBattle, 1000);
  } else {
    playerData.hp -= 10;
    if (playerData.hp <= 0) {
      setTimeout(showGameOver, 1000);
    } else {
      setTimeout(endBattle, 1000);
    }
  }
}

// 戦闘終了
function endBattle() {
  inBattle = false;
  stopAllBgm();
  playFieldBgm();
}

// ゲームオーバー
function showGameOver() {
  console.log("💀 ゲームオーバー！");
}

/*******************************************************
 *  6) BGM管理
 *******************************************************/

function stopAllBgm() {
  document.querySelectorAll("audio").forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function playVillageBgm() {
  document.getElementById("villageBGM").play();
}

function playFieldBgm() {
  document.getElementById("fieldBGM").play();
}

function playBattleBgm() {
  document.getElementById("battleBGM").play();
}
