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
 *  2) スプレッドシートからデータ取得
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

/*******************************************************
 *  3) ログイン処理
 *******************************************************/

document.addEventListener("DOMContentLoaded", () => {
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
        playerData.name = data.name;
        playerData.level = parseInt(data.level, 10);
        playerData.exp = parseInt(data.exp, 10);
        playerData.g = parseInt(data.g, 10);
        playerData.hp = parseInt(data.hp, 10) || 50;
        updatePlayerStatusUI();

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
});
