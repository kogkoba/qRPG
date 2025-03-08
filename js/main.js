// main.js
window.gapiLoaded = function() {
  console.log("✅ gapiLoaded が呼ばれました");
  gapi.load("client", initClient);
};

// グローバル関数として定義すると、HTMLの onclick="startGame()" から呼べる
window.startGame = function() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  // ゲーム開始の処理 (BGM再生や初期化など)
};





    // ======================= 1) Google API 読み込み後の処理 =======================


    async function initClient() {
      try {
        console.log("🔄 initClient() 開始...");
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
        });
        console.log("✅ GAPI Initialized");
        
        // クイズデータとモンスターデータをロード
        await loadQuizData();
        await loadMonsterData();

        console.log("✅ Data Loaded");
      } catch (err) {
        console.error("⛔ GAPI Init Error:", err.message || err);
      }
    }

    // ======================= 2) 定数・グローバル変数 =======================
    // ★ 修正：API_KEY 等、適切に設定
    const API_KEY = "AIzaSyBszPu-BQ2_Aq9C3lhAiW--kyenM5vQsjs";
    const GAS_PERSONAL_URL = "https://script.google.com/macros/s/AKfycbysoCsP1D4qh_wxWoBns2H2F6UBMmOxARGyo2jv4PhsDfoQkjndge-p-FvNxkD-n-b1/exec";
    const STEP = 20;
    const QUIZ_SHEET_ID = "1GyKDfVQCNrBlkxjsrQDv_ouIio9yjO3mVQy6Ds5uQzg";
    const MONSTER_SHEET_ID = "1t08cjUMrug0nvIpredcxjuoxejDRazqqzLTqjVraJhw";
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwr32j-z2AE0AwYbP2JguFxiPZHVJHghjQCgEz1bIT0T2ZxyKKuQx7294jIAtBpa2MnFw/exec";

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

    // ======================= 3) データ読込関数 =======================
    async function loadQuizData() {
      try {
        const resp = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: QUIZ_SHEET_ID,
          range: `sheet1!A2:K1000`
        });
        if (!resp.result.values) {
          console.warn("クイズデータが存在しません。");
          return;
        }
        quizData = resp.result.values.map(row => ({
          questionId: row[0] || "",
          question: row[1] || "",
          imageUrl: row[2] || "",
          choices: [row[3], row[4], row[5], row[6]],
          correct: parseInt(row[7] || "1", 10),
          explanation: row[9] || ""
        }));
        console.log("✅ Quiz Data:", quizData);
      } catch (err) {
        console.error("⛔ Quiz Data Error:", err);
      }
    }

    async function loadMonsterData() {
      try {
        const resp = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: MONSTER_SHEET_ID,
          range: `sheet1!A2:C1000`
        });
        if (!resp.result.values) {
          console.warn("モンスターデータが存在しません。");
          return;
        }
        monsterData = resp.result.values.map(row => ({
          id: row[0] || "",
          name: row[1] || "",
          url: row[2] || ""
        }));
        console.log("Monster Data:", monsterData);
      } catch (err) {
        console.error("Monster Data Error:", err);
      }
    }

    function getRandomQuiz() {
      if (!quizData || quizData.length === 0) return null;
      const idx = Math.floor(Math.random() * quizData.length);
      return quizData[idx];
    }

    function getRandomMonsters() {
      if (monsterData.length < 4) {
        console.warn("Not enough monsters");
        return [];
      }
      const shuffled = [...monsterData].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 4);
    }

    // ======================= 4) ローディングオーバーレイ =======================
    function showLoadingOverlay() {
      const overlay = document.getElementById("loadingOverlay");
      if (overlay) overlay.style.display = "flex";
    }
    function hideLoadingOverlay() {
      const overlay = document.getElementById("loadingOverlay");
      if (overlay) overlay.style.display = "none";
    }

    // ======================= 5) BGM 関連 =======================
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

    // ======================= 6) プレイヤーデータ周り =======================
    function updatePlayerStatusUI() {
      // ★ 修正: フィールド画面の HP 表示は "field-hp" へ
      document.getElementById("field-hp").textContent = playerData.hp;
      document.getElementById("level").textContent = playerData.level;
      // ★ 追加: 所持金 (G) を表示
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
      .then(response => response.json())
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

    // HPの増減
    function changeHp(amount) {
      playerData.hp += amount;
      // 0～50 に制限
      if (playerData.hp < 0) playerData.hp = 0;
      if (playerData.hp > 50) playerData.hp = 50;

      updatePlayerStatusUI();
      updateBattleHp();        // バトル画面用
      savePlayerData();

      // HP0 ならゲームオーバー選択肢
      if (playerData.hp === 0) {
        showGameOverOptions();
      }
    }

    // ======================= 7) ゲームオーバー・再挑戦 =======================
    function showGameOverOptions() {
      stopQuizBgm();
      stopBattleBgm();

      const topTextBox = document.getElementById("top-text-box");
      topTextBox.textContent = "💀 HPが尽きた…どうする？";

      const choiceArea = document.getElementById("choice-area");
      choiceArea.innerHTML = "";

      // 再挑戦
      const retryButton = document.createElement("button");
      retryButton.textContent = "再挑戦する";
      retryButton.className = "choice-button";
      retryButton.onclick = retryBattle;
      // 教会へ
      const churchButton = document.createElement("button");
      churchButton.textContent = "教会から再開";
      churchButton.className = "choice-button";
      churchButton.onclick = restartFromChurch;

      choiceArea.appendChild(retryButton);
      choiceArea.appendChild(churchButton);
    }
    
    function startBattleInitForRetry() {
  correctCount = 0;
  missCount = 0;
  battleStartHp = playerData.hp;

  // 画像と選択肢をリセット
  document.getElementById("quiz-image").style.display = "none";
  document.getElementById("choice-area").innerHTML = "";
  document.getElementById("zaorikuButton").style.display = "none";

  // モンスターの表示
  const currentMonsters = getRandomMonsters();
  showMonsters(currentMonsters);

  const topTextBox = document.getElementById("top-text-box");
  topTextBox.textContent = "mamがあらわれた！";

  updateBattleHp();

  // 演出用のテキスト表示
  setTimeout(() => { topTextBox.textContent = ""; }, 2000);
  setTimeout(() => { topTextBox.textContent = "mamの復習攻撃！"; }, 3000);
  // 5秒後に問題文のみを表示
  setTimeout(() => {
    const quiz = getRandomQuiz();
    if (!quiz) {
      console.warn("クイズがありません");
      endBattle();
      return;
    }
    // 問題文のみを表示
    topTextBox.textContent = quiz.question;
     // 遅延なしで画像と選択肢を表示
  const quizImg = document.getElementById("quiz-image");
  if (quiz.imageUrl) {
    quizImg.src = quiz.imageUrl;
    quizImg.style.display = "block";
  } else {
    quizImg.style.display = "none";
  }
  const choiceArea = document.getElementById("choice-area");
  choiceArea.innerHTML = "";
  quiz.choices.forEach((choiceText, index) => {
    const btn = document.createElement("button");
    btn.className = "choice-button";
    btn.textContent = choiceText;
    btn.onclick = () => answerQuiz(index + 1, quiz);
    choiceArea.appendChild(btn);
  });
      // クイズエリア（全体）を表示
      document.getElementById("quiz-area").style.display = "flex";
    }, 1000);

}

function retryBattle() {
  const topTextBox = document.getElementById("top-text-box");
  topTextBox.textContent = "再挑戦します！";

  // バトル開始時のHPに戻す
  playerData.hp = Math.min(battleStartHp, 50);
  updatePlayerStatusUI();
  savePlayerData();

  // クイズエリア（画像・選択肢）を非表示にする
  document.getElementById("quiz-area").style.display = "none";
  document.getElementById("quiz-image").style.display = "none";

  // ★ エフェクト追加：フィールドからバトルへのトランジション効果
  const overlay = document.getElementById("transition-overlay");
  const circle = document.getElementById("transition-circle");
  overlay.style.display = "block";
  requestAnimationFrame(() => { circle.classList.add("active"); });

  setTimeout(() => {
    // エフェクト終了後、元の状態に戻す
    overlay.style.display = "none";
    circle.classList.remove("active");

    // ★ BGM を再生（BGM ON 状態なら）
    if (isBgmPlaying) {
      playQuizBgm(); // ここでクイズBGMを再生
    }

    // 少し待ってから再挑戦用の戦闘初期化を呼び出す
    setTimeout(() => {
      startBattleInitForRetry();
    }, 500);
  }, 800);  // ← ここでしっかり閉じる
}


    function restartFromChurch() {
      const topTextBox = document.getElementById("top-text-box");
      topTextBox.textContent = "教会で復活… お金が半分になりました！";

      stopQuizBgm();
      stopBattleBgm();

      // 所持金半分
      playerData.g = Math.max(1, Math.floor(playerData.g / 2));
      // HP 全回復
      playerData.hp = 50;

      updatePlayerStatusUI();
      savePlayerData();

      // 戦闘画面を閉じてフィールドに戻る
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("gameArea").style.display = "block";
      inBattle = false;

      if (isBgmPlaying) {
        playFieldBgm();
      }
    }

    // ======================= 8) フィールド初期化・移動 =======================
    function initGame() {
      const gameArea = document.getElementById("gameArea");
      player.x = window.innerWidth / 2;
      player.y = gameArea.clientHeight / 2;
      updatePlayerPosition();
    }

    function startGame() {
      console.log("🎮 startGame() 実行！");
      document.getElementById("titleScreen").style.display = "none";
      document.getElementById("gameContainer").style.display = "block";
      initGame();
      lastEncounterSteps = player.steps;
      encounterThreshold = getRandomEncounterThreshold();
      console.log("🎲 初期化完了！");
    }

    function updatePlayerPosition() {
      const playerElement = document.getElementById("player");
      playerElement.style.left = player.x + "px";
      playerElement.style.top = player.y + "px";
      playerElement.style.transform =
        "translate(-50%, -50%) " + (facingRight ? "scaleX(1)" : "scaleX(-1)");
    }

    function movePlayer(dx, dy) {
      if (inBattle) return;

      if (dx < 0) facingRight = false;
      else if (dx > 0) facingRight = true;

      // 歩きアニメ
      currentImageIndex = (currentImageIndex + 1) % playerImages.length;
      document.getElementById("player").src = playerImages[currentImageIndex];

      // 位置更新
      player.x += dx;
      player.y += dy;
      // 範囲制限
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
      // 5～15
      return Math.floor(Math.random() * 11) + 5;
    }

    // ======================= 9) 戦闘関連 =======================
    function startEncounter() {
      inBattle = true;
      stopFieldBgm();
      stopQuizBgm();
      lastEncounterSteps = player.steps;
      encounterThreshold = getRandomEncounterThreshold();

      const overlay = document.getElementById("transition-overlay");
      const circle = document.getElementById("transition-circle");
      overlay.style.display = "block";
      requestAnimationFrame(() => {
        circle.classList.add("active");
      });

      setTimeout(() => {
        document.getElementById("gameArea").style.display = "none";
        document.getElementById("battle-screen").style.display = "block";
        overlay.style.display = "none";
        circle.classList.remove("active");

        // 戦闘開始時の準備
        playQuizBgm();
        startBattleInit();
      }, 800);
    }

    function startBattleInit() {
      correctCount = 0;
      missCount = 0;
      // ★ バトル開始時の HP を保存
      battleStartHp = playerData.hp;

  // ▼ ここで quiz-area 全体を非表示にする
  const quizArea = document.getElementById("quiz-area");
  quizArea.style.display = "none";



      // UI リセット
      document.getElementById("quiz-image").style.display = "none";
      document.getElementById("choice-area").innerHTML = "";
      document.getElementById("zaorikuButton").style.display = "none";

      // 敵の表示
      const currentMonsters = getRandomMonsters();
      showMonsters(currentMonsters);

      // テキスト
      const topTextBox = document.getElementById("top-text-box");
      topTextBox.textContent = "mamがあらわれた！";

      // バトル画面の HP 表示を更新
      updateBattleHp();

      setTimeout(() => { topTextBox.textContent = ""; }, 2000);
      setTimeout(() => { topTextBox.textContent = "mamの復習攻撃！"; }, 3000);
      setTimeout(() => {
        topTextBox.textContent = "クイズ開始！";
        showQuiz();
      }, 5000);
    }

    function updateBattleHp() {
      // ★ 修正: バトル画面の HP は "battle-hp"
      const battleHpElement = document.getElementById("battle-hp");
      if (battleHpElement) {
        battleHpElement.textContent = playerData.hp;
      }
    }

    function showMonsters(monsters) {
      const container = document.getElementById("enemy-container");
      container.innerHTML = "";
      monsters.forEach(monster => {
        const img = document.createElement("img");
        img.className = "monster";
        img.src = monster.url;
        img.alt = monster.name;
        container.appendChild(img);
      });
    }

    function shakeGameScreen() {
      const battleScreen = document.getElementById("battle-screen");
      battleScreen.classList.add("shake");
      setTimeout(() => {
        battleScreen.classList.remove("shake");
      }, 500);
    }

    function shakeAndRemoveMonster() {
      const container = document.getElementById("enemy-container");
      if (container.children.length > 0) {
        const firstMonster = container.children[0];
        firstMonster.classList.add("shake");
        setTimeout(() => {
          if (container.contains(firstMonster)) {
            container.removeChild(firstMonster);
          }
        }, 500);
      }
    }

    // ======================= 10) クイズ出題・解答処理 =======================
    function showQuiz() {
    // ▼ ここで quiz-area を表示に戻す
      const quizArea = document.getElementById("quiz-area");
      quizArea.style.display = "flex";  // 元々の CSS で flex-direction: column; などがあれば "flex"


      // クイズを取得
      const quiz = getRandomQuiz();
      if (!quiz) {
        console.warn("クイズがありません");
        endBattle();
        return;
      }

      const topTextBox = document.getElementById("top-text-box");
      topTextBox.textContent = quiz.question;

      // 画像表示
      const quizImg = document.getElementById("quiz-image");
      if (quiz.imageUrl) {
        quizImg.src = quiz.imageUrl;
        quizImg.style.display = "block";
      } else {
        quizImg.style.display = "none";
      }

      // 選択肢を表示
      const choiceArea = document.getElementById("choice-area");
      choiceArea.innerHTML = "";
      quiz.choices.forEach((choiceText, index) => {
        const btn = document.createElement("button");
        btn.className = "choice-button";
        btn.textContent = choiceText;
        btn.onclick = () => answerQuiz(index + 1, quiz);
        choiceArea.appendChild(btn);
      });
    }

    function disableChoiceButtons() {
      const buttons = document.querySelectorAll("#choice-area button");
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
      });
    }

    function answerQuiz(selected, quiz) {
      const topTextBox = document.getElementById("top-text-box");
      disableChoiceButtons();

      if (selected === quiz.correct) {
        correctCount++;
        topTextBox.textContent = "✅ 正解！ " + (quiz.explanation || "");
        shakeAndRemoveMonster();
        addExp(20);
        playerData.g += 5;
        savePlayerData();
      } else {
        missCount++;
        topTextBox.textContent = "❌ 不正解！ " + (quiz.explanation || "");
        shakeGameScreen();

        // HP ダメージ
        changeHp(-10);

        // 問題ID があれば間違い記録
        if (quiz.questionId) {
          recordMistake(playerData.name, quiz.questionId);
        }
      }

      // HP が 0 ならこの時点でリターン
      if (playerData.hp === 0) {
        return;
      }

      // 次の処理
      setTimeout(() => {
        if (correctCount >= MAX_CORRECT) {
          topTextBox.textContent = "mamは安心して去っていった！";
          stopQuizBgm();
          endBattle();
        } else if (missCount >= MAX_MISS) {
          topTextBox.textContent = "mamは歓喜に震えて去っていった…";
          stopQuizBgm();
          endBattle();
        } else {
          showQuiz();
        }
      }, 3000);
    }

    function recordMistake(playerName, questionId) {
      const params = new URLSearchParams();
      params.append("player", playerName);
      params.append("questionId", questionId);

      fetch(GAS_PERSONAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTPエラー: ${response.status}`);
        }
        return response.json();
      })
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

    // ======================= 11) その他戦闘終了関数 =======================
    function onZaoriku() {
      document.getElementById("zaorikuButton").style.display = "none";
      const dqAudio = document.getElementById("dqDownAudio");
      dqAudio.pause();
      dqAudio.currentTime = 0;
      stopFieldBgm();
      stopBattleBgm();
      stopQuizBgm();
      document.getElementById("top-text-box").textContent = "ザオリクが唱えられた！";
      setTimeout(() => {
        endBattle();
      }, 500);
    }

    function endBattle() {
      stopBattleBgm();
      stopQuizBgm();
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("gameArea").style.display = "block";
      inBattle = false;
      updateBgmButton();

      setTimeout(() => {
        if (isBgmPlaying) {
          playFieldBgm();
        }
      }, 1000);
    }

    // ======================= 12) DOMContentLoaded：ログイン処理 =======================
   document.addEventListener("DOMContentLoaded", () => {
  // google api.js の <script> を探す
  const script = document.querySelector('script[src*="apis.google.com/js/api.js"]');
  if (script) {
    script.addEventListener("load", () => {
      console.log("✅ Google APIがロードされました");
      // gapi.load("client", initClient); など、ここで実行
      
      // 回復ボタンは最初は隠すならここで制御
      // document.getElementById("healButton").style.display = "none";

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

      // ログインボタン
      document.getElementById("loginButton").addEventListener("click", async () => {
        const enteredName = document.getElementById("playerNameInput").value.trim();
        if (!enteredName) {
          alert("名前を入力してください！");
          return;
        }
        try {
          showLoadingOverlay();
          const resp = await fetch(`${GAS_URL}?name=${encodeURIComponent(enteredName)}`);
          if (!resp.ok) throw new Error("ネットワークエラーです");
          const data = await resp.json();
          console.log("データ取得成功:", data);

          playerData.name  = enteredName;
          playerData.level = parseInt(data.level, 10);
          playerData.exp   = parseInt(data.exp, 10);
          playerData.g     = parseInt(data.g, 10);
          playerData.hp    = parseInt(data.hp, 10) || 50;

          updatePlayerStatusUI();

          setTimeout(() => {
            hideLoadingOverlay();
            document.getElementById("loginScreen").style.display = "none";
            document.getElementById("titleScreen").style.display = "flex";
          }, 500);
         
        catch (err) {
          console.error("データ取得エラー:", err);
          hideLoadingOverlay();
          alert("ログインエラーが発生しました。再度お試しください。");
        }
        
 
