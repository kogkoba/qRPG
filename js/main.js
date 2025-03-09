/** *******************************************************
 *  1) 定数・グローバル変数
 *******************************************************  */

// もし別のGASのURLや API_KEY などが必要なら適宜差し替えてください。
const GAS_URL = "https://script.google.com/macros/s/AKfycbwOcT2PzrIr6tlVfkQcrPYhz8d8AWz2tIi9XKQXqEVKDx9NikI6E94QDcjpbCQ4gODO/exec";

const STEP = 20;

/** プレイヤー情報 */
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
/** クイズデータの格納用 */
let quizData = [];
/** モンスターデータの格納用 */
let monsterData = [];

/** フィールド上のプレイヤーの位置や歩数管理 */
let player = { x: 0, y: 0, steps: 0 };
/** プレイヤーが右向きかどうか */
let facingRight = true;
/** プレイヤー画像のアニメーション用インデックス */
let currentImageIndex = 0;
/** プレイヤーの歩行アニメーション画像 */
const playerImages = [
  "https://lh3.googleusercontent.com/d/1peHOi70oOmL8c9v3OQydE5N-9R0PB6vh",
  "https://lh3.googleusercontent.com/d/1iuVZiT6Eh9mp2Ta__Cpm5z28HZ2k0YA0",
  "https://lh3.googleusercontent.com/d/1fCmul9iotoUh4MLa_qzHvaOUDYMvng8C"
];

/** 戦闘中かどうか */
let inBattle = false;
/** 正解数・ミス数の管理 */
let correctCount = 0;
let missCount = 0;
const MAX_CORRECT = 4;
const MAX_MISS = 4;
/** エンカウント関連 */
let lastEncounterSteps = 0;
let encounterThreshold = 5;

/** バトル開始時のHP */
let battleStartHp = 50;

/** BGM 関連の管理フラグ等 */
let isBgmPlaying = false;
let isBattleBgmPlaying = false;
let quizBgm = null;


/*******************************************************
 *  2) クイズ・モンスター データ取得関連
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

/** ランダムにクイズを1問取得 */
function getRandomQuiz() {
  if (!quizData || quizData.length === 0) return null;
  const idx = Math.floor(Math.random() * quizData.length);
  return quizData[idx];
}

/** ランダムにモンスターを4体取得 */
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
 *  4) BGM 関連
 *******************************************************/

/** BGMボタンの表示を更新 */
function updateBgmButton() {
  const button = document.getElementById("bgmToggleButton");
  if (!button) return;
  button.textContent = isBgmPlaying ? "🎵 BGM ON" : "🔇 BGM OFF";
}

/** BGMのオンオフ切り替え */
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

/** フィールドBGM再生 */
function playFieldBgm() {
  if (!isBgmPlaying) return;
  const fieldBgm = document.getElementById("fieldBGM");
  if (!fieldBgm) return;
  fieldBgm.currentTime = 0;
  fieldBgm.play().catch(err => console.warn("フィールドBGM再生エラー:", err));
}

/** フィールドBGM停止 */
function stopFieldBgm() {
  const fieldBgm = document.getElementById("fieldBGM");
  if (!fieldBgm) return;
  fieldBgm.pause();
  fieldBgm.currentTime = 0;
}

/** 戦闘BGM再生 */
function playBattleBgm() {
  if (!isBgmPlaying || isBattleBgmPlaying) return;
  const battleBgm = document.getElementById("battleBGM");
  if (!battleBgm) return;
  battleBgm.currentTime = 0;
  battleBgm.play()
    .then(() => { isBattleBgmPlaying = true; })
    .catch(err => console.warn("戦闘BGM再生エラー:", err));
}

/** 戦闘BGM停止 */
function stopBattleBgm() {
  const battleBgm = document.getElementById("battleBGM");
  if (!battleBgm) return;
  battleBgm.pause();
  battleBgm.currentTime = 0;
  isBattleBgmPlaying = false;
}

/** クイズBGM再生 */
function playQuizBgm() {
  if (!quizBgm) quizBgm = document.getElementById("quizBGM");
  if (!isBgmPlaying || !quizBgm || !quizBgm.paused) return;
  quizBgm.currentTime = 0;
  quizBgm.play().catch(err => console.warn("クイズBGM再生エラー:", err));
}

/** クイズBGM停止 */
function stopQuizBgm() {
  if (!quizBgm) quizBgm = document.getElementById("quizBGM");
  if (!quizBgm) return;
  quizBgm.pause();
  quizBgm.currentTime = 0;
}


/*******************************************************
 *  5) プレイヤーデータ周り
 *******************************************************/

/** プレイヤーのステータス表示を更新 */
function updatePlayerStatusUI() {
  const hpElem = document.getElementById("field-hp");
  if (hpElem) hpElem.textContent = playerData.hp;

  const levelElem = document.getElementById("level");
  if (levelElem) levelElem.textContent = playerData.level;

  const fieldGElement = document.getElementById("field-g");
  if (fieldGElement) fieldGElement.textContent = playerData.g;
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
    console.log(`🎉 レベルアップ！現在のレベル: ${playerData.level}`);
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

/** HPを変化させる */
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


/*******************************************************
 *  6) ゲームオーバー・再挑戦 (ダミー実装)
 *******************************************************/

/** ゲームオーバー選択肢を表示する (ダミー) */
function showGameOverOptions() {
  console.log("⚠ ゲームオーバー！再挑戦 or 教会へ戻るを実装してください。");
}

/** バトル再開用 (ダミー) */
function startBattleInitForRetry() {
  console.log("再挑戦の初期化処理を実装してください。");
}

/** バトルリトライ (ダミー) */
function retryBattle() {
  console.log("リトライ処理を実装してください。");
}

/** 教会に戻る (ダミー) */
function restartFromChurch() {
  console.log("教会に戻る処理を実装してください。");
}


/*******************************************************
 *  7) フィールド初期化・移動
 *******************************************************/

/** 初期化処理（必要に応じて座標リセットなど） */
function initGame() {
  // 例: player.x = 100; player.y = 100; 等
  // 必要があればここに初期設定を入れる
}

/** プレイヤーの描画位置を更新 */
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;
  playerElement.style.left = player.x + "px";
  playerElement.style.top = player.y + "px";
  playerElement.style.transform = 
    "translate(-50%, -50%) " + (facingRight ? "scaleX(1)" : "scaleX(-1)");
}

/** プレイヤーを移動させる */
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中は移動不可

  // 向きの更新
  if (dx < 0) facingRight = false;
  else if (dx > 0) facingRight = true;

  // 歩行アニメーション
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;
  const playerElement = document.getElementById("player");
  if (playerElement) {
    playerElement.src = playerImages[currentImageIndex];
  }

  // 新しい座標を計算
  player.x += dx;
  player.y += dy;

  // 画面外に出ないように制限
  const pw = playerElement ? playerElement.offsetWidth : 0;
  const ph = playerElement ? playerElement.offsetHeight : 0;
  const gameArea = document.getElementById("gameArea");
  if (gameArea) {
    const maxX = gameArea.clientWidth - pw;
    const maxY = gameArea.clientHeight - ph;
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > maxX) player.x = maxX;
    if (player.y > maxY) player.y = maxY;
  }

  // 表示更新
  updatePlayerPosition();

  // 歩数カウント & ランダムエンカウント
  player.steps++;
  if (player.steps - lastEncounterSteps >= encounterThreshold) {
    startEncounter();
  }
}

/** ランダムエンカウント閾値を取得 */
function getRandomEncounterThreshold() {
  return Math.floor(Math.random() * 11) + 5; // 5～15あたり
}


/*******************************************************
 *  8) 戦闘関連 (ダミー実装)
 *******************************************************/

/** 戦闘開始 */
function startEncounter() {
  console.log("🐉 敵があらわれた！（戦闘開始処理を実装してください）");
  // 例: inBattle = true; など
}

/** 戦闘初期化 */
function startBattleInit() {
  console.log("戦闘初期化処理を実装してください。");
}

/** バトル画面のHP表示更新 */
function updateBattleHp() {
  const battleHpElem = document.getElementById("battle-hp");
  if (battleHpElem) {
    battleHpElem.textContent = playerData.hp;
  }
}

/** モンスター表示 */
function showMonsters(monsters) {
  console.log("モンスター表示処理を実装:", monsters);
}

/** 画面を揺らす演出 */
function shakeGameScreen() {
  console.log("画面を揺らすエフェクトを実装してください。");
}

/** モンスターを揺らして削除する */
function shakeAndRemoveMonster() {
  console.log("モンスターを揺らして削除する処理を実装してください。");
}


/*******************************************************
 *  9) クイズ出題・解答処理
 *******************************************************/

function showQuiz() {
  console.log("クイズを表示する処理を実装してください。");
}

function disableChoiceButtons() {
  console.log("選択肢ボタンを無効化する処理を実装してください。");
}

/** クイズへの回答 */
function answerQuiz(selected, quiz) {
  if (selected === quiz.correct) {
    addExp(20);
    playerData.g += 5;
    savePlayerData();
    console.log("○ 正解です！");
  } else {
    changeHp(-10);
    console.log("× 不正解…HPが10減りました。");
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


/*******************************************************
 *  10) 戦闘終了関数 (ダミー実装)
 *******************************************************/

function onZaoriku() {
  console.log("ザオリク系の処理を実装してください。");
}

function endBattle() {
  console.log("戦闘終了処理を実装してください。");
}


/*******************************************************
 *  11) ゲーム開始処理
 *******************************************************/

function startGame() {
  console.log("ゲーム開始！");

  // タイトル画面を隠し、ゲーム画面を表示
  const titleScreen = document.getElementById("titleScreen");
  const gameContainer = document.getElementById("gameContainer");
  const gameArea = document.getElementById("gameArea");

  if (titleScreen) titleScreen.style.display = "none";
  if (gameContainer) gameContainer.style.display = "block";
  if (gameArea) gameArea.style.display = "block";

  // フィールドBGM再生
  playFieldBgm();

  // ゲーム初期化 & プレイヤー位置などを更新
  initGame();
  updatePlayerPosition();
  updatePlayerStatusUI();
}


/*******************************************************
 *  12) DOMContentLoaded 後の処理
 *******************************************************/

/** DOM読み込み完了後に実行 */
document.addEventListener("DOMContentLoaded", () => {
  // BGMをオフから開始
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  isBgmPlaying = false;

  // BGMボタンの初期表示
  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";

  // クイズBGMのループ設定
  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;

  // BGMボタン表示を更新
  updateBgmButton();

  // スタートボタン
  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
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

        // プレイヤーデータを更新
        playerData.name  = data.name;
        playerData.level = parseInt(data.level, 10);
        playerData.exp   = parseInt(data.exp, 10);
        playerData.g     = parseInt(data.g, 10);
        playerData.hp    = parseInt(data.hp, 10) || 50;
        updatePlayerStatusUI();

        // クイズ & モンスターをロード
        await loadQuizData();
        await loadMonsterData();

        // ローディングを少し待ってから画面遷移
        setTimeout(() => {
          hideLoadingOverlay();
          const loginScreen = document.getElementById("loginScreen");
          if (loginScreen) loginScreen.style.display = "none";
          const titleScreen = document.getElementById("titleScreen");
          if (titleScreen) titleScreen.style.display = "flex";
        }, 500);

      } catch (err) {
        console.error("ログインエラー:", err);
        hideLoadingOverlay();
        alert("ログインエラーが発生しました。再度お試しください。");
      }
    });
  }
});

