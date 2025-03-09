/** *******************************************************
 *  1) 定数・グローバル変数
 *******************************************************  */

// GAS の API URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbwOcT2PzrIr6tlVfkQcrPYhz8d8AWz2tIi9XKQXqEVKDx9NikI6E94QDcjpbCQ4gODO/exec";

const STEP = 20;  // 移動距離

/** プレイヤーデータ */
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
/** クイズ & モンスターのデータ */
let quizData = [];
let monsterData = [];

/** フィールド上のプレイヤー情報 */
let player = { x: 0, y: 0, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

/** 戦闘 & クイズ関連 */
let inBattle = false;
let correctCount = 0;
let missCount = 0;
const MAX_CORRECT = 4;
const MAX_MISS = 4;
let lastEncounterSteps = 0;
let encounterThreshold = 5;

/** バトル開始時のHP */
let battleStartHp = 50;

/** BGM関連 */
let isBgmPlaying = false;
let isBattleBgmPlaying = false;
let quizBgm = null;


/*******************************************************
 *  2) クイズ・モンスター データ取得関連
 *******************************************************/

async function loadQuizData() {
  try {
    const params = new URLSearchParams({ mode: "quiz" });

    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) return console.warn("クイズデータ取得失敗:", json.error);

    quizData = json.quizzes || [];
    console.log("✅ Quiz Data:", quizData);

  } catch (err) {
    console.error("⛔ loadQuizData Error:", err);
  }
}

async function loadMonsterData() {
  try {
    const params = new URLSearchParams({ mode: "monster" });

    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!resp.ok) throw new Error("ネットワークエラー");
    const json = await resp.json();
    if (!json.success) return console.warn("モンスターデータ取得失敗:", json.error);

    monsterData = json.monsters || [];
    console.log("✅ Monster Data:", monsterData);

  } catch (err) {
    console.error("⛔ loadMonsterData Error:", err);
  }
}

/*******************************************************
 *  3) BGM関連
 *******************************************************/

function stopAllBgm() {
  stopFieldBgm();
  stopBattleBgm();
  stopGameOverBgm();
}

function playFieldBgm() {
  stopAllBgm();
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) {
    fieldBgm.pause();
    fieldBgm.currentTime = 0;
  }
}

function playBattleBgm() {
  stopFieldBgm();
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) battleBgm.play().catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) {
    battleBgm.pause();
    battleBgm.currentTime = 0;
  }
}

function playGameOverBgm() {
  stopBattleBgm();
  const gameOverBgm = document.getElementById("dqDownAudio");
  if (gameOverBgm) gameOverBgm.play().catch(err => console.warn("ゲームオーバーBGM再生エラー:", err));
}

function stopGameOverBgm() {
  const gameOverBgm = document.getElementById("dqDownAudio");
  if (gameOverBgm) {
    gameOverBgm.pause();
    gameOverBgm.currentTime = 0;
  }
}

/*******************************************************
 *  4) ゲームの流れ
 *******************************************************/

function startGame() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";
  
  playFieldBgm(); // フィールドBGM開始
  initGame();
}

function startBattle() {
  stopFieldBgm();
  playBattleBgm();
  
  document.getElementById("gameContainer").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
}

function endBattle() {
  stopBattleBgm();
  playFieldBgm();
  
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
}

function onGameOver() {
  stopBattleBgm();
  playGameOverBgm();
  
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "block";
}

function retryBattle() {
  stopGameOverBgm();
  startBattle();
}

function restartFromChurch() {
  stopGameOverBgm();
  playFieldBgm();
  
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
}

/*******************************************************
 *  5) ゲーム開始処理
 *******************************************************/

document.addEventListener("DOMContentLoaded", () => {
  playFieldBgm(); // 初期BGM開始

  document.getElementById("startButton").addEventListener("click", startGame);

  document.getElementById("loginButton").addEventListener("click", async () => {
    const enteredName = document.getElementById("playerNameInput").value.trim();
    if (!enteredName) {
      alert("名前を入力してください！");
      return;
    }
    
    try {
      showLoadingOverlay();

      const params = new URLSearchParams({ mode: "player", name: enteredName });
      const resp = await fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
      
      if (!resp.ok) throw new Error("ネットワークエラー");
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "不明なエラー");

      playerData = { ...data, hp: parseInt(data.hp, 10) || 50 };
      
      await loadQuizData();
      await loadMonsterData();

      hideLoadingOverlay();
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("titleScreen").style.display = "flex";

    } catch (err) {
      console.error("ログインエラー:", err);
      hideLoadingOverlay();
      alert("ログインエラーが発生しました。再度お試しください。");
    }
  });
});
