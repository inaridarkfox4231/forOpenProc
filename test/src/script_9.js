'use strict';
// いわゆるブリンクってやつ。
// 確か、2回攻撃されても大丈夫なときにこれができて、
// やられると一つ消えて一つ消えて元に戻るってのあったっけ、なんだっけ。・・忘れた。アクションだったと思うんだけど。

let select;
let actorGraphics = [];
let myActor;
const GRAPHICS_NUM = 7;

function setup(){
  createCanvas(400, 400);
  registActorGraphics();
  select = new selectUI();
  myActor = new actor(1, 100, 0);
}

function draw(){
  background(220);
  //select.display();
  myActor.update();
  myActor.display();
}

// グラフィックの登録
function registActorGraphics(){
  // ここにカラーの一覧をね
  let figureColors = [];
  figureColors.push([color(0, 0, 255), color(255, 0, 0), color(163, 73, 164), color(0), color(32, 168, 72), color(0, 162, 232), color(255, 242, 0)]);
  figureColors.push([color(60, 60, 255), color(255, 60, 60), color(188, 105, 188), color(70), color(55, 217, 104), color(85, 204, 255), color(255, 247, 81)]);
  figureColors.push([color(120, 120, 255), color(255, 120, 120), color(200, 135, 200), color(130), color(121, 230, 154), color(159, 226, 255), color(255, 250, 153)]);
  for(let index = 0; index < 3; index++){
    for(let i = 0; i < GRAPHICS_NUM; i++){
      let img = createGraphics(20, 20);
      img.noStroke();
      createActorGraphics(img, i, figureColors[index][i]);
      actorGraphics.push(img);
    }
  }
}

class actor{
  constructor(x, y, index){
    this.pos = createVector(x, y);
    this.posArray = [];
    for(let i = 0; i < 11; i++){ this.posArray.push(createVector(x, y)); }
    this.visual = [new figure(index), new figure(index + GRAPHICS_NUM), new figure(index + 2 * GRAPHICS_NUM)];
    this.moving = true;
  }
  update(){
    if(!this.moving){ return; }
    this.pos.x += 1;
    this.pos.y = this.pos.x + 20 * sin(this.pos.x * 2 * PI / 60);
    this.posArray.shift();
    this.posArray.push(createVector(this.pos.x, this.pos.y));
    if(this.pos.x > 500){ this.quit(); }
  }
  display(){
    this.visual[0].display(this.pos);
    this.visual[1].display(this.posArray[5]);
    this.visual[2].display(this.posArray[0]);
  }
  quit(){ this.moving = false; }
}

// グラフィックの詳細
function createActorGraphics(img, graphicsId, figureColor){
  img.fill(figureColor);
  if(graphicsId === 0){ // 普通の正方形
    //img.fill(0, 0, 255);
    img.rect(3, 3, 14, 14);
  }else if(graphicsId === 1){ // 三角形（火のイメージ）
    //img.fill(255, 0, 0);
    img.triangle(10, 0, 10 + 5 * sqrt(3), 15, 10 - 5 * sqrt(3), 15);
  }else if(graphicsId === 2){ // ダイヤ型（クリスタルのイメージ）（色合い工夫してもいいかも）
    //img.fill(187, 102, 187);
    img.quad(10, 0, 10 + 10 / sqrt(3), 10, 10, 20, 10 - 10 / sqrt(3), 10);
  }else if(graphicsId === 3){ // 手裏剣（忍者のイメージ）
    //img.fill(0);
    img.quad(7, 6, 13, 0, 13, 14, 7, 20);
    img.quad(0, 7, 14, 7, 20, 13, 6, 13);
    img.fill(255);
    img.ellipse(10, 10, 5, 5);
  }else if(graphicsId === 4){ // くさび型（草のイメージ・・くさびだけに（？）
    //img.fill(32, 168, 72);
    img.quad(10, 2, 2, 18, 10, 10, 18, 18);
  }else if(graphicsId === 5){ // 水色のなんか
    //img.fill(0, 162, 232);
    for(let k = 0; k < 6; k++){
      let t = 2 * PI * k / 6;
      let t1 = t + 2 * PI / 20;
      let t2 = t - 2 * PI / 20;
      img.quad(10 + 10 * sin(t), 10 - 10 * cos(t), 10 + 5 * sin(t1), 10 - 5 * cos(t1), 10, 10, 10 + 5 * sin(t2), 10 - 5 * cos(t2));
    }
  }else if(graphicsId === 6){ // 星。
    //img.fill(255, 242, 0);
    for(let k = 0; k < 5; k++){
      let t = 2 * PI * k / 5;
      let t1 = t - 2 * PI / 10;
      let t2 = t + 2 * PI / 10;
      img.triangle(10 + 10 * sin(t), 10 - 10 * cos(t), 10 + 5 * sin(t1), 10 - 5 * cos(t1), 10 + 5 * sin(t2), 10 - 5 * cos(t2));
    }
    img.ellipse(10, 10, 10, 10);
  }
}

class selectUI{
  constructor(){
    // 関数を持たせるとか・・グローバルの。状態を変える・・
    this.base = createGraphics(40, 280);
    this.base.background(90);
    this.selectArea = createGraphics(40, 40);
    this.state = 4; // 0~6
    this.count = 0;
    this.figures = [];
    for(let i = 0; i < GRAPHICS_NUM * 3; i++){
      this.figures.push(new figure(i));
    }
    for(let i = 0; i < GRAPHICS_NUM; i++){
      this.figures[i + GRAPHICS_NUM].rotation = this.figures[i].rotation;
      this.figures[i + 2 * GRAPHICS_NUM].rotation = this.figures[i].rotation;
    }
  }
  display(){
    this.count = (this.count + 1) % 360;
    this.selectArea.background(150 + 30 * cos(2 * PI * this.count / 180));
    image(this.base, 0, 0);
    image(this.selectArea, 0, 40 * this.state);
    for(let i = 0; i < GRAPHICS_NUM; i++){
      for(let index = 0; index < 3; index++){
        this.figures[i + index * GRAPHICS_NUM].display(createVector(20 + index * 40, 20 + 40 * i));
      }
    }
  }
  change(newState){ this.count = 0; this.state = newState; }
}

class figure{
  constructor(kind){
    this.kind = kind;
    this.rotation = random(2 * PI);
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    this.rotation += 0.1;
    rotate(this.rotation);
    image(actorGraphics[this.kind], -10, -10);
    pop();
  }
}

function mouseClicked(){
  let mx = mouseX;
  if(mx >= 40 || mx <= 0){ return; }
  let my = mouseY;
  if(my >= 280 || my <= 0){ return; }
  select.change(Math.floor(my / 40));
}

// ベースのとその上のグラフィックくるくるからなる感じ
