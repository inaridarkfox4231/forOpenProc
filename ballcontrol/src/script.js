'use strict';
// 固定スピード移動バージョン

const HUB_RADIUS = 5;
const dirName = ['right', 'down', 'left', 'up'];
// hubに持たせる各方向のflow, というかpathのコードネームみたいなやつ

let graph;

function setup(){
  createCanvas(400, 400);
  graph = new entity();
  createPattern();
  graph.createGraph();
}

function draw(){
  image(graph.baseGraph, 0, 0);
  graph.actors.forEach(function(mf){
    mf.update();
    mf.display();
  })
}

// カウンターは使わないよ

class hub{
  // 結節点
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.connected = {}; // つながってるflowを与える辞書
    this.flag = 0; // たとえば右と下に開いているなら0011とかそういうの
  }
  registFlow(f, dirId){
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
    let newFlow = this.connected[dirName[moveDir]];
    actor.state = newFlow; // 隣接flowを返す
    if(moveDir < 2){ actor.setDistance(0); }
    else{ actor.setDistance(newFlow.span); }
  }
}

function randomInt(n){ return Math.floor(random(n)); } // 0, 1, 2, ..., n-1 のどれかを返す汎用関数

class flow{
  // pathにしようかなぁ
  constructor(h1, h2){
    this.luHub = h1; // 左、上
    this.rdHub = h2; // 右、下
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
    if(dirId < 2){ return this.rdHub; }else{ return this.luHub; }
  }
  calcPos(actor, moveDir){
    // flow内における位置の調整。カウントの増減で位置を制御する
    if(moveDir < 2){ actor.distance += actor.speed; }
    else{ actor.distance -= actor.speed; }
    // 隣接ハブへの接続
    if(actor.distance < 0){
      actor.state = this.luHub;
      actor.pos.set(this.luHub.x, this.luHub.y);
    }else if(actor.distance > this.span){
      actor.state = this.rdHub;
      actor.pos.set(this.rdHub.x, this.rdHub.y);
    }else{
      // ハブに到達しない時は普通に位置を更新する
      actor.pos.set(map(actor.distance, 0, this.span, this.luHub.x, this.rdHub.x), map(actor.distance, 0, this.span, this.luHub.y, this.rdHub.y))
    }
  }
  drawOrbit(gr){
    // 矢印もなくなる（行き来するので）
    gr.push();
    gr.strokeWeight(1.0);
    gr.line(this.luHub.x, this.luHub.y, this.rdHub.x, this.rdHub.y);
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
    this.speed = speed; // 十字キー押してる間の移動距離数になりそう（？）
    this.visual = new figure(); // 表現
    this.distance = 0; // flowにいるときの位置計算用
    // 十字キーで操作できるように改良して。
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
    if(keyState < 0){ return; }
    //console.log("actor keyState %d", keyState);
    let moveDirection = this.state.getDirection(keyState, this.distance);
    if(moveDirection < 0){ return; }
    this.state.calcPos(this, moveDirection);
  }
  display(){
    this.visual.display(this.pos); // ここで描画
  }
}

class figure{
  constructor(){
    this.rotation = random(2 * PI);
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    this.rotation += 0.1;
    rotate(this.rotation);
    rect(-10, -10, 20, 20);
    pop();
  }
}

class entity{
  constructor(){
    this.hubs = [];
    this.flows = [];
    this.actors = [];
    this.baseGraph = createGraphics(width, height);
  }
  createGraph(){
    this.baseGraph.background(230);
    this.flows.forEach(function(f){
      f.drawOrbit(this.baseGraph);
    }, this)
    this.hubs.forEach(function(h){
      this.baseGraph.ellipse(h.x, h.y, HUB_RADIUS * 2, HUB_RADIUS * 2); // ここをhubごとにdrawさせたい気持ちもある・・
    }, this)
    // 将来的にはここでは固定部分だけを描画して可変部分は毎フレーム描画みたいな感じにしたい。
  }
  registHub(posX, posY){
    let n = posX.length;
    for(let i = 0; i < n; i++){ this.hubs.push(new hub(posX[i], posY[i])); }
  }
  registFlow(inHubsId, outHubsId){
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = new flow(inHub, outHub);
      this.flows.push(newFlow);
      if(newFlow.type === 0){ inHub.registFlow(newFlow, 0); outHub.registFlow(newFlow, 2); }
      else{ inHub.registFlow(newFlow, 1); outHub.registFlow(newFlow, 3); }
    }
  }
}

function createPattern(){
  // 格子パターン
  let posX = [100, 100, 100, 200, 200, 200, 300, 300, 300];
  let posY = [100, 200, 300, 100, 200, 300, 100, 200, 300];
  graph.registHub(posX, posY);
  let inHubsId = [0, 1, 2, 3, 4, 5, 0, 3, 6, 1, 4, 7]; // 左上から右下になるように設定する(でないとエラー発生)
  let outHubsId = [3, 4, 5, 6, 7, 8, 1, 4, 7, 2, 5, 8];
  graph.registFlow(inHubsId, outHubsId);
  graph.actors.push(new actor(graph.hubs[0], 3));
  // ちょっと実験
}
