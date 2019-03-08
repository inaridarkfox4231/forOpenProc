'use strict';
// sortingMachineに使う積込リストのビジュアル作成
let dictVisual;
let hueSet;
let sample = {};

function setup(){
  createCanvas(640, 480);
  colorMode(HSB, 100); // hueだけでいろいろ指定出来て便利。
  hueSet = [0, 10, 17, 35, 52, 64, 80];
  dictVisual = getDictVisual();
  sample = {a0:22, b1:31, c4:42}
  noLoop();
}

function draw(){
  background(60);
  image(dictVisual, 0, 0);
  sample.forEach(function(d){ console.log(d); })
  console.log(sample[10]);
  console.log(sample[32]);
  console.log(sample.length);
}

// 数字の変更はこれで行こう。
// 黒いrectで覆ったうえで、白の数字で上書き。簡単でしょ。この方が。シンプル。
// class化してメソッドで書き換えさせましょう。
function mouseClicked(){
  let index = randomInt(8);
  dictVisual.push();
  dictVisual.fill(0);
  dictVisual.noStroke();
  dictVisual.rect(40, 40 * index, 50, 40);
  dictVisual.fill(100);
  dictVisual.textSize(20);
  dictVisual.text(randomInt(200), 40, 28 + 40 * index);
  dictVisual.pop();
}

function getDictVisual(){
  let gr = createGraphics(90, 320);
  gr.colorMode(HSB, 100);
  gr.background(0);
  gr.textSize(20);
  for(let i = 0; i < 8; i++){
    gr.image(getGraphic(randomInt(7), randomInt(8)), 0, 40 * i);
    gr.fill(100);
    gr.text(123, 40, 28 + 40 * i);
  }
  return gr;
}

// 横幅は90, 縦幅は種類数×40でいこう。
// テキストは白でベースは黒、黒ベースにitemの画像を乗せていく感じ。
// テキストの表示位置は上にあるように上から28のところに隣でサイズは20. OK. これでいける。
// 実装の際にはsortHubのrenderメソッドにおいてこれが呼び出される、ただアイコン部分とベース部分はbgLayerに書く。
// objLayerのところ・・んー。MachineのbgLayerにこれをrenderingするか、最初の所で。
// そのうえで、ここだけ別にobjLayerに毎フレーム書く感じで。その、sortHubの配列を持たせておいて、毎フレーム。

function getGraphic(myColorId, figureId){
  let gr = createGraphics(40, 40);
  gr.colorMode(HSB, 100);
  // 形のバリエーションは個別のプログラムでやってね
  let myColor = color(hueSet[myColorId], 100, 100);
  gr.clear();
  gr.push();
  gr.noStroke();
  gr.fill(myColor);
  if(figureId === 0){
    // 正方形
    gr.rect(10, 10, 20, 20);
    gr.fill(255);
    gr.rect(15, 15, 2, 5);
    gr.rect(23, 15, 2, 5);
  }else if(figureId === 1){
    // 星型
    let outer = rotationSeq(0, -12, 2 * PI / 5, 5, 20, 20);
    let inner = rotationSeq(0, 6, 2 * PI / 5, 5, 20, 20);
    for(let i = 0; i < 5; i++){
      let k = (i + 2) % 5;
      let l = (i + 3) % 5;
      gr.quad(outer[i].x, outer[i].y, inner[k].x, inner[k].y, 20, 20, inner[l].x, inner[l].y);
    }
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 2){
    // 三角形
    gr.triangle(20, 20 - 24 / Math.sqrt(3), 32, 20 + (12 / Math.sqrt(3)), 8, 20 + (12 / Math.sqrt(3)));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 3){
    // ひしがた
    gr.quad(28, 20, 20, 20 - 10 * Math.sqrt(3), 12, 20, 20, 20 + 10 * Math.sqrt(3));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 4){
    // 六角形
    gr.quad(32, 20, 26, 20 - 6 * Math.sqrt(3), 14, 20 - 6 * Math.sqrt(3), 8, 20);
    gr.quad(32, 20, 26, 20 + 6 * Math.sqrt(3), 14, 20 + 6 * Math.sqrt(3), 8, 20);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 5){
    // なんか頭ちょろってやつ
    gr.ellipse(20, 20, 20, 20);
    gr.triangle(20, 20, 20 - 5 * Math.sqrt(3), 15, 20, 0);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 6){
    // 逆三角形
    gr.triangle(20, 20 + 24 / Math.sqrt(3), 32, 20 - (12 / Math.sqrt(3)), 8, 20 - (12 / Math.sqrt(3)));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 7){
    // デフォルト用の円形
    gr.ellipse(20, 20, 20, 20);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }
  gr.pop();
  return gr;
}

function rotationSeq(x, y, angle, n, centerX = 0, centerY = 0){
  // (x, y)をangleだけ0回～n-1回回転させたもののセットを返す(中心はオプション、デフォルトは0, 0)
  let array = [];
  let vec = createVector(x, y);
  array.push(createVector(x + centerX, y + centerY));
  for(let k = 1; k < n; k++){
    vec.set(vec.x * cos(angle) - vec.y * sin(angle), vec.x * sin(angle) + vec.y * cos(angle));
    array.push(createVector(vec.x + centerX, vec.y + centerY));
  }
  return array;
}

function randomInt(n){
  // 0, 1, ..., n-1のどれかを返す
  return Math.floor(random(n));
}
