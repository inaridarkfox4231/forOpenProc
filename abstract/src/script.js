// 具体化しようよ
'use strict';

const HUB_RADIUS = 5;

let graph;

function setup(){
  createCanvas(400, 400);
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
    gr.push();
    gr.strokeWeight(1.0);
    gr.line(this.from.x, this.from.y, this.to.x, this.to.y);
    //gr.push();
    gr.translate(this.from.x, this.from.y); // 矢印の根元に行って
    let directionVector = createVector(this.to.x - this.from.x, this.to.y - this.from.y);
    gr.rotate(directionVector.heading()); // ぐるんってやって行先をx軸正方向に置いて
    let arrowSize = 7;
    gr.translate(this.span - HUB_RADIUS - arrowSize, 0);
    gr.fill(0);
    gr.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    gr.pop();
  }
}

class circleFlow extends flow{
  constructor(h1, h2, cx, cy, radius, rad1, rad2){
    // rad1, rad2はふたつのラジアンで反時計回りに進む、はず。
    // あー・・えっと、たとえば2π→π・・・あっ。。んー下がります。そうです。（下を回る）
    // で、上がるときは0→πってやるんですよ。そうです。上がります。そうです。（上を回る）
    // mapでやる。
    super(h1, h2);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.rad1 = rad1; // 開始位相
    this.rad2 = rad2; // 終了位相（補間で変化する）
    this.span = radius * abs(rad2 - rad1); //ここを円弧の長さにします
  }
  calcPos(pos, cnt){
    pos.x = this.cx + this.radius * cos(map(cnt, 0, this.span, this.rad1, this.rad2));
    pos.y = this.cy + this.radius * sin(map(cnt, 0, this.span, this.rad1, this.rad2));
  }
  drawOrbit(gr){
    let minRad = min(this.rad1, this.rad2);
    let maxRad = max(this.rad1, this.rad2);
    gr.push();
    gr.strokeWeight(1.0);
    gr.noFill();
    gr.arc(this.cx, this.cy, 2 * this.radius, 2 * this.radius, minRad, maxRad);
    gr.translate(this.to.x, this.to.y);
    let directionVector = createVector(-(this.to.y - this.cy), this.to.x - this.cx);
    if(this.rad1 > this.rad2){ directionVector.mult(-1); }
    gr.rotate(directionVector.heading());
    let arrowSize = 7;
    gr.translate(-HUB_RADIUS - arrowSize, 0);
    gr.fill(0);
    gr.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    gr.pop();
  }
}

// class parabolaFlow{} 作成したい
// 仕様としてはその・・

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
    //console.log(this.move.to);
    this.timer.setting(this.move.span, this.speed);
  }
  update(){
    if(!this.timer.getState()){ return; }
    this.timer.progress();
    this.move.calcPos(this.pos, this.timer.getCnt());
    // 多分イージング入れるとしたら、ここ。加法的か乗法的か知らないけど。
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
  constructor(fillColor, size, rollingSpeed){
    super(fillColor);
    this.size = size;
    this.rollingSpeed = rollingSpeed; // 回転するか否か
    this.rotation = 0;
    if(rollingSpeed !== 0){ this.rotation = random(360); }
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    noStroke();
    fill(this.color);
    this.rotation += this.rollingSpeed;
    rotate(this.rotation);
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
      this.baseGraph.ellipse(h.x, h.y, HUB_RADIUS * 2, HUB_RADIUS * 2); // ここをhubごとにdrawさせたい気持ちもある・・
    }, this)
    console.log(3);
  }
  switchPattern(){
    this.reset();
    this.patternIndex = (this.patternIndex + 1) % this.patternNum;
    this.loadData();
    this.createGraph();
  }
  registHub(posX, posY, n){
    for(let i = 0; i < n; i++){ this.hubs.push(new hub(posX[i], posY[i])); }
  }
  registStraightFlow(inHubsId, outHubsId, n){
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      //console.log(inHub);
      //console.log(outHub);
      let newFlow = new straightFlow(inHub, outHub)
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  registCircleFlow(inHubsId, outHubsId, cxs, cys, radiuses, rad1s, rad2s, n){
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      console.log(inHub);
      console.log(outHub);
      let newFlow = new circleFlow(inHub, outHub, cxs[i], cys[i], radiuses[i], rad1s[i], rad2s[i])
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  setCircle(hubId, speed, selfColor, radius){
    let mf = new movingCircle(this.hubs[hubId], speed, selfColor, radius);
    this.movefigs.push(mf);
  }
  setSquare(hubId, speed, selfColor, size, rollingSpeed){
    let mf = new movingSquare(this.hubs[hubId], speed, selfColor, size, rollingSpeed);
    this.movefigs.push(mf);
  }
}

// そのうち登録・・なんだっけregist？registメソッド作って簡単にするから待ってて
function createPattern0(){
  let posX = [];
  let posY = [];
  for(let x1 = 0; x1 < 5; x1++){
    for(let x2 = 0; x2 <= x1; x2++){
      posX.push(200 - 30 * x1 + 60 * x2);
      posY.push(100 + 30 * sqrt(3) * x1);
    }
  }
  graph.registHub(posX, posY, 15);
  let inHubsId = [0, 1, 3, 6, 2, 4, 7, 5, 8, 9, 14, 9, 5, 2, 13, 8, 4, 12, 7, 11, 1, 3, 4, 6, 7, 8, 10, 11, 12, 13];
  let outHubsId = [1, 3, 6, 10, 4, 7, 11, 8, 12, 13, 9, 5, 2, 0, 8, 4, 1, 7, 3, 6, 2, 4, 5, 7, 8, 9, 11, 12, 13, 14];
  graph.registStraightFlow(inHubsId, outHubsId, 30);
  graph.setCircle(0, 2, color('red'), 15);
}

function createPattern1(){
  let posX = [];
  let posY = [];
  posX.push(200);
  posY.push(200);
  for(let i = 0; i < 8; i++){
    posX.push(200 + 60 * cos(i * PI / 4));
    posY.push(200 + 60 * sin(i * PI / 4));
    posX.push(200 + 120 * cos(i * PI / 4));
    posY.push(200 + 120 * sin(i * PI / 4));
  }

  graph.registHub(posX, posY, 17);
  //console.log(graph.hubs[0]);
  let inHubsId = [1, 5, 9, 13, 0, 0, 0, 0, 1, 5, 9, 13, 4, 8, 12, 16];
  let outHubsId = [0, 0, 0, 0, 3, 7, 11, 15, 2, 6, 10, 14, 3, 7, 11, 15];
  graph.registStraightFlow(inHubsId, outHubsId, 16);
  inHubsId = [1, 15, 13, 11, 9, 7, 5, 3, 2, 4, 6, 8, 10, 12, 14, 16];
  outHubsId = [15, 13, 11, 9, 7, 5, 3, 1, 4, 6, 8, 10, 12, 14, 16, 2];
  let cxs = [];
  let cys = [];
  let radiuses = [];
  let rad1s = [];
  let rad2s = [];
  for(let i = 0; i < 16; i++){
    cxs.push(200);
    cys.push(200);
  }
  for(let i = 0; i < 8; i++){ radiuses.push(60); rad1s.push((PI / 4) * (8 - i)); rad2s.push((PI / 4) * (7 - i)); }
  for(let i = 0; i < 8; i++){ radiuses.push(120); rad1s.push((PI / 4) * i); rad2s.push((PI / 4) * (i + 1)); }
  graph.registCircleFlow(inHubsId, outHubsId, cxs, cys, radiuses, rad1s, rad2s, 16);
  let mf = new movingSquare(graph.hubs[0], 2, color('blue'), 20, 0.1);
  graph.movefigs.push(mf);
}

function createPattern2(){
  for(let i = 0; i < 5; i++){
    let x = 200 + 100 * sin(2 * i * PI / 5);
    let y = 200 - 100 * cos(2 * i * PI / 5);
    graph.hubs.push(new hub(x, y));
  }
  for(let i = 0; i < 5; i++){
    graph.flows.push(new straightFlow(graph.hubs[i % 5], graph.hubs[(i + 2) % 5]));
    graph.hubs[i].outFlow.push(graph.flows[i]);
  }
  let mf = new movingCircle(graph.hubs[0], 2, color('orange'), 20);
  graph.movefigs.push(mf);
}
