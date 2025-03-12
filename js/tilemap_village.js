// tilemap_village.js
(function() {
  const TILE_SIZE = 32;



  // 変更後（16×16）の設定
  const MAP_ROWS = 16;
  const MAP_COLS = 16;
  /** 村のタイルマップデータ(新) */
  const tileMapVillage = [
    [4,  4,  4,  4,  4,  4,  4,  9,  9, 14,  9,  4,  4,  9,  9,  4],
    [4,  1,  1,  1,  1,  1,  1,  9, 15, 16,  9,  4,  9, 12, 12,  9],
    [4, 10, 10, 10, 10, 10, 10,  9, 11, 11,  9,  4,  9, 11, 11,  9],
    [4, 10,  4,  4,  4, 10, 10,  9, 11, 11,  9,  4,  9, 11, 11,  9],
    [4, 10,  4,  4,  4, 10, 10,  4, 10, 10,  4,  4,  4, 10, 10,  4],
    [4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4],
    [4,  1,  1, 10,  1,  1,  1, 10,  1,  1,  1, 10,  1,  1,  1,  4],
    [4,  1,  1, 10, 10, 10, 10, 10,  1,  1,  1, 10,  1,  1,  1,  4],
    [4,  1,  1,  1,  1,  1,  1, 10,  1,  1,  1, 10,  1,  1,  1,  4],
    [4,  1,  1,  1,  1,  1,  1, 10,  1,  1,  1, 10,  1,  1,  1,  4],
    [4,  1,  1,  1,  1,  1,  1, 10, 10, 10, 10, 10, 10, 10, 10,  4],
    [4,  1,  1,  1,  1,  1,  1, 10, 10,  4,  7,  7,  4,  7,  7,  4],
    [9, 11, 11,  9, 10, 10, 10, 10, 10,  9, 11, 11,  9, 11, 11,  9],
    [9, 11, 11,  9,  1,  1,  1, 10, 10,  9, 11, 11,  9, 11, 11,  9],
    [9, 11, 11,  9,  1,  1,  1, 10, 10,  9, 11, 11,  9, 11, 11,  9],
    [9,  9, 18,  9,  4,  4,  4, 10, 10,  9,  9, 17,  9,  9, 13,  4],
  ];

  // タイル番号と画像パスの対応はそのまま流用
  const tileImagesVillage = {
    1: "assets/images/tiles/village/1grass.png",  
    4: "assets/images/tiles/village/4hanabatake.png",  
    7: "assets/images/tiles/village/7kirikabu.png",  
    9: "assets/images/tiles/village/9matinohei.png",  
    10: "assets/images/tiles/village/10matinomiti.png", 
    11: "assets/images/tiles/village/11muranoka-petto.png",
    12: "assets/images/tiles/village/12kyoukai.png",
    13: "assets/images/tiles/village/13buki.png",
    14: "assets/images/tiles/village/14yado.png",
    15: "assets/images/tiles/village/15bed1.png",
    16: "assets/images/tiles/village/16bed2.png",
    17: "assets/images/tiles/village/17bougu.png",
    18: "assets/images/tiles/village/18kusuri.png",
  };

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

  // 村マップ描画はDOM読み込み後に
  document.addEventListener("DOMContentLoaded", drawvillageMap);

  // グローバルで使う場合
  window.tileMapVillage = tileMapVillage;
  window.tileImagesVillage = tileImagesVillage;
})();
