/** *******************************************************
 *  1) 定数・グローバル変数
 *******************************************************  */

const GAS_URL = "https://script.google.com/macros/s//AKfycbxGVmYEFp0gbXU3cs0-BlWQNvIGBbZzqiRv2HWhbWycTkqXuYwXjVq3ShK8oh51RDtG/exec";

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
  "./assets/images/playerfront.PNG",  // 正面（立ち止まり）
  "./assets/images/playerleft.PNG",   // 左足前
  "./assets/images/playerright.PNG"   // 右足前
];

/** 戦闘・エンカウント */
let inBattle = false;
let encounterThreshold = getRandomEncounterThreshold();

/** BGM管理 */
let isBgmPlaying = false;

/*******************************************************
 *  2) プレイヤー移動 & 歩行アニメーション
 *******************************************************/

/** 歩数ごとにランダムエンカウント（5～20歩） */
function getRandomEncounterThreshold() {
  return Math.floor(Math.random() * 16) + 5;  // 5～20歩の間
}

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
 *  3) エンカウント・戦闘関連
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
 *  4) BGM 関連
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
 *  5) ゲーム開始処理
 *******************************************************/

/** D-Pad のセットアップ */
function setupDpadControls() {
  const controls = ["up", "down", "left", "right"];
  controls.forEach(dir => {
    const btn = document.getElementById(`dpad-${dir}`);
    if (btn) btn.addEventListener("click", () => {
      const moveMap = { up: [0, -STEP], down: [0, STEP], left: [-STEP, 0], right: [STEP, 0] };
      movePlayer(...moveMap[dir]);
    });
  });
}

/** DOM の読み込み完了後にセットアップ */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    playFieldBgm();
  });
  setupDpadControls();
});
