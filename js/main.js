// ======================= 1) 定数・グローバル変数 =======================

// 🔽 すでにAPIキーやdiscoveryDocsは使わないため削除
// const API_KEY = "..."; 
// const QUIZ_SHEET_ID = "...";
// const MONSTER_SHEET_ID = "...";

// 🔽 GAS_PERSONAL_URL は個人ミス記録用のものがあるなら、そのまま or 統合
// もし1つのGASにまとめるなら recordMistake も同じ GAS_URL で使うと良い
const GAS_URL = "https://script.google.com/macros/s/AKfycbzOcSUqWYxKorgWkveD3dRznc7V6SbqivpBFpdn2nD3sXr1NKkq6zW4AQSjjFotNWp8xQ/exec"; 

const STEP = 20;

let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];
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
let battleStartHp = 50; // バトル開始時のHPを記録

// BGM 関連
let isBgmPlaying = false;
let isBattleBgmPlaying = false;
let quizBgm = null;

// ======================= 2) データ取得: クイズ & モンスター =======================

// クイズデータをGASから取得
async function loadQuizData() {
  try {
    const params = new URLSearchParams();
    params.append("mode", "quiz"); // 🔹 modeをPOSTで送信

    const resp = await fetch(GAS_URL, {
      method: "POST",  // ✅ GET → POST に変更
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) {
      console.warn("クイズデータ取得失敗:", json.error);
      return;
    }
    quizData = json.quizzes || []; // 🔹 JSONキーを正しく指定
    console.log("✅ Quiz Data:", quizData);
  } catch (err) {
    console.error("⛔ loadQuizData Error:", err);
  }
}

async function loadMonsterData() {
  try {
    const params = new URLSearchParams();
    params.append("mode", "monster"); // 🔹 modeをPOSTで送信

    const resp = await fetch(GAS_URL, {
      method: "POST",  // ✅ GET → POST に変更
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) {
      console.warn("モンスターデータ取得失敗:", json.error);
      return;
    }
    monsterData = json.monsterData || []; // 🔹 JSONキーを正しく指定
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

// ======================= 3) ローディングオーバーレイ =======================
function showLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

// ======================= 4) BGM 関連 =======================
// (以下は従来通り、変更不要)
function updateBgmButton() { /* ... */ }
function toggleBgm() { /* ... */ }
function playFieldBgm() { /* ... */ }
function stopFieldBgm() { /* ... */ }
function playBattleBgm() { /* ... */ }
function stopBattleBgm() { /* ... */ }
function playQuizBgm() { /* ... */ }
function stopQuizBgm() { /* ... */ }

// ======================= 5) プレイヤーデータ周り =======================
function updatePlayerStatusUI() {
  document.getElementById("field-hp").textContent = playerData.hp;
  document.getElementById("level").textContent = playerData.level;
  const fieldGElement = document.getElementById("field-g");
  if (fieldGElement) {
    fieldGElement.textContent = playerData.g;
  }
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
    console.log(`🎉 レベルアップ！現在のレベル: ${playerData.level}`);
  }
}

function addExp(amount) {
  playerData.exp += amount;
  checkLevelUp();
  updatePlayerStatusUI();
  savePlayerData();
}

// ★プレイヤーデータをGASに保存
function savePlayerData() {
  const params = new URLSearchParams();
  // POSTで updatePlayer モードを呼ぶ想定
  params.append("mode", "updatePlayer");
  params.append("name",  playerData.name);
  params.append("level", playerData.level);
  params.append("exp",   playerData.exp);
  params.append("g",     playerData.g);
  params.append("hp",    playerData.hp);

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
  .catch(error => {
    console.error("⛔ ネットワークエラー:", error);
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
    showGameOverOptions();
  }
}

// ======================= 6) ゲームオーバー・再挑戦 =======================
// (以下の戦闘ロジックは基本そのままでOK)
function showGameOverOptions() { /* ... */ }
function startBattleInitForRetry() { /* ... */ }
function retryBattle() { /* ... */ }
function restartFromChurch() { /* ... */ }

// ======================= 7) フィールド初期化・移動 =======================
function initGame() { /* ... */ }
function startGame() { /* ... */ }
function updatePlayerPosition() { /* ... */ }
function movePlayer(dx, dy) { /* ... */ }
function getRandomEncounterThreshold() { /* ... */ }

// ======================= 8) 戦闘関連 =======================
function startEncounter() { /* ... */ }
function startBattleInit() { /* ... */ }
function updateBattleHp() { /* ... */ }
function showMonsters(monsters) { /* ... */ }
function shakeGameScreen() { /* ... */ }
function shakeAndRemoveMonster() { /* ... */ }

// ======================= 9) クイズ出題・解答処理 =======================
function showQuiz() { /* ... */ }
function disableChoiceButtons() { /* ... */ }
function answerQuiz(selected, quiz) {
  /* ... (変わらず) ... */
  if (selected === quiz.correct) {
    // 正解
    addExp(20);
    playerData.g += 5;
    savePlayerData();
  } else {
    // 不正解
    changeHp(-10);
    if (quiz.questionId) {
      recordMistake(playerData.name, quiz.questionId);
    }
  }
  /* ... */
}

// ★ミス記録
function function recordMistake(playerName, questionId) {
  const params = new URLSearchParams();
  params.append("mode", "recordMistake");
  params.append("name", playerName); // ✅ "player" → "name" に統一
  params.append("questionId", questionId);

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      console.log(`✅ ${playerName} の間違い記録を更新: 問題 ${questionId}`);
    } else {
      console.error("⛔ 記録エラー:", data.error || "不明なエラー");
    }
  })
  .catch(error => {
    console.error("⛔ ネットワークエラー:", error);
  });
}


// ======================= 10) 戦闘終了関数 =======================
function onZaoriku() { /* ... */ }
function endBattle() { /* ... */ }

// ======================= 11) DOMContentLoaded：ログイン処理 =======================
document.addEventListener("DOMContentLoaded", () => {
  // BGM オフから開始
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  isBgmPlaying = false;
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";
  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;
  updateBgmButton();

// ログインボタンのイベント
const loginBtn = document.getElementById("loginButton");
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
      method: "POST",  // ✅ GET → POST に変更
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

    // ✅ クイズ & モンスターをロードする処理を追加！
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

