
// main.js

// グローバル関数として定義すると、HTMLの onclick="startGame()" から呼べる
window.startGame = function() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
  // ゲーム開始の処理 (BGM再生や初期化など)
};

// BGMのON/OFF切り替え
window.toggleBgm = function() {
  const bgm = document.getElementById("fieldBGM");
  if (bgm.paused) {
    bgm.play();
  } else {
    bgm.pause();
  }
};

// Google APIの読み込み完了 (onload="gapiLoaded()")
window.gapiLoaded = function() {
  console.log("✅ gapiLoaded が呼ばれました");
  // ここで gapi.load("client", initClient) などを行う
};


// などなど、あなたのゲームに必要な処理をここに書く
