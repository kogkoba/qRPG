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
