/** 村用タイルマップ */
const TILE_SIZE = 32; // 1タイルのサイズ
const MAP_ROWS = 15;
const MAP_COLS = 15;

/** タイル番号と画像パスの対応 */
const tileImagesVillage = {
  1: "assets/images/tiles/village/1grass.png",  // 草地
  4: "assets/images/tiles/village/4hanabatake.png",  // 花畑
  7: "assets/images/tiles/village/7bougu.png",  // 防具屋
  9: "assets/images/tiles/village/9matinohei.png",  // 道のへり
  10: "assets/images/tiles/village/10matinomiti.png", // 道
  11: "assets/images/tiles/village/11yado.png", // 宿屋
  12: "assets/images/tiles/village/12buki.png", // 武器屋
  13: "assets/images/tiles/village/13kajiya.png", // 鍛冶屋
  14: "assets/images/tiles/village/14yado.png", // 宿屋
  15: "assets/images/tiles/village/15bed1.png", // ベッド1
  16: "assets/images/tiles/village/16bed2.png", // ベッド2
  17: "assets/images/tiles/village/17temple.png", // 神殿
  18: "assets/images/tiles/village/18kusuri.png", // 薬屋
};



/** フィールドを描画 */
function drawvillageMap() {
  const gameArea = document.getElementById("gameArea");
  gameArea.innerHTML = "";

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tileValue = fieldTileMap[row][col];
      const tileSrc = fieldTileImages[tileValue];

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

document.addEventListener("DOMContentLoaded", drawvillagedMap);


};
