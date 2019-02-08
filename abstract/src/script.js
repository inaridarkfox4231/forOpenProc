// 具体化しようよ
'use strict';

let graph;

function setup(){
  createCanvas(400, 400);
  angleMode(DEGREES);
  graph = new entity();
  graph.loadData();
  graph.createGraph();
}

function draw(){
  image(graph.baseGraph, 0, 0);
  graph.movefigs.forEach(function(mf){
    mf.update();
    mf.display();
  })
  //movefig.update();
  //movefig.display();
}

function keyTyped(){
  if(key ==='p'){ noLoop(); }
  if(key === 'q'){ loop(); }
}

function mouseClicked(){
  graph.switchPattern();
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
  constructor(h, speed, fillColor, diam){
    super(h, speed);
    this.visual = new circle(fillColor, diam);
  }
}

class movingSquare extends actor{
  constructor(h, speed, fillColor, size, rolling = false){
    super(h, speed);
    this.visual = new square(fillColor, size, rolling);
    console.log("createSquare");
  }
}

class figure{
  constructor(fillColor){
    this.color = fillColor;
  }
  display(pos){};
}

class circle extends figure{
  constructor(fillColor, diam){
    super(fillColor);
    this.diam = diam;
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    noStroke();
    fill(this.color);
    ellipse(0, 0, this.diam, this.diam);
    pop();
  }
}

class square extends figure{
  constructor(fillColor, size, rolling){
    super(fillColor);
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
    rect(-this.size * 0.5, -this.size * 0.5, this.size, this.size);
  }
}

class entity{
  constructor(){
    this.hubs = [];
    this.flows = [];
    this.movefigs = [];
    this.baseGraph = createGraphics(width, height);
    this.patternIndex = 0;
    this.patternNum = 3; // 総数
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
      this.baseGraph.ellipse(h.x, h.y, 10, 10);
    }, this)
    console.log(3);
  }
  switchPattern(){
    this.reset();
    this.patternIndex = (this.patternIndex + 1) % this.patternNum;
    this.loadData();
    this.createGraph();
  }
}

// そのうち登録・・なんだっけregist？registメソッド作って簡単にするから待ってて

function createPattern0(){
  let posX = [100, 300, 300, 100];
  let posY = [100, 100, 300, 300];
  for(let i = 0; i < 4; i++){
    graph.hubs.push(new hub(posX[i], posY[i]));
  }
  let inHubs = [0, 1, 2, 3];
  let outHubs = [1, 2, 3, 0];
  for(let i = 0; i < 4; i++){
    graph.flows.push(new straightFlow(graph.hubs[inHubs[i]], graph.hubs[outHubs[i]]));
    graph.hubs[inHubs[i]].outFlow.push(graph.flows[i]);
  }
  let mf = new movingCircle(graph.hubs[0], 2, color('red'), 10);
  graph.movefigs.push(mf);
  console.log(1);
}

function createPattern1(){
  let posX = [100, 300, 200];
  let posY = [100, 100, 200];
  for(let i = 0; i < 3; i++){
    graph.hubs.push(new hub(posX[i], posY[i]));
  }
  let inHubs = [0, 1, 2];
  let outHubs = [1, 2, 0];
  for(let i = 0; i < 3; i++){
    graph.flows.push(new straightFlow(graph.hubs[inHubs[i]], graph.hubs[outHubs[i]]));
    graph.hubs[inHubs[i]].outFlow.push(graph.flows[i]);
  }
  let mf = new movingSquare(graph.hubs[0], 2, color('blue'), 10, true);
  graph.movefigs.push(mf);
}

function createPattern2(){
  for(let i = 0; i < 5; i++){
    let x = 200 + 100 * cos(72 * i);
    let y = 200 + 100 * sin(72 * i);
    graph.hubs.push(new hub(x, y));
  }
  for(let i = 0; i < 5; i++){
    graph.flows.push(new straightFlow(graph.hubs[i % 5], graph.hubs[(i + 1) % 5]));
    graph.hubs[i].outFlow.push(graph.flows[i]);
  }
  let mf = new movingCircle(graph.hubs[0], 2, color('orange'), 10);
  graph.movefigs.push(mf);
}
