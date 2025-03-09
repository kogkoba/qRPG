// tilemap.js

/** タイルマップデータ（0 = 安全地帯, 1 = エンカウント可能エリア） */
const tileMap = [
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0]
];

/** 1タイルのサイズ（ピクセル単位） */
const TILE_SIZE = 32;

/** プレイヤーの位置をタイル座標に変換 */
function getPlayerTilePosition() {
  return {
    x: Math.floor(player.x / TILE_SIZE),
    y: Math.floor(player.y / TILE_SIZE)
  };
}

/** エンカウント判定（20%の確率で戦闘開始） */
function checkForEncounter() {
  const { x, y } = getPlayerTilePosition();

  if (x < 0 || y < 0 || y >= tileMap.length || x >= tileMap[0].length) {
    return;
  }

  if (tileMap[y][x] === 1) { // 1 = 敵が出るエリア
    if (Math.random() < 0.2) {
      startEncounter();
    }
  }
}

