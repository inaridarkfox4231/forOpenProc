'use strict';
// 接線とか引けたら面白いよね
let base;
let graph;
let myCounter;

let t = 50;

function setup(){
  createCanvas(400, 400);
  base = createGraphics(400, 400);
  drawArrow_pos(200, 398, 200, 2, 'black', base);
  drawArrow_pos(2, 200, 398, 200, 'black', base);
  base.textSize(15);
  base.text('O', 205, 195);
  base.textSize(15);
  base.text('x', 385, 190);
  base.text('y', 210, 15);
  graph = createGraphics(400, 400);
  graph.strokeWeight(1.0);
  graph.translate(200, 200);
  graph.applyMatrix(1, 0, 0, -1, 0, 0);
  //noLoop();
  drawParabora();
  myCounter = new reverseLoopCounter();
  myCounter.setting(400, 1);
}

function draw(){
  background(230);
  image(base, 0, 0);
  image(graph, 0, 0); // グラフ
  translate(200, 200);
  applyMatrix(1, 0, 0, -1, 0, 0);
  myCounter.progress(); // カウントを進める
  drawTangent(myCounter.getCnt() - 200);
  push();
  applyMatrix(1, 0, 0, -1, 0, 0);
  textSize(20);
  text("t=" + (myCounter.getCnt() - 200), -100, 100);
  text("You can pause (P button)", -100, 70)
  pop();
}

function keyTyped(){
  //if(key === 'a'){ t++; }else if(key === 'b'){ t--; }
  if(key === 'p'){ myCounter.pause(); }
}

function drawParabora(){
  let points = [];
  for(let i = -400; i < 400; i++){
    points.push(createVector(i / 2, (i / 2) * (i / 2) * 0.01 + 50)); // y = x^2/100 + 50.
  }
  graph.noFill(); // これやんないと・・
  graph.beginShape();
  graph.curveVertex(points[0].x, points[0].y);
  points.forEach(function(p){
    graph.curveVertex(p.x, p.y)
  })
  graph.curveVertex(points[points.length - 1].x, points[points.length - 1].y);
  graph.endShape();
}

function drawTangent(t){
  let leftEdge, rightEdge;
  leftEdge = (2 * t * (-200) - t * t) * 0.01 + 50;
  rightEdge = (2 * t * 200 - t * t) * 0.01 + 50;
  line(-200, leftEdge, 200, rightEdge);
  push();
  fill('blue');
  noStroke();
  ellipse(t, t * t * 0.01 + 50, 10, 10);
  pop();
}

function drawArrow(base, vec, myColor = 'black', gr){
  // baseが位置ベクトルで、その示す先からvecだけ矢印を伸ばしてベクトルを引く
  gr.push();
  gr.stroke(myColor); // 色付き矢印
  gr.strokeWeight(1.0);
  gr.fill(myColor);
  gr.translate(base.x, base.y); // ちなみにbaseは矢印の根本です
  gr.line(0, 0, vec.x, vec.y); // vecは矢印のベクトルです
  gr.rotate(vec.heading()); // これによりvecがx軸画面で右方向になるように回転しますね
  let arrowSize = 7; // 矢印の大きさ（底辺から頂点までの距離）
  gr.translate(vec.mag() - arrowSize, 0); // 矢印の根元に原点を持ってくる
  gr.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  gr.pop();
}

function drawArrow_vec(v1, v2, myColor = 'black', gr){
  // 位置ベクトルでv1からv2への矢印を引く
  drawArrow(v1, p5.Vector.sub(v2, v1), myColor, gr);
}

function drawArrow_pos(x1, y1, x2, y2, myColor = 'black', gr){
  // 座標で(x1, y1)から(x2, y2)への矢印を引く。
  drawArrow_vec(createVector(x1, y1), createVector(x2, y2), myColor, gr);
}

// アイデア
// 媒介変数表示で4つ葉曲線の接線とか動かせたら面白いわね
// クリックでグラフ差し替えて接線もぐりぐりいじるの

// 以下はreverseLoopCounterの仕様（limitとdiffを決めるとdiffずつの変化で0とlimitの間をいったりきたり）
// しかし実際にはcntは増え続けるのを延々と繰り返してて、返す値だけスイッチしてるの。だからdiffはずっと正。
class counter{
  constructor(){
    this.cnt = 0;
    this.isOn = false;
    this.limit; // -1のときの挙動どうするかな
    this.increaseValue; // 増分（負の場合もある）
  }
  getCnt(){ return this.cnt; }
  getState(){ return this.isOn; } // 状態の取得
  setting(lim, diff){
    this.cnt = 0;
    this.limit = lim;
    this.increaseValue = diff;
    this.isOn = true;
  }
  progress(){
    if(this.isOn){
      this.cnt += this.increaseValue;
      if(this.limit < 0){ return true; } // limitが-1のときは無限ループ
      if(this.cnt > this.limit){ this.isOn = false; } // limitを超えたら停止
    }
    return this.isOn;
  }
  pause(){ // 停止と再生(cntはそのまま)
    this.isOn = !this.isOn;
  }
}
// normalCounter: 普通のカウンター。limitもincreaseValueも正。
// infiniteCounter: 無限に値が増加し続ける。limit = -1, increaseValue > 0.
// waitCounter: limit = -1でずーっと何もしないし0しか返さない。
// トリガーでsettingが発動したらそこからnormalCounterになり一定時間の後終了する。

class loopCounter extends counter{
  constructor(){
    // 値がループするカウンター
    super();
  }
  progress(){
    if(this.isOn){ // こうしないとpauseできない
      this.cnt += this.increaseValue;
      if(this.cnt > this.limit){ this.cnt -= this.limit; } // スイッチはonのまま。
    }
    return this.isOn;
  }
}

class reversibleCounter extends counter{
  // limitから減っていく流れを表現できるカウンター（双方向のやつに使う）
  // 返す値の所だけ分離してそこだけいじる。これにより、値の増加量の符号をいじらなくて済む（すごい！）
  constructor(){
    super();
    this.reverse = false;
  }
  changeReverse(){
    this.reverse = !this.reverse;
  }
  getCnt(){ if(!this.reverse){ return this.cnt; }else{ return this.limit - this.cnt; } }
}

class reverseLoopCounter extends reversibleCounter{
  constructor(){
    // 値が行ったり来たりするカウンター(increaseValueは正とする)
    super();
  }
  progress(){
    if(this.isOn){
      this.cnt += this.increaseValue;
      if(this.cnt > this.limit || this.cnt < 0){
        if(this.cnt < 0){ this.cnt = -this.cnt; }else{ this.cnt = this.cnt - this.limit; }
        this.changeReverse();
      }
    }
    return this.isOn;
  }
}
