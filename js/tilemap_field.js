// tilemap_village.js
(function(){
  const TILE_SIZE = 32; // ここで定義した TILE_SIZE はこの関数内だけの変数
  const MAP_ROWS = 15;
  const MAP_COLS = 15;
  

/** フィールドのタイル画像対応 */
const fieldTileImages = {
  1: "assets/images/tiles/field/1grass.png",
  2: "assets/images/tiles/field/2soil.png",
  3: "assets/images/tiles/field/3gake.png",
  4: "assets/images/tiles/field/4hanabatake.png",
  5: "assets/images/tiles/field/5ipponnnoki.png",
  6: "assets/images/tiles/field/6nihonnnoki.png",
  7: "assets/images/tiles/field/7kirikabu.png",
  8: "assets/images/tiles/field/8horaana.png"
};

/** フィールドのタイルマップデータ */
const fieldTileMap = [
  [6, 6, 6, 6, 6, 6, 2, 2, 6, 6, 6, 6, 6, 6, 6],
  [6, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 6],
  [6, 5, 5, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 6],
  [6, 5, 1, 1, 1, 1, 2, 2, 2, 2, 1, 5, 5, 5, 6],
  [6, 5, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 5, 5, 6],
  [6, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 5, 6],
  [6, 1, 1, 1, 5, 5, 5, 1, 2, 2, 1, 1, 1, 1, 6],
  [6, 5, 5, 5, 5, 2, 2, 2, 2, 2, 1, 1, 1, 1, 6],
  [6, 7, 2, 2, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 6],
  [6, 3, 4, 4, 4, 3, 1, 1, 2, 2, 1, 1, 1, 1, 6],
  [6, 5, 3, 8, 3, 5, 1, 1, 2, 2, 2, 2, 2, 7, 6],
  [6, 1, 1, 2, 1, 5, 5, 5, 2, 2, 1, 1, 1, 1, 6],
  [6, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 6],
  [6, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
];

/** フィールドを描画 */
function drawFieldMap() {
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

document.addEventListener("DOMContentLoaded", drawFieldMap);
