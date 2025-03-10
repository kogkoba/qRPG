/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/
// 例：最新のGAS URL。適切なものに置き換えてください
const GAS_URL = "https://script.google.com/macros/s/---YOUR_SCRIPT_ID---/exec";

// 移動距離
const STEP = 20;

// プレイヤーデータ
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// マップ (village / field) が読み込まれている想定
// もし tileMap が undefined ならエラーを出す
if (typeof tileMap !== "undefined" && tileMap.length > 0) {
  const mapWidth = tileMap[0].length;
  const mapHeight = tileMap.length;
} else {
  console.error("❌ tileMap が未定義または空です！");
}

// フィールド上のプレイヤー情報
let player = { x: 0, y: 0, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

// 戦闘状態管理
let inBattle = false;
let correctCount = 0;
let missCount = 0;
const MAX_CORRECT = 4;
const MAX_MISS = 4;
let lastEncounterSteps = 0;
let encounterThreshold = 5; // 何歩ごとにエンカウントするか

// バトル開始時に保存するHPとG
let battleStartHp = 50; // HPの初期値
let battleStartG  = null; // Gの初期値は null で管理

// 現在のマップ (village / field)
let currentMap = null;

/*******************************************************
 *  2) データ取得（クイズ & モンスター）
 *******************************************************/
/** クイズデータをGASから取得 */
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

/** モンスターデータをGASから取得 */
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

/** クイズをランダムで1問取得 */
function getRandomQuiz() {
  if (!quizData || quizData.length === 0) return null;
  const idx = Math.floor(Math.random() * quizData.length);
  return quizData[idx];
}

/** モンスターをランダムに4体取得 */
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
let isBgmPlaying = false; // BGMの状態を管理するフラグ

// 現在のマップに応じたBGMを再生する関数
function playCurrentBgm() {
  if (!isBgmPlaying) return;
  stopAllBgm(); // すべてのBGMを停止

  if (currentMap === "village") {
    playVillageBgm();
  } else if (currentMap === "field") {
    playFieldBgm();
  } else if (inBattle) {
    playBattleBgm();
  }
}

// すべてのBGMを停止する関数
function stopAllBgm() {
  document.querySelectorAll("audio").forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}
function playVillageBgm() { /* ...村BGM再生... */ }
function playFieldBgm()   { /* ...フィールドBGM再生... */ }
function playwinBGM()     { /* ...勝利BGM再生... */ }
function playBattleBgm()  { /* ...戦闘BGM再生... */ }
function playdownBGM()    { /* ...ダウンBGM再生... */ }

// BGMスイッチをセットアップ (DOMContentLoaded内でもOKだが、分けていても可)
document.addEventListener("DOMContentLoaded", () => {
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) {
    bgmButton.addEventListener("click", toggleBgm);
  }
});

/** BGMボタンの表示を更新 */
function updateBgmButton() {
  const button = document.getElementById("bgmToggleButton");
  if (!button) return;
  butto











/**

/*******************************************************
 * 1) 定数・グローバル変数
 *******************************************************/

// 例：最新のGAS URL。適切なものに置き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";

// 移動距離
const STEP = 20;

// プレイヤーデータ・クイズ・モンスター
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// タイルマップ（tileMap は現在選択中のマップとなる）
let tileMap = null;  // switchMap で tileMapVillage または tileMapField をセット
// ※外部ファイル tilemap_village.js, tilemap_field.js により定義される

// フィールド上のプレイヤー情報
let player = { x: 0, y: 0, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

// 戦闘状態管理
let inBattle = false;
let correctCount = 0;
let missCount = 0;
const MAX_CORRECT = 4;
const MAX_MISS = 4;
let lastEncounterSteps = 0;
let encounterThreshold = 5; // 何歩ごとにエンカウントするか
let battleStartHp = 50;   // 戦闘開始時のHP
let battleStartG = 0;     // 戦闘開始時のゴールド

// 現在のマップ ("village" / "field" / "battle")
let currentMap = null;

/*******************************************************
 * 2) データ取得（クイズ & モンスター）
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
 * 3) ローディングオーバーレイ
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
 * 4) BGM関連
 *******************************************************/
let isBgmPlaying = false;

function playCurrentBgm() {
  if (!isBgmPlaying) return;
  stopAllBgm();
  if (currentMap === "village") {
    playVillageBgm();
  } else if (currentMap === "field") {
    playFieldBgm();
  } else if (currentMap === "battle") {
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

function playQuizBgm() {
  const quizBgm = document.getElementById("quizBGM");
  if (!isBgmPlaying || !quizBgm) return;
  quizBgm.currentTime = 0;
  quizBgm.play().catch(err => console.warn("クイズBGM再生エラー:", err));
}

function stopVillageBgm() {
  const villageBgm = document.getElementById("villageBGM");
  if (villageBgm) { villageBgm.pause(); villageBgm.currentTime = 0; }
}

function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) { fieldBgm.pause(); fieldBgm.currentTime = 0; }
}

function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) { battleBgm.pause(); battleBgm.currentTime = 0; }
}

function stopQuizBgm() {
  const quizBgm = document.getElementById("quizBGM");
  if (quizBgm) { quizBgm.pause(); quizBgm.currentTime = 0; }
}

/** BGMのON/OFFを切り替える関数 */
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

function updateBgmButton() {
  const button = document.getElementById("bgmToggleButton");
  if (!button) return;
  button.textContent = isBgmPlaying ? "🎵 BGM ON" : "🔇 BGM OFF";
}

/*******************************************************
 * 5) プレイヤーデータ周り
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
 * 6) ゲーム開始処理
 *******************************************************/
function startGame() {
  console.log("🎮 ゲーム開始！");

  // タイトル画面を非表示にして、ゲーム画面を表示
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";

  // プレイヤーの初期化
  initGame();

  // 村から開始（マップ切り替え）
  currentMap = null; // 念のためリセット
  switchMap("village");

  // 村の中央に配置（例）
  player.x = 7;
  player.y = 7;
  updatePlayerPosition();

  // ステータス更新
  updatePlayerStatusUI();
}

/*******************************************************
 * 7) マップ切り替え処理
 *******************************************************/
function switchMap(newMap) {
  if (newMap === "village") {
    if (typeof tileMapVillage !== "undefined") {
      console.log("✅ 村のマップデータ:", tileMapVillage);
      currentMap = "village";
      tileMap = tileMapVillage;
    } else {
      console.error("❌ tileMapVillage が定義されていません！");
      return;
    }
    // 村の入口（例）に配置
    player.x = 7;
    player.y = 13;
    stopFieldBgm();
    playVillageBgm();
  } else if (newMap === "field") {
    if (typeof tileMapField !== "undefined") {
      console.log("✅ フィールドのマップデータ:", tileMapField);
      currentMap = "field";
      tileMap = tileMapField;
    } else {
      console.error("❌ tileMapField が定義されていません！");
      return;
    }
    // フィールドの入口（例）に配置
    player.x = 7;
    player.y = 0;
    stopVillageBgm();
    playFieldBgm();
  }
  // マップ描画とプレイヤー位置更新
  drawMap();
  updatePlayerPosition();
}

/*******************************************************
 * 8) マップ遷移のチェック
 *******************************************************/
function checkMapTransition() {
  if (currentMap === "village" && player.x === 7 && player.y === 0) {
    console.log("🚪 村からフィールドへ移動");
    switchMap("field");
  } else if (currentMap === "field" && player.x === 7 && player.y === 14) {
    console.log("🏠 フィールドから村へ移動");
    switchMap("village");
  }
}

/*******************************************************
 * 9) プレイヤー移動
 *******************************************************/
function movePlayer(dx, dy) {
  if (inBattle) return;

  // 向き変更
  facingRight = (dx >= 0);
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const playerElement = document.getElementById("player");
  if (playerElement) playerElement.src = playerImages[currentImageIndex];

  // 新しい座標計算
  let newX = player.x + dx;
  let newY = player.y + dy;

  // 範囲チェック（tileMap を利用）
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
 *  フィールド初期化
 *******************************************************/
function initGame() {
  updatePlayerPosition();
  updatePlayerStatusUI();
}

/** プレイヤー位置更新 */
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;
  playerElement.style.left = `${player.x}px`;
  playerElement.style.top = `${player.y}px`;
  playerElement.style.transform = `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
}

/*******************************************************
 * 10) タイルマップ描画
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
      tile.className = `tile tile-${tileMap[y][x]}`; // CSSで各タイルの見た目を設定
      tile.style.left = `${x * 32}px`;
      tile.style.top = `${y * 32}px`;
      mapContainer.appendChild(tile);
    }
  }
}

/*******************************************************
 * 11) 戦闘（＝クイズ）処理
 *******************************************************/
function startEncounter() {
  if (inBattle) return;
  console.log("📖 クイズバトル開始！");
  inBattle = true;

  stopFieldBgm();
  playQuizBgm();

  // 戦闘開始時のプレイヤーデータを保存
  battleStartHp = playerData.hp;
  if (typeof battleStartG === "undefined" || battleStartG === null) {
    battleStartG = playerData.g;
  }

  showQuiz();
}

function updateBattleHp() {
  const battleHpElem = document.getElementById("battle-hp");
  if (battleHpElem) battleHpElem.textContent = playerData.hp;
}

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

function endBattle() {
  console.log("✅ クイズバトル終了");
  inBattle = false;
  stopQuizBgm();
  playFieldBgm();
  updatePlayerStatusUI();
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
}

/*******************************************************
 * 12) ゲームオーバー・再挑戦
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
  if (battleStartG !== null) {
    playerData.g = battleStartG;
  }
  savePlayerData();
  updatePlayerStatusUI();
  showQuiz();
}

/*******************************************************
 * 13) DOMContentLoaded：イベント登録
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // BGM初期化
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  stopVillageBgm();
  isBgmPlaying = false;
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";
  const quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;
  updateBgmButton();

  // スタートボタンのイベント登録
  const startBtn = document.getElementById("startButton");
  if (startBtn) startBtn.addEventListener("click", startGame);

  // ログインボタンのイベント登録
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

  // D-Pad イベント登録（HTML側でID "dpad-up", "dpad-down", etc. がある前提）
  const upBtn = document.getElementById("dpad-up");
  const downBtn = document.getElementById("dpad-down");
  const leftBtn = document.getElementById("dpad-left");
  const rightBtn = document.getElementById("dpad-right");
  if (upBtn) upBtn.addEventListener("click", () => movePlayer(0, -STEP));
  if (downBtn) downBtn.addEventListener("click", () => movePlayer(0, STEP));
  if (leftBtn) leftBtn.addEventListener("click", () => movePlayer(-STEP, 0));
  if (rightBtn) rightBtn.addEventListener("click", () => movePlayer(STEP, 0));

  // キーボード操作（WASDまたは矢印キー）
  document.addEventListener("keydown", (e) => {
  // もし全キーで e.preventDefault() していたらNG
  // 必要なキーだけ阻止するよう修正
});

    if (event.key && typeof event.key === "string") {
      const key = event.key.toLowerCase();
      if (key === "w") movePlayer(0, -STEP);
      else if (key === "s") movePlayer(0, STEP);
      else if (key === "a") movePlayer(-STEP, 0);
      else if (key === "d") movePlayer(STEP, 0);
    }
  });
});

/*******************************************************
 * 14) タイルマップ描画（drawMap）
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

*/
