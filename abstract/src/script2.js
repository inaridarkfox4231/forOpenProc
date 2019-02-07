// 具体化しようよ
'use strict';

let hub0;
let hub1;
let hub2;
let hub3;
let flow0;
let flow1;
let flow2;
let flow3;
let movefig;

let emperor;

function setup(){
  createCanvas(400, 400);
  angleMode(DEGREES);
  /* 例1: 正方形型
  hub0 = new hub(100, 100);
  hub1 = new hub(300, 100);
  hub2 = new hub(300, 300);
  hub3 = new hub(100, 300);
  flow0 = new straightFlow(hub0, hub1);
  flow1 = new straightFlow(hub1, hub2);
  flow2 = new straightFlow(hub2, hub3);
  flow3 = new straightFlow(hub3, hub0);
  hub0.outFlow.push(flow0);
  hub1.outFlow.push(flow1);
  hub2.outFlow.push(flow2);
  hub3.outFlow.push(flow3);
  movefig = new movingCircle(hub0, 2, color('red'), 10);*/
  /* 例2: 円弧
  hub0 = new hub(200, 200);
  hub1 = new hub(200 - 50 * sqrt(2), 200 - 50 * sqrt(2));
  hub2 = new hub(200 + 50 * sqrt(2), 200 - 50 * sqrt(2));
  flow0 = new straightFlow(hub0, hub1);
  flow1 = new circleFlow(hub1, hub2, 200, 200, 100, 225, 315);
  flow2 = new straightFlow(hub2, hub0);
  hub0.outFlow.push(flow0);
  hub1.outFlow.push(flow1);
  hub2.outFlow.push(flow2);
  movefig = new movingCircle(hub0, 2, color('blue'), 10);*/
  emperor = new entity();
  emperor.loadData();
  emperor.createGraph();
}

function draw(){
  image(emperor.baseGraph, 0, 0);
  emperor.movefigs.forEach(function(mf){
    mf.update();
    mf.display();
  })
  //movefig.update();
  //movefig.display();
}

function keyTyped(){
  if(key ==='q'){noLoop();}
}

// カウンター（計測用）
class counter{
  constructor(){
    this.cnt = 0;
    this.isOn = false;
    this.limit; // 限界(-1のときは無限ループ)
    this.diff;  // 増分
  }
  setting(lim, diff){
    this.cnt = 0;
    this.isOn = true;
    this.limit = lim;
    this.diff = diff;
  }
  getCnt(){ return this.cnt; }
  getState(){ return this.isOn; }
  progress(){ this.cnt += this.diff; } // 進める
  check(){
    if(this.cnt > this.limit && this.limit >= 0){ this.isOn = false; } // limit-1のときは無限ループ、
    return this.isOn;
  }
  pause(){ this.isOn = !this.isOn; } // 一時停止
  quit(){ this.cnt = 0; this.isOn = false; } // 中途終了
}

// stateからflowとhub作るの楽しいんだけど、
// とりあえず具体化もうちょっとやってからでいいです。
class hub{
  // 結節点
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.outFlow = []; //outだけ。とりあえず。
  }
  convert(){
    let nextFlowIndex = randomInt(this.outFlow.length);
    return this.outFlow[nextFlowIndex];
  }
}

function randomInt(n){ return Math.floor(random(n)); } // 0, 1, 2, ..., n-1 のどれかを返す汎用関数

class flow{
  // 流れ
  constructor(h1, h2){
    this.from = h1; // 入口hub
    this.to = h2; // 出口hub
    this.span; // さしわたし
  }
  calcPos(pos, cnt){}
  // あとはtoにconvertしてもらうだけ。
  drawOrbit(gr){}
}

class straightFlow extends flow{
  constructor(h1, h2){
    super(h1, h2);
    this.span = sqrt((h1.x - h2.x) * (h1.x - h2.x) + (h1.y - h2.y) * (h1.y - h2.y));
  }
  calcPos(pos, cnt){
    pos.x = map(cnt, 0, this.span, this.from.x, this.to.x);
    pos.y = map(cnt, 0, this.span, this.from.y, this.to.y);
  }
  drawOrbit(gr){
    gr.strokeWeight(1.0);
    gr.line(this.from.x, this.from.y, this.to.x, this.to.y);
  }
}

class circleFlow extends flow{
  constructor(h1, h2, cx, cy, radius, ph1, ph2){
    super(h1, h2);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.ph1 = ph1; // 開始位相
    this.ph2 = ph2; // 終了位相
    this.span = ph2 - ph1;
  }
  calcPos(pos, cnt){
    pos.x = this.cx + this.radius * cos(this.ph1 + cnt);
    pos.y = this.cy + this.radius * sin(this.ph1 + cnt);
  }
  drawOrbit(gr){
    gr.strokeWeight(1.0);
    gr.arc(this.cx, this.cy, 2 * this.radius, 2 * this.radius, this.ph1, this.ph2);
  }
}

class actor{
  constructor(h, speed){
    this.pos = createVector(h.x, h.y);
    this.move = h.convert(); // 所持flow.
    this.speed = speed;
    this.timer = new counter;
    this.timer.setting(this.move.span, this.speed);
    this.visual = new figure(); // 表現
  }
  setting(){
    this.move = this.move.to.convert();
    this.timer.setting(this.move.span, this.speed);
  }
  update(){
    if(!this.timer.getState()){ return; }
    this.timer.progress();
    this.move.calcPos(this.pos, this.timer.getCnt());
    if(!this.timer.check()){ this.setting(); } // counter check.
  }
  display(){
    this.visual.display(this.pos); // ここで描画
  }
}

class movingCircle extends actor{
  constructor(h, speed, _color, radius){
    super(h, speed);
    this.visual = new circle(_color, radius);
  }
}

class movingSquare extends actor{
  constructor(h, speed, _color, size, rolling = false){
    super(h, speed);
    this.visual = new square(_color, size, rolling);
  }
}

class figure{
  constructor(_color){
    this.color = _color;
  }
  display(pos){};
}

class circle extends figure{
  constructor(_color, radius){
    super(_color);
    this.radius = radius;
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    noStroke();
    fill(this.color);
    ellipse(0, 0, this.radius * 2, this.radius * 2);
    pop();
  }
}

class square extends figure{
  constructor(_color, size, rolling){
    super(_color);
    this.size = size;
    this.rolling = rolling; // 回転するか否か
    this.rotation = 0;
    if(rolling){ this.rotation = random(360); }
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    noStroke();
    fill(this.color);
    rotate(this.rotation++);
    rect(-size * 0.5, -size * 0.5, size, size);
  }
}

class entity{
  constructor(){
    this.hubs = [];
    this.flows = [];
    this.movefigs = [];
    this.baseGraph = createGraphics(width, height);
    this.patternIndex = 0;
    console.log(this.baseGraph);
  }
  reset(){
    this.hubs = [];
    this.flows = [];
    this.movefigs = [];
  }
  loadData(){
    let id = this.patternIndex;
    if(id === 0){ createPattern0(); }
    else if(id === 1){ createPattern1(); }
    else if(id === 2){ createPattern2();}
    console.log(2);
  }
  createGraph(){
    this.baseGraph.background(230);
    console.log(4);
    this.flows.forEach(function(f){
      f.drawOrbit(this.baseGraph);
    }, this)
    console.log(5);
    this.hubs.forEach(function(h){
      this.baseGraph.ellipse(h.x, h.y, 20, 20);
    }, this)
    console.log(3);
  }
}

function createPattern0(){
  let posx = [100, 300, 300, 100];
  let posy = [100, 100, 300, 300];
  for(let i = 0; i < 4; i++){
    emperor.hubs.push(new hub(posx[i], posy[i]));
  }
  let inHubs = [0, 1, 2, 3];
  let outHubs = [1, 2, 3, 0];
  for(let i = 0; i < 4; i++){
    emperor.flows.push(new straightFlow(emperor.hubs[inHubs[i]], emperor.hubs[outHubs[i]]));
    emperor.hubs[inHubs[i]].outFlow.push(emperor.flows[i]);
  }
  let mf = new movingCircle(emperor.hubs[0], 2, color('red'), 10);
  emperor.movefigs.push(mf);
  console.log(1);
}
