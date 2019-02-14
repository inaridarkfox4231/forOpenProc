// 仕様
// まあ、あれはまた今度考えるということで・・・・・・・・
// タイルを100枚用意する。20×20のサイズで横に10枚、縦に10枚、合計100枚。
// ふるいのアルゴリズムを毎フレーム行う
// 予め素数として確認されたタイルのidとはがすタイルのidを格納する配列を作っておき
// アルゴリズムの際にそこにそれを放り込んでいく
// そして毎フレームその配列が空でない限り1枚ずつ確定(confirm), または不適当(fall)の処理を行う
// ふるいのアルゴリズムの方が先に終了するので
// 以降はタイルをはがしたり確定させるだけ
// shiftが使えそう
// 剥がしたタイルは配列からも・・消さなくていい。そのまま。
// 参照するのがめんどくさい。どっちがいいかな・・

'use strict';

let all;

function setup(){
  createCanvas(200, 200);
  all = new entity(100);
  all.set();
  noLoop();
}

function draw(){
  background(220);
  all.draw();
}

class tile{
  constructor(n){ // n:1~100
    this.id = n;
    this.pos = createVector(20 * ((n - 1) % 10), 20 * Math.floor((n - 1) / 10));
    this.visual = new figure();
  }
  set(){
    this.visual.set();
  }
  draw(){
    image(this.visual.graphic, this.pos.x + 1, this.pos.y + 1);
  }
}

// tileがはがれて落ちるところを実装したい

class figure{
  constructor(){
    this.graphic = createGraphics(18, 18);
  }
  set(){
    this.graphic.fill(220);
    this.graphic.rect(0, 0, 18, 18);
  }
  changeColor(newColor){
    this.graphic.clear();
    this.graphic.fill(newColor);
    this.graphic.rect(0, 0, 18, 18);
  }
}

// entityがエラトステネスやったりタイルを落としたりする
class entity{
  constructor(size){
    this.tiles = [];
    for(let n = 1; n <= size; n++){ this.tiles.push(new tile(n)); }
    this.confirmed_tiles = []; // 確定させるタイル
    this.incorrect_tiles = []; // 剥がすタイル
  }
  set(){ this.tiles.forEach(function(t){ t.set(); }) }
  draw(){ this.tiles.forEach(function(t){ t.draw(); }) }
}
