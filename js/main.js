/** *******************************************************
 *  1) 定数・グローバル変数
 *******************************************************  */

const GAS_URL = "https://script.google.com/macros/s/AKfycbxGVmYEFp0gbXU3cs0-BlWQNvIGBbZzqiRv2HWhbWycTkqXuYwXjVq3ShK8oh51RDtG/exec";

const STEP = 20;  // 1歩の移動距離

/** プレイヤーの初期ステータス */
let playerData = { name: "", level: 1, exp: 0, g: 0, hp: 50 };
let quizData = [];
let monsterData = [];

/** プレイヤーの位置・状態管理 */
let player = { x: 100, y: 100, steps: 0 };
let facingRight = true;  // 右向きかどうか
let currentImageIndex = 0;

/** プレイヤーの歩行アニメーション画像 */
const playerImages = [
  "./assets/images/plyerfront.PNG",  // 正面（立ち止まり）
  "./assets/images/plyerleft.PNG",   // 左足前
  "./assets/images/plyerright.PNG"   // 右足前
];

/** エンカウント設定 */
let inBattle = false;
let encounterThreshold = getRandomEncounterThreshold();  // ← 修正後もOK ✅

/** BGM管理 */
let isBgmPlaying = false;

/*******************************************************
 *  2) ランダムエンカウント設定 (修正済み)
 *******************************************************/

/** 歩数ごとにランダムエンカウント（5～20歩） */
function getRandomEncounterThreshold() {
  return Math.floor(Math.random() * 16) + 5;  // 5～20歩の間
}

/*******************************************************
 *  3) プレイヤー移動 & 歩行アニメーション
 *******************************************************/

/** プレイヤー位置更新 */
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  if (!playerElement) return;

  playerElement.style.left = `${player.x}px`;
  playerElement.style.top = `${player.y}px`;
  playerElement.style.transform = `translate(-50%, -50%) ${facingRight ? "scaleX(1)" : "scaleX(-1)"}`;
  playerElement.src = playerImages[currentImageIndex];  // 歩行アニメーション
}

/** プレイヤー移動処理 */
function movePlayer(dx, dy) {
  if (inBattle) return; // 戦闘中は移動不可

  // 向きを変更
  if (dx < 0) facingRight = false;
  if (dx > 0) facingRight = true;

  // 歩行アニメーションを変更
  currentImageIndex = (currentImageIndex + 1) % playerImages.length;

  // 移動
  player.x += dx;
  player.y += dy;

  // 画面外に出ないよう制限
  const gameArea = document.getElementById("gameArea");
  if (gameArea) {
    const maxX = gameArea.clientWidth - 32;
    const maxY = gameArea.clientHeight - 32;
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > maxX) player.x = maxX;
    if (player.y > maxY) player.y = maxY;
  }

  // 画面更新
  updatePlayerPosition();

  // 歩数カウント & エンカウント判定
  player.steps++;
  if (player.steps >= encounterThreshold) {
    startEncounter();
    player.steps = 0;  // エンカウント後、歩数リセット
    encounterThreshold = getRandomEncounterThreshold();  // 次のエンカウント歩数を設定
  }
}

/*******************************************************
 *  4) エンカウント・戦闘関連
 *******************************************************/

/** ランダムエンカウント発生 */
function startEncounter() {
  console.log("🐉 敵があらわれた！");
  inBattle = true;
  stopFieldBgm();
  playBattleBgm();

  document.getElementById("gameContainer").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
}

/** 戦闘終了（フィールドへ戻る） */
function endBattle() {
  console.log("🎉 戦闘終了！");
  inBattle = false;
  stopBattleBgm();
  playFieldBgm();

  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("gameContainer").style.display = "block";
}

/*******************************************************
 *  5) BGM 関連
 *******************************************************/

function playFieldBgm() {
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

/*******************************************************
 *  6) ゲーム開始処理
 *******************************************************/

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    playFieldBgm();
  });

  document.getElementById("dpad-up").addEventListener("click", () => movePlayer(0, -STEP));
  document.getElementById("dpad-down").addEventListener("click", () => movePlayer(0, STEP));
  document.getElementById("dpad-left").addEventListener("click", () => movePlayer(-STEP, 0));
  document.getElementById("dpad-right").addEventListener("click", () => movePlayer(STEP, 0));
});
