// tilemap_village.js
(function(){
  const TILE_SIZE = 32; // ここで定義した TILE_SIZE はこの関数内だけの変数
  const MAP_ROWS = 15;
  const MAP_COLS = 15;
  

/** 村のタイルマップデータ */
const tileMapVillage = [
  [4, 4, 4, 4, 4, 4, 9, 9, 14, 9, 4, 4, 9, 9, 4],
  [4, 1, 1, 1, 1, 1, 9, 15, 16, 9, 4, 9, 12, 12, 9],
  [4, 10, 10, 10, 10, 10, 9, 11, 11, 9, 4, 9, 11, 11, 9],
  [4, 10, 4, 4, 4, 10, 9, 11, 11, 9, 4, 9, 11, 11, 9],
  [4, 10, 4, 4, 4, 10, 4, 10, 10, 4, 4, 4, 10, 10, 4],
  [4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 4],
  [4, 1, 1, 10, 1, 1, 10, 1, 1, 1, 10, 1, 1, 1, 4],
  [4, 1, 1, 10, 10, 10, 10, 1, 1, 1, 10, 1, 1, 1, 4],
  [4, 1, 1, 1, 1, 1, 10, 1, 1, 1, 10, 1, 1, 1, 4],
  [4, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 4],
  [4, 1, 1, 1, 1, 1, 10, 10, 4, 7, 7, 4, 7, 7, 4],
  [9, 11, 11, 9, 10, 10, 10, 10, 9, 11, 11, 9, 11, 11, 9],
  [9, 11, 11, 9, 1, 1, 10, 10, 9, 11, 11, 9, 11, 11, 9],
  [9, 11, 11, 9, 1, 1, 10, 10, 9, 11, 11, 9, 11, 11, 9],
  [9, 9, 18, 9, 4, 4, 10, 10, 9, 9, 17, 9, 9, 13, 4],
];

/** タイル番号と画像パスの対応 */
const tileImagesVillage = {
  1: "./assets/images/tiles/village/1grass.png",  // 草地
  4: "./assets/images/tiles/village/4hanabatake.png",  // 花畑
  7: "./assets/images/tiles/village/7kirikabu.png",  // 切り株
  9: "./assets/images/tiles/village/9matinohei.png",  // 道のへい
  10: "./assets/images/tiles/village/10matinomiti.png", // 道
  11: "./assets/images/tiles/village/11muranoka-petto.png", // カーペット
  12: "./assets/images/tiles/village/12kyoukai.png", // 教会
  13: "./assets/images/tiles/village/13buki.png", // 鍛冶屋
  14: "./assets/images/tiles/village/14yado.png", // 宿屋
  15: "./assets/images/tiles/village/15bed1.png", // ベッド1
  16: "./assets/images/tiles/village/16bed2.png", // ベッド2
  17: "./assets/images/tiles/village/17bougu.png", // 防具
  18: "./assets/images/tiles/village/18kusuri.png", // 薬屋
};



/** 村を描画 */
function drawvillageMap() {
  const gameArea = document.getElementById("gameArea");
  gameArea.innerHTML = "";

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tileValue = tileMapVillage[row][col];
      const tileSrc = tileImagesVillage[tileValue];

      if (!tileSrc) continue;

      const tileElement = document.createElement("img");
      tileElement.src = tileSrc;
      tileElement.style.position = "absolute";
      tileElement.style.width = `${TILE_SIZE}px`;
      tileElement.style.height = `${TILE_SIZE}px`;
      tileElement.style.left = `${col * TILE_SIZE}px`;
      tileElement.style.top = `${row * TILE_SIZE}px`;

      gameArea.appendChild(tileElement);
    }
  }
}

// ※ イベントリスナーで正しい関数名を指定する
document.addEventListener("DOMContentLoaded", drawvillageMap);

    // グローバルに村マップデータとして利用するため、必要なら以下でエクスポート（例：window.tileMapVillage = tileMapVillage;）
  window.tileMapVillage = tileMapVillage;
  window.tileImagesVillage = tileImagesVillage;
})();
