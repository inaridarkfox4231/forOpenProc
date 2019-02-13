'use strict';

let myFox;
let bg;

let dx = [1, 0, -1, 0];
let dy = [0, 1, 0, -1];

function setup(){
  createCanvas(160, 160);
  bg = createGraphics(160, 160);
  setBg();
  myFox = new creature();
  myFox.initialize(0, 0);
}

function draw(){
  image(bg, 32, 32);
  myFox.update();
  myFox.display();
}

function setBg(){
  bg.background(200);
  let h1 = new hub(32, 32);
  let h2 = new hub(96, 32);
  let h3 = new hub(32, 96);
  let h4 = new hub(96, 96);
  let f1 = new flow(h1, h2, 0);
  let f2 = new flow(h1, h3, 1);
  let f3 = new flow(h2, h4, 1);
  let f4 = new flow(h3, h4, 0);
  bg.noStroke();
  f1.drawBg(bg);
  f2.drawBg(bg);
  f3.drawBg(bg);
  f4.drawBg(bg);
}

class creature{
  constructor(){
    this.graphic = new graphic(); // 引数にグラフィックのidナンバーを入れることでいろんな以下略
    this.move = new move();
  }
  initialize(x, y){
    this.graphic.initialize();
    this.move.initialize(x, y);
  }
  getKeyState(){
    if(keyIsDown(RIGHT_ARROW)){ return 0; }
    else if(keyIsDown(DOWN_ARROW)){ return 1; }
    else if(keyIsDown(LEFT_ARROW)){ return 2; }
    else if(keyIsDown(UP_ARROW)){ return 3; }
    return -1;
  }
  update(){
    let keyState = this.getKeyState();
    this.graphic.update(keyState);
    this.move.update(keyState);
  }
  display(){
    let x = this.move.getX();
    let y = this.move.getY();
    this.graphic.display(x, y);
  }
}

class graphic{
  constructor(){
    this.img = [];
    this.direction = 0; // →↓←↑
  }
  initialize(){
    for(let i = 0; i < 4; i++){ this.img.push(loadImage("./assets/fox0" + i.toString() + ".png")); }
  }
  update(keyState){
    if(keyState >= 0){ this.direction = keyState; }
  }
  display(x, y){
    // 動きを持たせるならここ(引数調整でフレーム処理もできる). x, yは整数値
    image(this.img[this.direction], x, y);
  }
}

class move{
  constructor(){
    this.fp = createVector();
    this.p = createVector();
    this.v = 0;
    this.maxSpeed = 4;
  }
  initialize(x, y){
    this.fp.set(x, y);
    this.p.set(x, y);
  }
  getX(){ return this.p.x; }
  getY(){ return this.p.y; }
  confirm(){
    // 速度がゼロになったときの処理(衝突時にも行う)
    this.v = 0;
    this.fp.set(this.p.x, this.p.y);
  }
  setSpeed(keyState){
    if(keyState < 0){
      this.confirm();
    }else{
      this.v += 0.1;
      if(this.v > this.maxSpeed){ this.v = this.maxSpeed; }
    }
  }
  update(keyState){
    this.setSpeed(keyState);
    if(keyState < 0){ return; }
    this.fp.x += this.v * dx[keyState];
    this.fp.y += this.v * dy[keyState];
    // 必要ならthis.fpを適宜修正
    // falseが返って速度が0になることもある
    this.p.set(Math.floor(this.fp.x), Math.floor(this.fp.y));
  }
}

class hub{
  constructor(x, y){
    this.pos = createVector(x, y);
  }
  convert(){

  }
}

class flow{
  constructor(h1, h2, typeId){
    this.from = createVector(h1.pos.x, h1.pos.y);
    this.to = createVector(h2.pos.x, h2.pos.y);
    this.typeId = typeId; //0のときはy1とy2が一緒でx1～x2で判定
  }
  convert(){

  }
  drawBg(gr){
    gr.fill(255);
    gr.rect(this.from.x, this.from.y, this.to.x - this.from.x + 32, this.to.y - this.from.y + 32);
  }
}
