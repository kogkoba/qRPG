// ======================= 7) フィールド初期化・移動 =======================

// 初期化処理（必要に応じて座標リセットなど）
function initGame() {
  // 例: player.x = 100; player.y = 100; 等
  // 必要があればここに初期設定を入れる
}

// プレイヤー画像や向きの反映
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;
  playerElement.style.left = player.x + "px";
  playerElement.style.top = player.y + "px";
  playerElement.style.transform = 
    "translate(-50%, -50%) " + (facingRight ? "scaleX(1)" : "scaleX(-1)");
}

// 実際の移動処理
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

// ランダムエンカウント閾値の取得
function getRandomEncounterThreshold() {
  return Math.floor(Math.random() * 11) + 5; // 5～15あたり
}


// ======================= 8) 戦闘関連 =======================
function startEncounter() {
  // ... 戦闘開始処理
}

function startBattleInit() {
  // ... 戦闘初期化
}

function updateBattleHp() {
  // ... バトル画面HP更新
}

function showMonsters(monsters) {
  // ... モンスター表示
}

function shakeGameScreen() {
  // ... 画面揺れ演出
}

function shakeAndRemoveMonster() {
  // ... モンスター消去
}


// ======================= 9) クイズ出題・解答処理 =======================
function showQuiz() {
  // ... クイズ表示
}

function disableChoiceButtons() {
  // ... 選択肢ボタン無効化
}

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
function onZaoriku() {
  // ... ザオリク系の処理
}
function endBattle() {
  // ... 戦闘終了処理
}


// ======================= 11) ゲーム開始処理 =======================
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


// ======================= 12) DOM読み込み完了後の処理 =======================
document.addEventListener("DOMContentLoaded", () => {
  // BGMをオフから開始
  stopFieldBgm();
  stopBattleBgm();
  stopQuizBgm();
  isBgmPlaying = false;

  const bgmButton = document.getElementById("bgmToggleButton");
  if (bgmButton) bgmButton.textContent = "🔇 BGM OFF";

  quizBgm = document.getElementById("quizBGM");
  if (quizBgm) quizBgm.loop = true;

  updateBgmButton();

  // 「スタート」ボタン
  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  // 「ログイン」ボタン
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

        // ローディングを少し待ってから画面遷移
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
