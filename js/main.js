/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/
// 例：GAS の公開URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";


// 移動距離
const STEP = 20;

// プレイヤーデータ、クイズ、モンスターデータ
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];      // ← ログイン時に一度だけ取得
let monsterData = [];   // ← 同上

// タイルマップ関連
let tileMap = null;     // switchMap で tileMapVillage or tileMapField をセット
let currentMap = null;  // "village" / "field"

// プレイヤーのフィールド上ステータス
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
let battleStartG = null; // 戦闘開始時のGを保存する
// （正解数や不正解数などは必要に応じて別途管理）

/*******************************************************
 *  2) クイズ & モンスターデータ取得
 *******************************************************/
/** クイズデータをGASから一度だけ取得 */
async function loadQuizData() {
  if (quizData.length > 0) {
    console.log("⚠️ クイズデータは既に取得済みです。再取得しません。");
    return;
  }
  try {
    console.log("🔄 クイズデータを取得中...");
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
    console.log("✅ クイズデータ取得成功:", quizData.length, "件");
  } catch (err) {
    console.error("⛔ loadQuizData Error:", err);
  }
}

async function loadMonsterData() {
  if (monsterData.length > 0) {
    console.log("⚠️ モンスターデータは既に取得済みです。再取得しません。");
    return;
  }
  try {
    console.log("🔄 モンスターデータを取得中...");
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
    console.log("✅ モンスターデータ取得成功:", monsterData.length, "件");
  } catch (err) {
    console.error("⛔ loadMonsterData Error:", err);
  }
}
/** ランダムにクイズ1問を取得 */
function getRandomQuiz() {
  if (!quizData || quizData.length === 0) return null;
  const idx = Math.floor(Math.random() * quizData.length);
  return quizData[idx];
}

/** ランダムにモンスター4体を取得 */
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
  const message = document.getElementById("loadingMessage");
  if (overlay && message) {
    message.textContent = "ロード中…";
    overlay.style.display = "flex"; // しっかり表示する
  } else {
    console.error("❌ ローディング要素が見つかりません");
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.display = "none"; // しっかり隠す
  }
}

/*******************************************************
 *  4) BGM関連
 *******************************************************/
let isBgmPlaying = false;

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

function playCurrentBgm() {
  if (!isBgmPlaying) return;
  stopAllBgm();

  // currentMap の状態によってBGMを切り替える
  if (currentMap === "village") {
    playVillageBgm();
  } else if (currentMap === "field") {
    playFieldBgm();
  } else if (inBattle) {
    playBattleBgm();
  }
}

/** すべてのBGMを停止 */
function stopAllBgm() {
  document.querySelectorAll("audio").forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/** 各BGM再生/停止 */
function playVillageBgm() {
  if (!isBgmPlaying) return;
  const villageBgm = document.getElementById("villageBGM");
  if (villageBgm) villageBgm.play().catch(err => console.warn("村BGM再生エラー:", err));
}

function stopVillageBgm() {
  const villageBgm = document.getElementById("villageBGM");
  if (villageBgm) { villageBgm.pause(); villageBgm.currentTime = 0; }
}

function playFieldBgm() {
  if (!isBgmPlaying) return;
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) { fieldBgm.pause(); fieldBgm.currentTime = 0; }
}

function playBattleBgm() {
  if (!isBgmPlaying) return;
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) battleBgm.play().catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) { battleBgm.pause(); battleBgm.currentTime = 0; }
}

function playQuizBgm() {
  if (!isBgmPlaying) return;
  const quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.play().catch(err => console.warn("クイズBGM再生エラー:", err));
}

function stopQuizBgm() {
  const quizBgm = document.getElementById("quizBGM");
  if (quizBgm) { quizBgm.pause(); quizBgm.currentTime = 0; }
}

/*******************************************************
 *  5) プレイヤーデータ周り
 *******************************************************/
function updatePlayerStatusUI() {
  document.getElementById("field-hp").textContent = playerData.hp;
  document.getElementById("level").textContent   = playerData.level;
  document.getElementById("field-g").textContent = playerData.g;
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

/** プレイヤーデータをGASへ保存 */
function savePlayerData() {
  const params = new URLSearchParams();
  params.append("mode",  "updatePlayer");
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
      console.error("⛔ プレイヤーデータ保存エラー:", data.error);
    }
  })
  .catch(err => {
    console.error("⛔ ネットワークエラー:", err);
  });
}

function changeHp(amount) {
  playerData.hp += amount;
  if (playerData.hp < 0)   playerData.hp = 0;
  if (playerData.hp > 50)  playerData.hp = 50;
  updatePlayerStatusUI();
  updateBattleHp();
  savePlayerData();

  // HP0 → ゲームオーバー
  if (playerData.hp === 0) {
    console.log("💀 HPが0になりゲームオーバー");
    showGameOverOptions();
  }
}

/*******************************************************
 *  6) ゲーム開始
 *******************************************************/
function startGame() {
  console.log("🎮 ゲーム開始！");
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";

  // フィールド初期化
  initGame();

  // 村マップへ
  currentMap = null;
  switchMap("village");

  // 村の中央に配置 (例)
  player.x = 7;
  player.y = 7;
  updatePlayerPosition();

  // ステータス表示
  updatePlayerStatusUI();
}

/*******************************************************
 *  7) マップ切り替え
 *******************************************************/
function switchMap(newMap) {
  if (newMap === "village") {
    if (typeof tileMapVillage !== "undefined") {
      tileMap = tileMapVillage;
      currentMap = "village";
      console.log("✅ 村マップ読み込み");
    } else {
      console.error("❌ tileMapVillage が定義されていません");
      return;
    }
    // 入口座標 (例)
    player.x = 7;
    player.y = 13;
    stopFieldBgm();
    playVillageBgm();
  } else if (newMap === "field") {
    if (typeof tileMapField !== "undefined") {
      tileMap = tileMapField;
      currentMap = "field";
      console.log("✅ フィールドマップ読み込み");
    } else {
      console.error("❌ tileMapField が定義されていません");
      return;
    }
    // 入口座標 (例)
    player.x = 7;
    player.y = 0;
    stopVillageBgm();
    playFieldBgm();
  }
  drawMap();
  updatePlayerPosition();
}

/*******************************************************
 *  8) マップ遷移のチェック
 *******************************************************/
function checkMapTransition() {
  if (currentMap === "village" && player.x === 7 && player.y === 0) {
    console.log("🚪 村→フィールド");
    switchMap("field");
  } else if (currentMap === "field" && player.x === 7 && player.y === 14) {
    console.log("🏠 フィールド→村");
    switchMap("village");
  }
}

/*******************************************************
 *  9) プレイヤー移動
 *******************************************************/
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中は移動不可

  // 向き & 歩行アニメ
  facingRight = (dx >= 0);
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const pElem = document.getElementById("player");
  if (pElem) pElem.src = playerImages[currentImageIndex];

  // 新座標
  const newX = player.x + dx;
  const newY = player.y + dy;
  const mapWidth  = tileMap[0].length;
  const mapHeight = tileMap.length;
  if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
    console.warn("🚧 これ以上進めません");
    return;
  }

  player.x = newX;
  player.y = newY;
  updatePlayerPosition();
  checkMapTransition();

  // 歩数カウント & エンカウント
  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    console.log("⚔ 敵出現");
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

/** プレイヤー位置をCSSに反映 (32px刻み) */
function updatePlayerPosition() {
  const pElem = document.getElementById("player");
  if (!pElem) return;
  pElem.style.left = (player.x * 32) + "px";
  pElem.style.top  = (player.y * 32) + "px";
  pElem.style.transform =
    `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
}

/*******************************************************
 *  10) タイルマップ描画
 *******************************************************/
function drawMap() {
  const mapContainer = document.getElementById("mapContainer");
  if (!mapContainer) {
    console.error("❌ #mapContainer が見つかりません");
    return;
  }
  mapContainer.innerHTML = "";
  for (let y = 0; y < tileMap.length; y++) {
    for (let x = 0; x < tileMap[y].length; x++) {
      const tile = document.createElement("div");
      tile.className = `tile tile-${tileMap[y][x]}`;
      tile.style.left = `${x * 32}px`;
      tile.style.top  = `${y * 32}px`;
      mapContainer.appendChild(tile);
    }
  }
}

/*******************************************************
 * 11) 戦闘(=クイズ)処理
 *******************************************************/
function startEncounter() {
  if (inBattle) return;
  console.log("📖 クイズバトル開始");
  inBattle = true;
  currentMap = "battle"; // BGM切り替え用

  stopFieldBgm();
  playQuizBgm();

  // 戦闘開始時のHPとGを保存
  battleStartHp = playerData.hp;
  if (battleStartG === null) {
    battleStartG = playerData.g;
  }

  showQuiz();
}

function updateBattleHp() {
  const battleHpElem = document.getElementById("battle-hp");
  if (battleHpElem) battleHpElem.textContent = playerData.hp;
}

function showQuiz() {
  console.log("📖 クイズを出題");
  const quiz = getRandomQuiz();
  if (!quiz) {
    console.warn("⛔ クイズデータが空");
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
  const btns = document.getElementById("choice-area").getElementsByTagName("button");
  for (const b of btns) {
    b.disabled = true;
  }
}

function answerQuiz(selected, quiz) {
  disableChoiceButtons();
  if (selected === quiz.correct) {
    console.log("⭕ 正解");
    addExp(20);
    playerData.g += 5;
    savePlayerData();
    setTimeout(endBattle, 1000);
  } else {
    console.log("❌ 不正解");
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
  params.append("mode",       "recordMistake");
  params.append("name",       playerName);
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
      console.error("⛔ 記録エラー:", data.error);
    }
  })
  .catch(err => {
    console.error("⛔ ネットワークエラー:", err);
  });
}

function endBattle() {
  console.log("✅ クイズバトル終了");
  inBattle = false;
  currentMap = "field"; // BGM切り替え用
  stopQuizBgm();
  playFieldBgm();

  // 戦闘画面を閉じてフィールドへ戻す
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  updatePlayerStatusUI();
}

/*******************************************************
 * 12) ゲームオーバー・再挑戦
 *******************************************************/
function showGameOverOptions() {
  console.log("💀 ゲームオーバー！");
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
  console.log("⛪ 教会へ戻る (Gが半分, HP全回復)");
  playerData.g  = Math.max(0, Math.floor(playerData.g / 2));
  playerData.hp = 50;

  // 教会座標(例)
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
  console.log("🔄 クイズ再挑戦 (開始時に戻す)");
  playerData.hp = battleStartHp;
  if (battleStartG !== null) {
    playerData.g = battleStartG;
  }
  savePlayerData();
  updatePlayerStatusUI();

  // クイズを再表示
  showQuiz();
}

/*******************************************************
 * 13) DOMContentLoaded：ログイン時に一度だけデータ取得
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 DOM が読み込まれました！"); // ← 確認用

  const loginBtn = document.getElementById("loginButton");
  console.log("🔎 loginButton:", loginBtn); // ← ボタンが取得できているか確認

  if (!loginBtn) {
    console.error("❌ ログインボタンが見つかりません");
    return;
  }

  loginBtn.disabled = false;  // 念のため有効化

function showLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  const message = document.getElementById("loadingMessage");

  console.log("🔎 showLoadingOverlay() が呼ばれました");
  console.log("🔎 overlay:", overlay);
  console.log("🔎 message:", message);

  if (overlay && message) {
    message.textContent = "ロード中…";
    overlay.style.display = "flex"; // ✅ これでしっかり表示
  } else {
    console.error("❌ ローディングオーバーレイが見つかりません！");
  }
}
      // プレイヤーデータの取得
      const params = new URLSearchParams();
      params.append("mode", "player");
      params.append("name", enteredName);

      const resp = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });

      if (!resp.ok) throw new Error("ネットワークエラー");
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "不明なエラー");

      // 取得データをセット
      playerData.name  = data.name;
      playerData.level = parseInt(data.level, 10);
      playerData.exp   = parseInt(data.exp, 10);
      playerData.g     = parseInt(data.g, 10);
      playerData.hp    = parseInt(data.hp, 10) || 50;
      updatePlayerStatusUI();

      console.log("✅ プレイヤーデータ取得成功:", playerData);

      // クイズデータ取得
      if (loadingMessage) loadingMessage.textContent = "クイズデータを取得中…";
      await loadQuizData();

      // モンスターデータ取得
      if (loadingMessage) loadingMessage.textContent = "モンスターデータを取得中…";
      await loadMonsterData();

      setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.display = "none";
        if (loadingMessage) loadingMessage.style.display = "none";
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("titleScreen").style.display = "flex";
        console.log("✅ ゲーム画面を表示");
      }, 500);
    } catch (err) {
      console.error("⛔ ログインエラー:", err);
      if (loadingOverlay) loadingOverlay.style.display = "none";
      if (loadingMessage) loadingMessage.style.display = "none";
      alert("ログインエラーが発生しました。再度お試しください。\n" + err.message);
    }
  });
});

  // D-Pad イベント
  const upBtn    = document.getElementById("dpad-up");
  const downBtn  = document.getElementById("dpad-down");
  const leftBtn  = document.getElementById("dpad-left");
  const rightBtn = document.getElementById("dpad-right");
  if (upBtn)    upBtn.addEventListener("click", () => movePlayer(0, -STEP));
  if (downBtn)  downBtn.addEventListener("click", () => movePlayer(0, STEP));
  if (leftBtn)  leftBtn.addEventListener("click", () => movePlayer(-STEP, 0));
  if (rightBtn) rightBtn.addEventListener("click", () => movePlayer(STEP, 0));

  // キーボード操作
  document.addEventListener("keydown", (ev) => {
    if (ev.key) {
      const k = ev.key.toLowerCase();
      if (k === "w" ) movePlayer(0, -STEP);
      if (k === "s" ) movePlayer(0,  STEP);
      if (k === "a" ) movePlayer(-STEP, 0);
      if (k === "d" ) movePlayer(STEP,  0);
    }
  });
