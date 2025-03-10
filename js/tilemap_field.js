(function(){
  const TILE_SIZE = 32;
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

  window.fieldTileMap = fieldTileMap;
  window.fieldTileImages = fieldTileImages;
})();