(function(){
  const TILE_SIZE = 32; 
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
    18: "assets/images/tiles/village/18kusuri.png"
  };

  window.tileMapVillage = tileMapVillage;
  window.tileImagesVillage = tileImagesVillage;
})();