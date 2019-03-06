'use strict';
// キーフラグの実験
let keyFlag;
let myColor;

function setup(){
  colorMode(HSB, 100);
  createGraphics(200, 200);
  myColor = color(0, 100, 100);
  keyFlag = 0;
}

function draw(){
  // 上キーで青、下キーで緑、右キーでオレンジ、左キーで紫。エンターキーで赤に戻る。
  if(keyFlag & 1){
    myColor = color(20, 100, 100);
    keyReset();
  }else if(keyFlag & 2){
    myColor = color(40, 100, 100);
    keyReset();
  }else if(keyFlag & 4){
    myColor = color(60, 100, 100);
    keyReset();
  }else if(keyFlag & 8){
    myColor = color(80, 100, 100);
    keyReset();
  }else if(keyFlag & 16){
    myColor = color(0, 100, 100);
    keyReset();
  }
  fill(myColor);
  rect(40, 40, 40, 40);
  fill(0, 40, 100, 50);
  rect(0, 0, 200, 200);
}

// keuFlagの設定
function keyTyped(){
  if(keyCode === 13){ keyFlag |= 1; } // ENTER
  if(keyCode === 97){ keyFlag |= 2; } // a
  if(keyCode === 98){ keyFlag |= 4; } // b
  if(keyCode === 99){ keyFlag |= 8; } // c
  if(keyCode === 100){ keyFlag |= 16; } // d
  // これで機能するんだったら、szawで→↓←↑ってのもいいかもね。
  // それかクリック位置、あれは反応箇所をグリッドに分けて小さな整数にして処理すると
  // 場合分けめんどくさくないからおすすめ。今日はここまででいいです。また明日。
  console.log(keyCode);
  console.log(RIGHT_ARROW);
}
// keyFlagのリセット
function keyReset(){
  keyFlag = 0;
}
