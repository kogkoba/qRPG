/*******************************************************
 *  1) 定数・グローバル変数
 *******************************************************/

// 例：最新のGAS URL。適切なものに置き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzqM5gZr3HBY5LMo7U7uB0_dvEl29BW_2TpdBZjSH23OjiNfk0A6SsWXx6KRXF9x97T/exec";

// 移動距離
const STEP = 20;

// プレイヤーデータ
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

// フィールド上のプレイヤー情報
let player = { x: 0, y: 0, steps: 0 };
let facingRight = true;
let currentImageIndex = 0;
/** プレイヤーのアニメ画像（古いGoogleドライブ版 or ローカル） */
const playerImages = [
  // ★ お好みでローカル画像に切り替える場合はこう書き換えてください
  // "./assets/images/playerfront.PNG",
  // "./assets/images/playerleft.PNG",
  // "./assets/images/playerright.PNG"
  
  // 以前ログインできていた時のGoogle Drive版
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
let encounterThreshold = 5; // 何歩ごとにエンカウントするか
let battleStartHp = 50; // バトル開始時のHP

// BGM関連フラグ
let isBgmPlaying = false;
let isBattleBgmPlaying = false;
let quizBgm = null;


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

/** BGMボタンの表示を更新 */
function updateBgmButton() {
  const button = document.getElementById("bgmToggleButton");
  if (!button) return;
  button.textContent = isBgmPlaying ? "🎵 BGM ON" : "🔇 BGM OFF";
}

/** BGMオンオフ */
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

/** フィールドBGM */
function playFieldBgm() {
  if (!isBgmPlaying) return;
  const fieldBgm = document.getElementById("fieldBGM");
  if (!fieldBgm) return;
  fieldBgm.currentTime = 0;
  fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (!fieldBgm) return;
  fieldBgm.pause();
  fieldBgm.currentTime = 0;
}

/** 戦闘BGM */
function playBattleBgm() {
  if (!isBgmPlaying || isBattleBgmPlaying) return;
  const battleBgm = document.getElementById("battleBGM");
  if (!battleBgm) return;
  battleBgm.currentTime = 0;
  battleBgm.play().then(() => {
    isBattleBgmPlaying = true;
  }).catch(err => console.warn("戦闘BGM再生エラー:", err));
}

function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (!battleBgm) return;
  battleBgm.pause();
  battleBgm.currentTime = 0;
  isBattleBgmPlaying = false;
}

/** クイズBGM */
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


/*******************************************************
 *  5) プレイヤーデータ周り
 *******************************************************/

/** ステータス表示を更新 */
function updatePlayerStatusUI() {
  const hpElem = document.getElementById("field-hp");
  if (hpElem) hpElem.textContent = playerData.hp;

  const lvlElem = document.getElementById("level");
  if (lvlElem) lvlElem.textContent = playerData.level;

  const gElem = document.getElementById("field-g");
  if (gElem) gElem.textContent = playerData.g;
}

/** レベルアップチェック */
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

/** 経験値を加算 */
function addExp(amount) {
  playerData.exp += amount;
  checkLevelUp();
  updatePlayerStatusUI();
  savePlayerData();
}

/** プレイヤーデータをGASに保存 */
function savePlayerData() {
  const params = new URLSearchParams();
  params.append("mode", "updatePlayer");
  params.append("name", playerData.name);
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
    console.log("💀 ゲームオーバー！");
    showGameOverScreen();
  }
}


/*******************************************************
 *  6) ゲーム開始処理
 *******************************************************/
function startGame() {
  console.log("🎮 ゲーム開始！");

  // **タイトル画面を消す**
  document.getElementById("titleScreen").style.display = "none";

  // **ゲーム画面を表示**
  document.getElementById("gameContainer").style.display = "block";
  document.getElementById("gameArea").style.display = "block";

  // **プレイヤーの初期化**
  initGame();

  // **必ず村 (`village`) からスタート**
  switchMap("village");

  // **プレイヤーを村の中央に配置**
  player.x = 7;
  player.y = 7;
  updatePlayerPosition();

  // **村のBGMを開始**
  playVillageBgm();

  // **ステータスUIを更新**
  updatePlayerStatusUI();
}

/** マップを描画する関数 */
function drawMap() {
  console.log("🗺 マップを描画しました！");
}

/** 村BGM */
function playVillageBgm() {
  if (!isBgmPlaying) return;
  const villageBgm = document.getElementById("villageBGM");
  if (!villageBgm) return;
  villageBgm.currentTime = 0;
  villageBgm.play().catch(err => console.warn("村BGM再生エラー:", err));
}

function stopVillageBgm() {
  const villageBgm = document.getElementById("villageBGM");
  if (!villageBgm) return;
  villageBgm.pause();
  villageBgm.currentTime = 0;
}

/** マップを切り替える処理 */
function switchMap(newMap) {
  if (newMap === "field") {
    currentMap = "field";
    tileMap = tileMapField;
    tileImages = tileImagesField;

    // **村の出口からフィールドへ移動**
    player.x = 7;
    player.y = 1; // 村の出口付近に配置

    stopVillageBgm();
    playFieldBgm();

  } else if (newMap === "village") {
    currentMap = "village";
    tileMap = tileMapVillage;
    tileImages = tileImagesVillage;

    // **フィールドの入口から村へ戻る**
    player.x = 7;
    player.y = 13; // フィールド入口付近に配置

    stopFieldBgm();
    playVillageBgm();
  }

  // **マップを描画**
  drawMap();
  updatePlayerPosition();
}

/** マップ遷移のチェック */
function checkMapTransition() {
  if (currentMap === "village" && player.x === 7 && player.y === 0) {
    console.log("🚪 村からフィールドへ移動！");
    switchMap("field");
  } else if (currentMap === "field" && player.x === 7 && player.y === 14) {
    console.log("🏠 フィールドから村へ移動！");
    switchMap("village");
  }
}

/** プレイヤーの移動処理 */
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中なら移動不可

  // 向きを変更
  facingRight = dx >= 0;

  // 歩行アニメーションの切り替え
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const playerElement = document.getElementById("player");
  if (playerElement) {
    playerElement.src = playerImages[currentImageIndex];
  }

  // 新しい座標を計算
  let newX = player.x + dx;
  let newY = player.y + dy;

  // **マップの範囲外に出ないよう制限**
  const mapWidth = tileMap[0].length;
  const mapHeight = tileMap.length;
  if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
    console.warn("🚧 これ以上進めません！");
    return;
  }

  // **プレイヤー位置の更新**
  player.x = newX;
  player.y = newY;
  updatePlayerPosition();

  // **マップ遷移のチェック**
  checkMapTransition();
}

/*******************************************************
 *  6) ゲームオーバー・再挑戦 (ダミー)
 *******************************************************/
function showGameOverOptions() {
  console.log("⚠ ゲームオーバー！再挑戦 or 教会へ戻るを実装してください。");
}
function startBattleInitForRetry() {
  console.log("再挑戦の初期化を実装してください。");
}
function retryBattle() {
  console.log("バトルをリトライする処理を実装してください。");
}
function restartFromChurch() {
  console.log("教会へ戻る処理を実装してください。");
}


/*******************************************************
 *  7) フィールド初期化・移動
 *******************************************************/
function initGame() {
  // 必要なら初期位置設定
  // player.x = 100; 
  // player.y = 100;
  updatePlayerPosition();
  updatePlayerStatusUI();
}

/** プレイヤーの位置を更新する関数 */
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return; // プレイヤー要素が存在しない場合は何もしない

  playerElement.style.left = `${player.x}px`;
  playerElement.style.top = `${player.y}px`;
  playerElement.style.transform =
    `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
}

/** プレイヤーの移動処理 */
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中なら移動不可

  // 向きを変更
  if (dx < 0) facingRight = false;
  if (dx > 0) facingRight = true;

  // 歩行アニメーションの切り替え
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const playerElement = document.getElementById("player");
  if (playerElement) {
    playerElement.src = playerImages[currentImageIndex];
  }

  // 新しい座標を計算
  let newX = player.x + dx;
  let newY = player.y + dy;

  // **タイルマップの範囲外に出ないよう制限**
  const mapWidth = tileMap[0].length;
  const mapHeight = tileMap.length;
  if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
    console.warn("🚧 これ以上進めません！");
    return; // 範囲外なら移動しない
  }

  // プレイヤー位置の更新
  player.x = newX;
  player.y = newY;

  // 画面を更新
  updatePlayerPosition();

  // マップ遷移チェック
  checkMapTransition();
}


// 歩数をカウント & エンカウント判定
player.steps++;
if (player.steps - lastEncounterSteps >= encounterThreshold) {
  console.log("⚔ モンスターがあらわれた！");
  startEncounter();
  lastEncounterSteps = player.steps; // エンカウント後、歩数リセット
}


/** プレイヤーを初期化する関数 */
function initGame() {
  player.x = 100; // 初期X座標
  player.y = 100; // 初期Y座標
  updatePlayerPosition();
}

/** キーボード & 十字キーの移動イベント */
// これが正しい `DOMContentLoaded` の位置 (最初の1つだけ残す)
document.addEventListener("DOMContentLoaded", () => {
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  isBgmPlaying = false;

  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) {
    bgmButton.textContent = "🔇 BGM OFF";
  }
  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;
  updateBgmButton();

  // 🎮 スタートボタン
  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  // 🎮 ログインボタン
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
          // ログイン画面を非表示 → タイトル画面
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

  // 🎮 十字キーのイベント登録 (D-Pad)
  const upBtn    = document.getElementById("dpad-up");
  const downBtn  = document.getElementById("dpad-down");
  const leftBtn  = document.getElementById("dpad-left");
  const rightBtn = document.getElementById("dpad-right");

  if (upBtn)    upBtn.addEventListener("click", () => movePlayer(0, -STEP));
  if (downBtn)  downBtn.addEventListener("click", () => movePlayer(0, STEP));
  if (leftBtn)  leftBtn.addEventListener("click", () => movePlayer(-STEP, 0));
  if (rightBtn) rightBtn.addEventListener("click", () => movePlayer(STEP, 0));

  // 🎮 キーボード (WASD or 矢印キー) の移動
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") movePlayer(0, -STEP);
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") movePlayer(0, STEP);
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") movePlayer(-STEP, 0);
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") movePlayer(STEP, 0);
  });

  console.log("✅ DOMContentLoaded イベント完了！");
});

/*******************************************************
 *  8) 戦闘関連 (ダミー)
 *******************************************************/
function startEncounter() {
  if (inBattle) return; // すでに戦闘中なら何もしない

  console.log("🐉 敵があらわれた！");
  inBattle = true;

  // 戦闘用のBGMを再生
  stopFieldBgm();
  playBattleBgm();

  // モンスターをランダムに選択
  let monsters = getRandomMonsters();
  showMonsters(monsters);
}

function startBattleInit() { /* ... */ }
function updateBattleHp() {
  const battleHpElem = document.getElementById("battle-hp");
  if (battleHpElem) {
    battleHpElem.textContent = playerData.hp;
  }
}
function showMonsters(monsters) { /* ... */ }
function shakeGameScreen() { /* ... */ }
function shakeAndRemoveMonster() { /* ... */ }


/*******************************************************
 *  9) クイズ出題・解答処理
 *******************************************************/
function showQuiz() {
  console.log("クイズを表示してください");
}

function disableChoiceButtons() {
  console.log("選択肢を無効化する処理を入れてください");
}

/** クイズ解答 */
function answerQuiz(selected, quiz) {
  if (selected === quiz.correct) {
    addExp(20);
    playerData.g += 5;
    savePlayerData();
    console.log("○ 正解！");
  } else {
    changeHp(-10);
    console.log("× 不正解…");
    if (quiz.questionId) {
      recordMistake(playerData.name, quiz.questionId);
    }
  }
}

/** 間違えた問題を記録 */
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
  .then(response => response.json())
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

/*******************************************************
 * 10) 戦闘終了 (ダミー)
 *******************************************************/
function onZaoriku() { /* ... */ }
function endBattle() { /* ... */ }




