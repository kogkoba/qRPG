// ======================= 1) 定数・グローバル変数 =======================

// 🔽 すでにAPIキーやdiscoveryDocsは不要なので削除済み
// もしAPI_KEYなどがまだ必要なら適宜追加してOK。
const GAS_URL = "https://script.google.com/macros/s/AKfycbwOcT2PzrIr6tlVfkQcrPYhz8d8AWz2tIi9XKQXqEVKDx9NikI6E94QDcjpbCQ4gODO/exec";

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
let battleStartHp = 50; // バトル開始時のHP

// BGM 関連
let isBgmPlaying = false;
let isBattleBgmPlaying = false;
let quizBgm = null;


// ======================= 2) データ取得: クイズ & モンスター =======================
// クイズデータをGASから取得
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

// モンスターデータをGASから取得
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
// (以下は元々のBGM管理ロジックをそのまま)
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
    playFieldBgm();
  } else {
    button.textContent = "🔇 BGM OFF";
    stopFieldBgm();
    stopBattleBgm();
    stopQuizBgm();
  }
  updateBgmButton();
}

function playFieldBgm() {
  if (!isBgmPlaying) return;
  const fieldBgm = document.getElementById("fieldBGM");
  fieldBgm.currentTime = 0;
  fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (!fieldBgm) return;
  fieldBgm.pause();
  fieldBgm.currentTime = 0;
}

function playBattleBgm() {
  if (!isBgmPlaying || isBattleBgmPlaying) return;
  const battleBgm = document.getElementById("battleBGM");
  battleBgm.currentTime = 0;
  battleBgm.play()
    .then(() => { isBattleBgmPlaying = true; })
    .catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (!battleBgm) return;
  battleBgm.pause();
  battleBgm.currentTime = 0;
  isBattleBgmPlaying = false;
}

function playQuizBgm() {
  if (!quizBgm) quizBgm = document.getElementById("quizBGM");
  if (!isBgmPlaying || !quizBgm.paused) return;
  quizBgm.currentTime = 0;
  quizBgm.play().catch(err => console.warn("クイズBGM再生エラー:", err));
}

function stopQuizBgm() {
  if (!quizBgm) return;
  quizBgm.pause();
  quizBgm.currentTime = 0;
}


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

function savePlayerData() {
  const params = new URLSearchParams();
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
// (戦闘ロジックは省略 or そのまま)
function showGameOverOptions() { /* ... */ }
function startBattleInitForRetry() { /* ... */ }
function retryBattle() { /* ... */ }
function restartFromChurch() { /* ... */ }


// ======================= 7) フィールド初期化・移動 =======================
function initGame() {
  // 必要なら初期位置を設定
  // player.x = 100; 
  // player.y = 100;
  updatePlayerPosition();
}

function startGame() {
  console.log("ゲーム開始！");

  // タイトル画面を非表示
  document.getElementById("titleScreen").style.display = "none";
  // ゲーム画面を表示
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";

  // フィールドBGMを再生
  playFieldBgm();

  // 初期化処理
  initGame();
  updatePlayerStatusUI();
}

function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  playerElement.style.left = player.x + "px";
  playerElement.style.top = player.y + "px";
  playerElement.style.transform = 
    "translate(-50%, -50%) " + (facingRight ? "scaleX(1)" : "scaleX(-1)");
}
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中は移動しない

  // 向きの変更
  if (dx < 0) facingRight = false;
  else if (dx > 0) facingRight = true;

  // プレイヤーの歩行アニメーション
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  document.getElementById("player").src = playerImages[currentImageIndex];

  // 新しい座標を計算
  player.x += dx;
  player.y += dy;

  // 画面外に出ないように制限
  const playerElement = document.getElementById("player");
  const pw = playerElement.offsetWidth;
  const ph = playerElement.offsetHeight;
  const gameArea = document.getElementById("gameArea");
  const maxX = gameArea.clientWidth - pw;
  const maxY = gameArea.clientHeight - ph;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > maxX) player.x = maxX;
  if (player.y > maxY) player.y = maxY;

  // プレイヤーの位置を更新
  updatePlayerPosition();

  // 歩数カウント & ランダムエンカウント判定
  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    startEncounter();
  }
}

  // 画面外に出ないよう制限
  const playerElement = document.getElementById("player");
  const pw = playerElement.offsetWidth;
  const ph = playerElement.offsetHeight;
  const maxX = window.innerWidth - pw;
  const maxY = document.getElementById("gameArea").clientHeight - ph;
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x > maxX) player.x = maxX;
  if (player.y > maxY) player.y = maxY;

  updatePlayerPosition();

  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    startEncounter();
  }
}

function getRandomEncounterThreshold() {
  return Math.floor(Math.random() * 11) + 5; // 5~15
}


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
  if (selected === quiz.correct) {
    addExp(20);
    playerData.g += 5;
    savePlayerData();
  } else {
    changeHp(-10);
    if (quiz.questionId) {
      recordMistake(playerData.name, quiz.questionId);
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


// ======================= 11) DOMContentLoaded：ログイン & スタートボタン登録 =======================
document.addEventListener("DOMContentLoaded", () => {
  // BGMをOFFから開始
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  isBgmPlaying = false;

  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";
  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;
  updateBgmButton();

  // ゲームスタートボタン
  const startBtn = document.getElementById("startButton");
  if (startBtn && !startBtn.dataset.bound) {
    startBtn.addEventListener("click", startGame);
    startBtn.dataset.bound = "true";
  }

  // ログインボタン
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

        // クイズ & モンスターをロード
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
});
