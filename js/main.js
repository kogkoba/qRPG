/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";

const STEP = 20;



// プレイヤーデータ、クイズ、モンスター
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// タイルマップ（外部ファイル tilemap_village.js, tilemap_field.js で定義される変数）
let tileMap = null; 
let currentMap = null; // "village" or "field"

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
const MAX_CORRECT = 4;
const MAX_MISS = 4;
let lastEncounterSteps = 0;
let encounterThreshold = 5;
let battleStartHp = 50;
let battleStartG = null;

// ===== 追加：ピンチズーム対応 =====
// この処理は #mapContainer に対してピンチ操作を検出し、scale を更新します。
(function() {
  const mapContainer = document.getElementById('mapContainer');
  if (!mapContainer) return;

  let initialDistance = 0; // タッチ開始時の2点間距離
  let initialScale = 1;    // ピンチ開始時のscale
  let currentScale = 1;    // 現在のscale

  // 16×16のマップが画面全体に収まるよう、初期scaleを自動計算
  function setInitialScale() {
    const tileSize = 32;          // タイルサイズ(px)
    const mapWidth = 16 * tileSize; // 16列×32px = 512px
    const mapHeight = 16 * tileSize;// 16行×32px = 512px

    // 画面に収めるためのscale（横・縦それぞれの比率の小さい方）
    const scaleX = window.innerWidth / mapWidth;
    const scaleY = window.innerHeight / mapHeight;
    // 初期状態では、1以上には拡大しない（必要なら調整してください）
    initialScale = Math.min(scaleX, scaleY, 1);
    currentScale = initialScale;
    mapContainer.style.transform = `scale(${initialScale})`;
    mapContainer.style.transformOrigin = '0 0'; // 左上を基準に拡大縮小
  }
  setInitialScale();
  window.addEventListener('resize', setInitialScale);

  // タッチ開始：2点タッチの場合、距離を計算
  mapContainer.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault(); // スクロールを防止
      initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
  }, { passive: false });

  // タッチ移動：2点タッチの場合、scale を更新
  mapContainer.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      if (initialDistance > 0) {
        const scaleFactor = newDistance / initialDistance;
        currentScale = initialScale * scaleFactor;
        // scaleの下限・上限を設定（例：0.5～2倍）
        currentScale = Math.max(0.5, Math.min(currentScale, 2));
        mapContainer.style.transform = `scale(${currentScale})`;
      }
    }
  }, { passive: false });

  // タッチ終了：2点タッチが終了したら、最後のscaleを初期値に更新
  mapContainer.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) {
      initialScale = currentScale;
      initialDistance = 0;
    }
  }, { passive: false });

  // 2点間の距離を計算する補助関数
  function getDistance(touch1, touch2) {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }
})();

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
  const villageBgm = document.getElementById("villagebgm");
  if (villageBgm) villageBgm.play().catch(err => console.warn("村BGM再生エラー:", err));
}

function playFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (fieldBgm) fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function playBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (battleBgm) battleBgm.play().catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function stopVillageBgm() {
  const villageBgm = document.getElementById("villagebgm");
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
 *  5) プレイヤーデータ周り
 *******************************************************/
function updatePlayerStatusUI() {
  document.getElementById("field-hp").textContent = playerData.hp;
  document.getElementById("level").textContent = playerData.level;
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
 *  6) ゲーム開始処理 (タイトル画面 → 村マップ)
 *******************************************************/
function startGame() {
  console.log("🎮 ゲーム開始！");
  // タイトル画面を非表示
  document.getElementById("titleScreen").style.display = "none";
  // ゲーム画面を表示
  document.getElementById("gameContainer").style.display = "block";
  // gameAreaも表示
  document.getElementById("gameArea").style.display = "block";

  initGame();
  currentMap = null;

  // 必ず村から開始
  switchMap("village");

  // コメントアウト: もしfieldから始まっていたら削除する
  // switchMap("field");

  // プレイヤーの初期座標を村マップ上に
  player.x = 7;
  player.y = 7;

  updatePlayerPosition();
  updatePlayerStatusUI();
}

/*******************************************************
 *  7) マップ切り替え処理
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
    // 村マップの初期座標 (必要なら変更)
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
    player.x = 7;
    player.y = 14;
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
  if (currentMap === "village" && ((player.x === 6 || player.x === 7) && player.y === 15)) {
    console.log("🚪 村からフィールドへ移動");
    switchMap("field");
  } 
  else if (currentMap === "field" && player.x === 7 && player.y === 14) {
    console.log("🏠 フィールドから村へ移動");
    switchMap("village");
  }
}

/*******************************************************
 *  9) プレイヤー移動
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
  playerElement.style.left = `${player.x * 32}px`;
  playerElement.style.top = `${player.y * 32}px`;
  playerElement.style.transform = `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
}

/*******************************************************
 * 10) タイルマップ描画（共通）
 *******************************************************/
function drawMap() {
  const mapContainer = document.getElementById("mapContainer");
  if (!mapContainer) {
    console.error("❌ mapContainer の要素が見つかりません！");
    return;
  }
  mapContainer.innerHTML = "";

  let tileImages = null;
  if (currentMap === "village") {
    tileImages = tileImagesVillage;
  } else if (currentMap === "field") {
    tileImages = fieldTileImages;
  } else {
    console.error("currentMapが不明です");
    return;
  }

  for (let y = 0; y < tileMap.length; y++) {
    for (let x = 0; x < tileMap[y].length; x++) {
      const tileValue = tileMap[y][x];
      const tileSrc = tileImages[tileValue];
      if (!tileSrc) continue;

      const tileElement = document.createElement("img");
      tileElement.src = tileSrc;
      tileElement.style.position = "absolute";
      /* 旧行をコメントアウト
      tileElement.style.width = "32px";
      tileElement.style.height = "32px";
      */
      // 置き換え (TILE_SIZE||32)
      tileElement.style.width = `${32}px`;
      tileElement.style.height = `${32}px`;

      tileElement.style.left = `${x * 32}px`;
      tileElement.style.top = `${y * 32}px`;
      mapContainer.appendChild(tileElement);
    }
  }
}

/*******************************************************
 * 11) 戦闘（クイズ）処理
 *******************************************************/
function startEncounter() {
  if (inBattle) return;
  console.log("📖 クイズバトル開始！");
  inBattle = true;
  stopFieldBgm();
  playBattleBgm();
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
  const quiz = getRandomQuiz();
  if (!quiz) {
    console.error("⛔ クイズデータがありません");
    endBattle();
    return;
  }
  document.getElementById("battle-screen").style.display = "block";
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
        console.log(`✅ 間違い記録: ${playerName} - QID ${questionId}`);
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
  stopBattleBgm();
  playFieldBgm();
  updatePlayerStatusUI();
  document.getElementById("battle-screen").style.display = "none";
}

/*******************************************************
 * 12) ゲームオーバー・再挑戦
 *******************************************************/
function showGameOverOptions() {
  console.log("💀 ゲームオーバー！");
  inBattle = false;
  stopBattleBgm();
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
  console.log("⛪ 教会へ戻る (G半分, HP全回復)");
  playerData.g = Math.floor(playerData.g / 2);
  playerData.hp = 50;
  player.x = 100;
  player.y = 150;
  savePlayerData();
  updatePlayerStatusUI();
  updatePlayerPosition();
  document.getElementById("battle-screen").style.display = "none";
  stopBattleBgm();
  playFieldBgm();
}

function retryBattle() {
  console.log("🔄 クイズをやり直す (HP,G復元)");
  playerData.hp = battleStartHp;
  if (battleStartG !== null) {
    playerData.g = battleStartG;
  }
  savePlayerData();
  updatePlayerStatusUI();
  showQuiz();
}

/*******************************************************
 * 13) DOMContentLoaded：ログイン/スタート処理
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // BGM初期化
  stopFieldBgm();
  stopBattleBgm();
  stopVillageBgm();
  isBgmPlaying = false;
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";
  updateBgmButton();

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
        if (!resp.ok) throw new Error("ネットワークエラー");
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || "不明なエラー");
        console.log("ログイン成功:", data);

        // プレイヤーデータに反映
        playerData.name  = data.name;
        playerData.level = parseInt(data.level, 10);
        playerData.exp   = parseInt(data.exp, 10);
        playerData.g     = parseInt(data.g, 10);
        playerData.hp    = parseInt(data.hp, 10) || 50;
        updatePlayerStatusUI();

        // クイズ & モンスターデータ取得
        await loadQuizData();
        await loadMonsterData();

        setTimeout(() => {
          hideLoadingOverlay();
          // ログイン画面を消して、タイトル画面を表示
          document.getElementById("loginScreen").style.display = "none";
          document.getElementById("titleScreen").style.display = "flex";
        }, 500);
      } catch (err) {
        console.error("ログインエラー:", err);
        hideLoadingOverlay();
        alert("ログインエラーが発生。再度お試しください。");
      }
    });
  }

  // スタートボタン
  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  // D-Pad ボタン
  document.getElementById("dpad-up").addEventListener("click", () => movePlayer(0, -STEP));
  document.getElementById("dpad-down").addEventListener("click", () => movePlayer(0, STEP));
  document.getElementById("dpad-left").addEventListener("click", () => movePlayer(-STEP, 0));
  document.getElementById("dpad-right").addEventListener("click", () => movePlayer(STEP, 0));

  // キーボード操作
  document.addEventListener("keydown", (event) => {
    if (!event.key) return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") movePlayer(0, -STEP);
    else if (key === "s" || key === "arrowdown") movePlayer(0, STEP);
    else if (key === "a" || key === "arrowleft") movePlayer(-STEP, 0);
    else if (key === "d" || key === "arrowright") movePlayer(STEP, 0);
  });
});