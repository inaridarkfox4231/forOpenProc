'use strict';
// キーフラグの実験
let kf;
let myColor;

function setup(){
  kf = new keyFlag();
  colorMode(HSB, 100);
  myColor = color(0, 100, 100);
}

function draw(){
  background(myColor);
  // 上キーで青、下キーで緑、右キーでオレンジ、左キーで紫。エンターキーで赤に戻る。

}

class keyFlag{
  constructor(){
    this.flag = 0;
    this.lastKey = 0; // 最後に押したキーのコード。
    this.bitSet = {39:1, 40:2, 37:4, 38:8, 13:3};
  }
  update(){
    // フレームの最初に押されていないとthis.lastKeyがその値になってフレームの最後に-1に戻る感じ。
    if(keyIsDown(39)){ this.flag |= 1; }else{ this.flag ^= 1; } // 右向き矢印
    if(keyIsDown(40)){ this.flag |= 2; }else{ this.flag ^= 2; } // 下向き矢印
    if(keyIsDown(37)){ this.flag |= 4; }else{ this.flag ^= 4; } // 左向き矢印
    if(keyIsDown(38)){ this.flag |= 8; }else{ this.flag ^= 8; } // 上向き矢印
    if(keyIsDown(13)){ this.flag |= 16; }else{ this.flag ^= 16; } // エンターキー
    // さらに、たとえば1のフラグが立っていないときに押されるとlastKeyに登録され、
    // 立っているときは再登録されない感じ。（-1でも更新されない）
    // keyIsDownで |= 1024 して離されたら ^= 1024する。そして& 1024でfalseのときだけ登録。
    // 一方、値が使われる時にも0に変わる・・んー。
  }
}
