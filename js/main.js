/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";
const STEP = 20;

let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// マップが定義されている場合のサイズチェック（tileMap, tileMapVillage などは別途定義が必要）
if (typeof tileMap !== "undefined" && tileMap.length > 0) {
  const mapWidth = tileMap[0].length;
  const mapHeight = tileMap.length;
} else {
  console.error("❌ tileMap が未定義または空です！");
}

let player = { x: 0, y: 0, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

let inBattle = false;
let correctCount = 0;
let missCount = 0;
const MAX_CORRECT = 4;
const MAX_MISS = 4;
let lastEncounterSteps = 0;
let encounterThreshold = 5;
let battleStartHp = 50;
let battleStartG = null;  // 初回はnullで、最初の戦闘開始時に保存

let currentMap = null;  // "village" / "field" など

/*******************************************************
 *  2) データ取得（クイズ & モンスター）
 *******************************************************/
async function loadQuizData() {
  try {
    const params = new URLSearchParams();
    params.append("mode", "quiz");
    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) {
      console.warn("クイズデータ取得失敗:", json.error);
      return;
    }
    quizData = json.quizzes || [];
    console.log("✅ Quiz Data:", quizData);
  } catch (err) {
    console.error("⛔ loadQuizData Error:", err);
  }
}

async function loadMonsterData() {
  try {
    const params = new URLSearchParams();
    params.append("mode", "monster");
    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) {
      console.warn("モンスターデータ取得失敗:", json.error);
      return;
    }
    monsterData = json.monsters || [];
    console.log("✅ Monster Data:", monsterData);
  } catch (err) {
    console.error("⛔ loadMonsterData Error:", err);
  }
}

function getRandomQuiz() {
  if (!quizData || quizData.length === 0) return null;
  const idx = Math.floor(Math.random() * quizData.length);
  return quizData[idx];
}

function getRandomMonsters() {
  if (!monsterData || monsterData.length < 4) {
    console.warn("Not enough monsters");
    return [];
  }
  const shuffled = [...monsterData].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

/*******************************************************
 *  3) ローディングオーバーレイ
 *******************************************************/
function showLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

/*******************************************************
 *  4) BGM関連
 *******************************************************/
let isBgmPlaying = false;

function playCurrentBgm() {
  if (!isBgmPlaying) return;
  stopAllBgm();
  if (currentMap === "village") {
    playVillageBgm();
  } else if (currentMap === "field") {
    playFieldBgm();
  } else if (inBattle) {
    playBattleBgm();
  }
}

function stopAllBgm() {
  document.querySelectorAll("audio").forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function playVillageBgm() {
  if (!isBgmPlaying) return;
  const villageBgm = document.getElementById("villageBGM");
  if (villageBgm) villageBgm.play().catch(err => console.warn("村BGM再生エラー:", err));
}

function playFieldBgm() {
  if (!isBgmPlaying) return;
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function playBattleBgm() {
  if (!isBgmPlaying) return;
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) battleBgm.play().catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function playdownBGM() {
  if (!isBgmPlaying) return;
  const downBGM = document.getElementById("downBGM");
  if (downBGM) downBGM.play().catch(err => console.warn("ダウンBGM再生エラー:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) {
    bgmButton.addEventListener("click", toggleBgm);
  }
});
function updateBgmButton() {
  const button = document.getElementById("bgmToggleButton");
  if (!button) return;
  button.textContent = isBgmPlaying ? "🎵 BGM ON" : "🔇 BGM OFF";
}
function toggleBgm() {
  isBgmPlaying = !isBgmPlaying;
  const button = document.getElementById("bgmToggleButton");
  if (isBgmPlaying) {
    button.textContent = "🎵 BGM ON";
    playCurrentBgm();
  } else {
    button.textContent = "🔇 BGM OFF";
    stopAllBgm();
  }
  updateBgmButton();
}

/*******************************************************
 *  5) プレイヤーデータ周り
 *******************************************************/
function updatePlayerStatusUI() {
  const hpElem = document.getElementById("field-hp");
  if (hpElem) hpElem.textContent = playerData.hp;
  const lvlElem = document.getElementById("level");
  if (lvlElem) lvlElem.textContent = playerData.level;
  const gElem = document.getElementById("field-g");
  if (gElem) gElem.textContent = playerData.g;
}
function checkLevelUp() {
  while (playerData.exp >= 100 && playerData.level < 100) {
    playerData.exp -= 100;
    playerData.level++;
    playerData.g += 10;
    if (playerData.level === 100) {
      playerData.g += 500;
      playerData.exp = 0;
    }
    console.log(`🎉 レベルアップ！ レベル: ${playerData.level}`);
  }
}
function addExp(amount) {
  playerData.exp += amount;
  checkLevelUp();
  updatePlayerStatusUI();
  savePlayerData();
}
function savePlayerData() {
  const params = new URLSearchParams();
  params.append("mode", "updatePlayer");
  params.append("name", playerData.name);
  params.append("level", playerData.level);
  params.append("exp", playerData.exp);
  params.append("g", playerData.g);
  params.append("hp", playerData.hp);
  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      console.log("✅ プレイヤーデータ保存成功");
    } else {
      console.error("⛔ プレイヤーデータ保存エラー:", data.error || "不明なエラー");
    }
  })
  .catch(err => {
    console.error("⛔ ネットワークエラー:", err);
  });
}
function changeHp(amount) {
  playerData.hp += amount;
  if (playerData.hp < 0) playerData.hp = 0;
  if (playerData.hp > 50) playerData.hp = 50;
  updatePlayerStatusUI();
  updateBattleHp();
  savePlayerData();
  if (playerData.hp === 0) {
    console.log("💀 HPが0になりゲームオーバー！");
    showGameOverOptions();
  }
}

/*******************************************************
 *  6) ゲーム開始処理
 *******************************************************/
function startGame() {
  console.log("🎮 ゲーム開始！");
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";
  initGame();
  currentMap = null;
  switchMap("village");
  player.x = 7;
  player.y = 7;
  updatePlayerPosition();
  updatePlayerStatusUI();
}
function initGame() {
  updatePlayerPosition();
  updatePlayerStatusUI();
}
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;
  playerElement.style.left = `${player.x}px`;
  playerElement.style.top = `${player.y}px`;
  playerElement.style.transform =
    `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
}

/*******************************************************
 *  7) マップ切り替え処理
 *******************************************************/
function switchMap(newMap) {
  if (newMap === "village") {
    if (typeof tileMapVillage !== "undefined") {
      console.log("✅ 村のマップデータ:", tileMapVillage);
      currentMap = "village";
      tileMap = tileMapVillage; // 村のタイルマップを設定
    } else {
      console.error("❌ tileMapVillage が定義されていません！");
      return;
    }
    // 村用のプレイヤー初期位置（例）
    player.x = 7;
    player.y = 13;
    stopFieldBgm();
    playVillageBgm();
  } else if (newMap === "field") {
    if (typeof tileMapField !== "undefined") {
      console.log("✅ フィールドのマップデータ:", tileMapField);
      currentMap = "field";
      tileMap = tileMapField; // フィールドのタイルマップを設定
    } else {
      console.error("❌ tileMapField が定義されていません！");
      return;
    }
    // フィールド用のプレイヤー初期位置（例）
    player.x = 10;
    player.y = 10;
    stopVillageBgm();
    playFieldBgm();
  }
  // マップの再描画
  drawMap();
  updatePlayerPosition();
}

/*******************************************************
 *  8) プレイヤー移動
 *******************************************************/
function movePlayer(dx, dy) {
  if (inBattle) return;
  facingRight = (dx >= 0);
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const playerElement = document.getElementById("player");
  if (playerElement) playerElement.src = playerImages[currentImageIndex];
  let newX = player.x + dx;
  let newY = player.y + dy;
  const mapWidth = tileMap[0].length;
  const mapHeight = tileMap.length;
  if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
    console.warn("🚧 これ以上進めません");
    return;
  }
  player.x = newX;
  player.y = newY;
  updatePlayerPosition();
  checkMapTransition();
  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    console.log("⚔ モンスターがあらわれた！");
    startEncounter();
    lastEncounterSteps = player.steps;
  }
}

/*******************************************************
 *  フィールド初期化・マップ描画
 *******************************************************/
function drawMap() {
  console.log("🗺 マップを描画 (デバッグ)");
  const mapContainer = document.getElementById("mapContainer");
  if (!mapContainer) {
    console.error("❌ mapContainer の要素が見つかりません！");
    return;
  }
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
 *  8) 戦闘 (＝クイズ)
 *******************************************************/
function startEncounter() {
  if (inBattle) return;
  console.log("📖 クイズバトル開始！");
  inBattle = true;
  stopFieldBgm();
  playQuizBgm();
  battleStartHp = playerData.hp;
  if (battleStartG === null) {
    battleStartG = playerData.g;
  }
  showQuiz();
}
function updateBattleHp() {
  const battleHpElem = document.getElementById("battle-hp");
  if (battleHpElem) {
    battleHpElem.textContent = playerData.hp;
  }
}

/*******************************************************
 *  9) クイズ出題・解答処理
 *******************************************************/
function showQuiz() {
  console.log("📖 クイズを出題！");
  const quiz = getRandomQuiz();
  if (!quiz) {
    console.error("⛔ クイズデータがありません");
    endBattle();
    return;
  }
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
function disableChoiceButtons() {
  const buttons = document.getElementById("choice-area").getElementsByTagName("button");
  for (const btn of buttons) {
    btn.disabled = true;
  }
}
function answerQuiz(selected, quiz) {
  disableChoiceButtons();
  if (selected === quiz.correct) {
    console.log("⭕ 正解！");
    addExp(20);
    playerData.g += 5;
    savePlayerData();
    setTimeout(endBattle, 1000);
  } else {
    console.log("❌ 不正解！");
    changeHp(-10);
    if (quiz.questionId) {
      recordMistake(playerData.name, quiz.questionId);
    }
    if (playerData.hp <= 0) {
      setTimeout(showGameOverOptions, 1000);
    } else {
      setTimeout(endBattle, 1000);
    }
  }
}
function recordMistake(playerName, questionId) {
  const params = new URLSearchParams();
  params.append("mode", "recordMistake");
  params.append("name", playerName);
  params.append("questionId", questionId);
  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      console.log(`✅ 間違い記録更新: ${playerName} - QID ${questionId}`);
    } else {
      console.error("⛔ 記録エラー:", data.error || "不明なエラー");
    }
  })
  .catch(error => {
    console.error("⛔ ネットワークエラー:", error);
  });
}

/*******************************************************
 *  6) ゲームオーバー・再挑戦
 *******************************************************/
function showGameOverOptions() {
  console.log("💀 ゲームオーバー！選択肢を表示");
  inBattle = false;
  stopQuizBgm();
  const topText = document.getElementById("top-text-box");
  topText.textContent = "💀 ゲームオーバー！";
  const choiceArea = document.getElementById("choice-area");
  choiceArea.innerHTML = "";
  const churchButton = document.createElement("button");
  churchButton.textContent = "🏥 教会へ戻る";
  churchButton.onclick = restartFromChurch;
  choiceArea.appendChild(churchButton);
  const retryButton = document.createElement("button");
  retryButton.textContent = "🔄 クイズをやり直す";
  retryButton.onclick = retryBattle;
  choiceArea.appendChild(retryButton);
}
function restartFromChurch() {
  console.log("⛪ 教会へ戻る (Gが半分になり、村の教会からスタート)");
  playerData.g = Math.floor(playerData.g / 2);
  playerData.hp = 50;
  player.x = 100;
  player.y = 150;
  savePlayerData();
  updatePlayerStatusUI();
  updatePlayerPosition();
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  stopQuizBgm();
  playFieldBgm();
}
function retryBattle() {
  console.log("🔄 クイズをやり直す (開始時の状態にリセット)");
  playerData.hp = battleStartHp;
  if (battleStartG !== null) playerData.g = battleStartG;
  savePlayerData();
  updatePlayerStatusUI();
  showQuiz();
}

/*******************************************************
 *  11) DOMContentLoaded：ログイン & イベント登録
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  stopVillageBgm();
  isBgmPlaying = false;
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) {
    bgmButton.textContent = "🔇 BGM OFF";
  }
  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;
  updateBgmButton();
  
  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }
  
  const loginBtn = document.getElementById("loginButton");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const enteredName = document.getElementById("playerNameInput").value.trim();
      if (!enteredName) {
        alert("名前を入力してください！");
        return;
      }
      try {
        showLoadingOverlay();
        const params = new URLSearchParams();
        params.append("mode", "player");
        params.append("name", enteredName);
        const resp = await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        });
        if (!resp.ok) throw new Error("ネットワークエラーです");
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || "不明なエラー");
        console.log("データ取得成功:", data);
        playerData.name  = data.name;
        playerData.level = parseInt(data.level, 10);
        playerData.exp   = parseInt(data.exp, 10);
        playerData.g     = parseInt(data.g, 10);
        playerData.hp    = parseInt(data.hp, 10) || 50;
        updatePlayerStatusUI();
        await loadQuizData();
        await loadMonsterData();
        setTimeout(() => {
          hideLoadingOverlay();
          document.getElementById("loginScreen").style.display = "none";
          document.getElementById("titleScreen").style.display = "flex";
        }, 500);
      } catch (err) {
        console.error("ログインエラー:", err);
        hideLoadingOverlay();
        alert("ログインエラーが発生しました。再度お試しください。");
      }
    });
  }
  
  const upBtn = document.getElementById("dpad-up");
  const downBtn = document.getElementById("dpad-down");
  const leftBtn = document.getElementById("dpad-left");
  const rightBtn = document.getElementById("dpad-right");
  if (upBtn) upBtn.addEventListener("click", () => movePlayer(0, -STEP));
  if (downBtn) downBtn.addEventListener("click", () => movePlayer(0, STEP));
  if (leftBtn) leftBtn.addEventListener("click", () => movePlayer(-STEP, 0));
  if (rightBtn) rightBtn.addEventListener("click", () => movePlayer(STEP, 0));
  
  document.addEventListener("keydown", (event) => {
    if (event.key && typeof event.key === "string") {
      if (event.key.toLowerCase() === "w") movePlayer(0, -STEP);
      else if (event.key.toLowerCase() === "s") movePlayer(0, STEP);
      else if (event.key.toLowerCase() === "a") movePlayer(-STEP, 0);
      else if (event.key.toLowerCase() === "d") movePlayer(STEP, 0);
    }
  });
  
  // マップ描画（必要なら）
  drawMap();
});