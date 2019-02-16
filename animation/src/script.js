'use strict';
// 加速バージョン
// グラフィックの整理
// リファクタリング

const GRID_SIZE = 32;
const dirName = ['right', 'down', 'left', 'up'];
let playerImages = [];
// hubに持たせる各方向のflow, というかpathのコードネームみたいなやつ

let dangeonMap;

function preload(){
  for(let i = 0; i < 4; i++){ playerImages.push(loadImage("./assets/" + dirName[i] + "_0.png")); }
  for(let i = 0; i < 4; i++){ playerImages.push(loadImage("./assets/" + dirName[i] + "_1.png")); }
}

function setup(){
  createCanvas(320, 320);
  dangeonMap = new dangeon();
  //createPattern();
  createPattern2();
  dangeonMap.createMap();
}

function draw(){
  image(dangeonMap.baseMap, 0, 0);
  dangeonMap.actors.forEach(function(a){
    a.update();
    a.display();
  })
}

// カウンターは使わないよ

class corner{
  // 結節点
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.connected = {}; // つながってるflowを与える辞書
    this.flag = 0; // たとえば右と下に開いているなら0011とかそういうの
  }
  registPath(f, dirId){
    this.connected[dirName[dirId]] = f;
    this.flag |= (1 << dirId);
  }
  // ハブから外に出る
  getDirection(keyState, dist = 0){
    //console.log("%d keyState %d", this.flag, 1 << keyState);
    if(this.flag & (1 << keyState)){ return keyState; }
    return -1;
  }
  getConnected(dirId){
    return this.connected[dirName[dirId]]; // たとえばdirIdが1なら下につながるflowを返す
  }
  calcPos(actor, moveDir){
    // keyStateに応じてあれを返す
    let newPath = this.connected[dirName[moveDir]];
    actor.state = newPath; // 隣接flowを返す
    if(moveDir < 2){ actor.setDistance(0); }
    else{ actor.setDistance(newPath.span); }
  }
}

function randomInt(n){ return Math.floor(random(n)); } // 0, 1, 2, ..., n-1 のどれかを返す汎用関数

class path{
  // pathにしようかなぁ
  constructor(h1, h2){
    this.luCorner = h1; // 左、上
    this.rdCorner = h2; // 右、下
    this.span = abs(h1.x - h2.x) + abs(h1.y - h2.y);
    this.type; // 0が左右、1が上下
    if(h1.y === h2.y){ this.type = 0; }else{ this.type = 1; }
  }
  getDirection(keyState, dist){
    // 通路に平行
    if(this.type === (keyState % 2)){ return keyState; }
    // 通路に垂直、ハブの近く
    if(dist < 16){
      if(this.type === 0){ return 2; }else{ return 3; }
    }else if(this.span - dist < 16){
      if(this.type === 0){ return 0; }else{ return 1; }
    }
    return -1;
  }
  getSpan(){ return this.span; } // やっぱ必要かも
  getConnected(dirId){
    if(dirId < 2){ return this.rdCorner; }else{ return this.luCorner; }
  }
  calcPos(actor, moveDir){
    // flow内における位置の調整。カウントの増減で位置を制御する
    if(moveDir < 2){ actor.distance += actor.speed; }
    else{ actor.distance -= actor.speed; }
    // 隣接ハブへの接続
    if(actor.distance < 0){
      actor.state = this.luCorner;
      actor.pos.set(this.luCorner.x, this.luCorner.y);
    }else if(actor.distance > this.span){
      actor.state = this.rdCorner;
      actor.pos.set(this.rdCorner.x, this.rdCorner.y);
    }else{
      // ハブに到達しない時は普通に位置を更新する
      actor.pos.set(map(actor.distance, 0, this.span, this.luCorner.x, this.rdCorner.x), map(actor.distance, 0, this.span, this.luCorner.y, this.rdCorner.y))
    }
  }
  drawOrbit(gr){
    // 矢印もなくなる（行き来するので）
    gr.push();
    gr.fill(230);
    gr.noStroke();
    let x = this.luCorner.x - GRID_SIZE / 2;
    let y = this.luCorner.y - GRID_SIZE / 2;
    let w = this.rdCorner.x - this.luCorner.x + GRID_SIZE;
    let h = this.rdCorner.y - this.luCorner.y + GRID_SIZE;
    console.log("%d %d %d %d", x, y, w, h);
    gr.rect(x, y, w, h);
    gr.pop();
  }
}

// えーと
// calcPosは-1, 0, 1, 2, 3のどれかを返す。
// それに応じてconvert. 以上。
class actor{
  constructor(h, speed){
    this.pos = createVector(h.x, h.y);
    this.state = h; // ハブからスタート
    this.fpos = createVector(h.x, h.y);
    this.speed = 0;
    this.maxSpeed = 4;
    this.visual = new figure(); // 表現
    this.distance = 0; // flowにいるときの位置計算用
    // 十字キーで操作できるように改良して。
    this.direction = 0;
  }
  static getKeyState(){
    if(keyIsDown(RIGHT_ARROW)){ return 0; }
    else if(keyIsDown(DOWN_ARROW)){ return 1; }
    else if(keyIsDown(LEFT_ARROW)){ return 2; }
    else if(keyIsDown(UP_ARROW)){ return 3; }
    return -1;
  }
  setDistance(d){ this.distance = d; }
  update(){
    let keyState = actor.getKeyState();
    if(keyState < 0){ this.speed = 0; return; }
    // ここで向き補正
    this.direction = keyState;
    let moveDirection = this.state.getDirection(keyState, this.distance);
    if(moveDirection < 0){ this.speed = 0; return; }
    this.speed = min(this.speed + 0.1, this.maxSpeed);
    this.state.calcPos(this, moveDirection);
  }
  display(){
    this.visual.display(this.pos, this.direction); // ここで描画
  }
}

class figure{
  constructor(){
    //this.rotation = random(2 * PI);
    this.myFrame = 0;
  }
  display(pos, dirId){
    this.myFrame = (this.myFrame + 1) % 60;
    let x = pos.x - 14;
    let y = pos.y - 14;
    let kind = Math.floor(this.myFrame / 30) * 4;
    image(playerImages[dirId + kind], x, y);
  }
}

class dangeon{
  constructor(){
    this.corners = [];
    this.paths = [];
    this.actors = []; // actorsは敵キャラも含めて別のまとまりに持たせた方がいいかも。interaction考えると。
    this.baseMap = createGraphics(width, height);
  }
  createMap(){
    this.baseMap.background(130);
    this.paths.forEach(function(f){
      f.drawOrbit(this.baseMap);
    }, this)
    // 将来的にはここでは固定部分だけを描画して可変部分は毎フレーム描画みたいな感じにしたい。
  }
  registCorner(posX, posY){
    let n = posX.length;
    for(let i = 0; i < n; i++){ this.corners.push(new corner(16 + 32 * posX[i], 16 + 32 * posY[i])); }
  }
  registPath(luCornersId, rdCornersId){
    let n = luCornersId.length;
    for(let i = 0; i < n; i++){
      let luCorner = this.corners[luCornersId[i]];
      let rdCorner = this.corners[rdCornersId[i]];
      let newPath = new path(luCorner, rdCorner);
      this.paths.push(newPath);
      if(newPath.type === 0){ luCorner.registPath(newPath, 0); rdCorner.registPath(newPath, 2); }
      else{ luCorner.registPath(newPath, 1); rdCorner.registPath(newPath, 3); }
    }
  }
}
function createPattern(){
  let posX = [1, 3, 1, 3];
  let posY = [1, 1, 3, 3];
  dangeonMap.registCorner(posX, posY);
  let luCornersId = [0, 0, 1, 2];
  let rdCornersId = [1, 2, 3, 3];
  dangeonMap.registPath(luCornersId, rdCornersId);
  dangeonMap.actors.push(new actor(dangeonMap.corners[0], 3));
}
function createPattern2(){
  let posX = [1, 1, 1, 3, 3, 3, 5, 5, 5, 8, 8, 8];
  let posY = [1, 5, 8, 3, 5, 8, 3, 5, 8, 1, 5, 8];
  dangeonMap.registCorner(posX, posY);
  let lus = [0, 9, 6, 1, 4, 7, 10, 0, 3, 1, 4, 7, 2, 5, 8];
  let rds = [1, 10, 7, 2, 5, 8, 11, 9, 6, 4, 7, 10, 5, 8, 11];
  dangeonMap.registPath(lus, rds);
  dangeonMap.actors.push(new actor(dangeonMap.corners[0], 3));
}
