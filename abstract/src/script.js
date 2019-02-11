// 具体化しようよ
'use strict';

const HUB_RADIUS = 5;

let graph;
let actorGraphics = [];

function setup(){
  createCanvas(400, 400);
  createActorGraphics();
  graph = new entity();
  graph.loadData();
  graph.createGraph();
}

function draw(){
  image(graph.baseGraph, 0, 0);
  graph.actors.forEach(function(mf){
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

function createActorGraphics(){
  let circle = createGraphics(20, 20);
  circle.noStroke();
  circle.fill(0, 0, 255);
  circle.rect(3, 3, 14, 14);
  actorGraphics.push(circle);
  let tri = createGraphics(20, 20);
  tri.noStroke();
  tri.fill(255, 0, 0);
  tri.triangle(10, 0, 10 + 5 * sqrt(3), 15, 10 - 5 * sqrt(3), 15);
  actorGraphics.push(tri);
  let dia = createGraphics(20, 20);
  dia.noStroke();
  dia.fill(187, 102, 187);
  dia.quad(10, 0, 10 + 10 / sqrt(3), 10, 10, 20, 10 - 10 / sqrt(3), 10);
  dia.triangle(10, 20, 15, 10, 5, 10);
  actorGraphics.push(dia);
  let syuriken = createGraphics(20, 20);
  syuriken.noStroke();
  syuriken.fill(0);
  syuriken.quad(7, 6, 13, 0, 13, 14, 7, 20);
  syuriken.quad(0, 7, 14, 7, 20, 13, 6, 13);
  syuriken.fill(255);
  syuriken.ellipse(10, 10, 5, 5);
  actorGraphics.push(syuriken);
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

class easingFlow extends straightFlow{
  // easingするやつ
  constructor(h1, h2, id){
    super(h1, h2);
    this.easingId = id;
  }
  calcPos(pos, cnt){
    let easedCnt = cnt + easingFlow.easing(cnt / this.span, this.easingId) * this.span;
    pos.x = map(easedCnt, 0, this.span, this.from.x, this.to.x);
    pos.y = map(easedCnt, 0, this.span, this.from.y, this.to.y);
  }
  static easing(x, id){
    // xは0以上1以下の値で、返すのは0付近のある値(x=0とx=1で0になる)
    if(id === 0){
      //let y = x * (1 - x) * (x - 0.5) * 4; // ちょっとしたやつ
      let y = (0.7 / PI) * sin(2 * PI * x); // 途中でちょっとためらう
      return y;
    }else if(id === 1){
      let y = (1.5 / PI) * sin(PI * x); // backからのout
      return y;
    }else if(id === 2){
      let y = (0.3 / PI) * sin(4 * PI * x);
      return y;
    }
    return x;
  }
}

class jumpFlow extends flow{
  // ジャンプするやつ
  constructor(h1, h2){
    super(h1, h2);
    this.span = sqrt((h1.x - h2.x) * (h1.x - h2.x) + (h1.y - h2.y) * (h1.y - h2.y));
  }
  calcPos(pos, cnt){
    pos.x = map(cnt, 0, this.span, this.from.x, this.to.x);
    pos.y = map(cnt, 0, this.span, this.from.y, this.to.y);
    pos.y -= (2 / this.span) * cnt * (this.span - cnt); // 高さはとりあえずthis.span/2にしてみる
  }
  drawOrbit(gr){ return; }
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
    // 矢印描くところはメソッド化するべきかも。
    // 先っちょの座標とベクトルさえあればいいので。
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
  constructor(h, speed, kind){
    this.pos = createVector(h.x, h.y);
    this.move = h.convert(); // 所持flow.
    this.speed = speed;
    this.timer = new counter(); // ()忘れてた。ごめんなさい。
    this.timer.setting(this.move.span, this.speed);
    this.visual = new figure(kind); // 表現
  }
  setting(){
    this.move = this.move.to.convert();
    //console.log(this.move.to);
    // もしfactorを導入するならここでthis.move.spanをfactorで割ったうえで
    // あっちの方でmap内のspanをfactorで割ってmap全体をfactor倍する感じですかね。
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

class entity{
  constructor(){
    this.hubs = [];
    this.flows = [];
    this.actors = [];
    this.baseGraph = createGraphics(width, height);
    // patternをクラスにして・・
    this.patternIndex = 0;
    this.patternNum = 3; // 総数
    console.log(this.baseGraph);
  }
  reset(){
    this.hubs = [];
    this.flows = [];
    this.actors = [];
  }
  loadData(){
    let id = this.patternIndex;
    if(id === 0){ createPattern0(); }
    else if(id === 1){ createPattern1(); }
    else if(id === 2){ createPattern2();}
    //console.log(2);
  }
  createGraph(){
    this.baseGraph.background(230);
    //console.log(4);
    this.flows.forEach(function(f){
      f.drawOrbit(this.baseGraph);
    }, this)
    //console.log(5);
    this.hubs.forEach(function(h){
      this.baseGraph.ellipse(h.x, h.y, HUB_RADIUS * 2, HUB_RADIUS * 2); // ここをhubごとにdrawさせたい気持ちもある・・
    }, this)
    //console.log(3);
  }
  switchPattern(){
    this.reset();
    this.patternIndex = (this.patternIndex + 1) % this.patternNum;
    this.loadData();
    this.createGraph();
  }
  registHub(posX, posY){
    let n = posX.length;
    for(let i = 0; i < n; i++){ this.hubs.push(new hub(posX[i], posY[i])); }
  }
  // registFlowはパラメータを辞書に放り込んでコードの再利用をするもの。
  registFlow(inHubsId, outHubsId, params){
    // paramsは辞書の配列
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = this.createFlow(inHub, outHub, params[i]);
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  createFlow(h1, h2, pr){
    if(pr['type'] === 'straight'){
      return new straightFlow(h1, h2);
    }else if(pr['type'] === 'easing'){
      return new easingFlow(h1, h2, pr['easingId']);
    }else if(pr['type'] === 'circle'){
      return new circleFlow(h1, h2, pr['cx'], pr['cy'], pr['radius'], pr['rad1'], pr['rad2']);
    }else if(pr['type'] === 'jump'){
      return new jumpFlow(h1, h2);
    }
  }/*
  registStraightFlow(inHubsId, outHubsId){
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = new straightFlow(inHub, outHub)
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }*/
  // あの・・冗長にもほどがあるでよ・・・・辞書使えばいける？
  registEasingFlow(inHubsId, outHubsId, easingId){
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = new easingFlow(inHub, outHub, easingId)
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  registCircleFlow(inHubsId, outHubsId, cxs, cys, radiuses, rad1s, rad2s){
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = new circleFlow(inHub, outHub, cxs[i], cys[i], radiuses[i], rad1s[i], rad2s[i])
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  registJumpFlow(inHubsId, outHubsId){
    let n = inHubsId.length;
    for(let i = 0; i < n; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = new jumpFlow(inHub, outHub)
      this.flows.push(newFlow);
      inHub.outFlow.push(newFlow);
    }
  }
  registActor(defaultHubsId, speeds, kinds){
    let n = defaultHubsId.length;
    for(let i = 0; i < n; i++){
      let newActor = new actor(this.hubs[defaultHubsId[i]], speeds[i], kinds[i]);
      this.actors.push(newActor);
    }
  }
}
/*
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
  graph.registHub(posX, posY);
  let inHubsId = [0, 1, 3, 6, 2, 4, 7, 5, 8, 9, 14, 9, 5, 2, 13, 8, 4, 12, 7, 11, 1, 3, 4, 6, 7, 8, 10, 11, 12, 13];
  let outHubsId = [1, 3, 6, 10, 4, 7, 11, 8, 12, 13, 9, 5, 2, 0, 8, 4, 1, 7, 3, 6, 2, 4, 5, 7, 8, 9, 11, 12, 13, 14];
  graph.registStraightFlow(inHubsId, outHubsId);
  graph.registActor([0, 10, 14], [2, 2, 2], [0, 0, 0]);
}*/

function createPattern0(){
  let posX = [];
  let posY = [];
  for(let x1 = 0; x1 < 5; x1++){
    for(let x2 = 0; x2 <= x1; x2++){
      posX.push(200 - 30 * x1 + 60 * x2);
      posY.push(100 + 30 * sqrt(3) * x1);
    }
  }
  graph.registHub(posX, posY);
  let inHubsId = [0, 1, 3, 6, 2, 4, 7, 5, 8, 9, 14, 9, 5, 2, 13, 8, 4, 12, 7, 11, 1, 3, 4, 6, 7, 8, 10, 11, 12, 13];
  let outHubsId = [1, 3, 6, 10, 4, 7, 11, 8, 12, 13, 9, 5, 2, 0, 8, 4, 1, 7, 3, 6, 2, 4, 5, 7, 8, 9, 11, 12, 13, 14];
  let params = [];
  for(let i = 0; i < inHubsId.length; i++){ params.push({type: 'straight'}); }
  graph.registFlow(inHubsId, outHubsId, params);
  //graph.registStraightFlow(inHubsId, outHubsId);
  graph.registActor([0, 10, 14], [2, 2, 2], [0, 0, 0]);
}

function createPattern1(){
  let posX = [200].concat(arCosSeq(0, PI / 4, 8, 60, 200)).concat(arCosSeq(0, PI / 4, 8, 120, 200));
  let posY = [200].concat(arSinSeq(0, PI / 4, 8, 60, 200)).concat(arSinSeq(0, PI / 4, 8, 120, 200));
  graph.registHub(posX, posY);
  let inHubsId = [0, 0, 0, 0, 9, 11, 13, 15, 2, 4, 6, 8, 2, 4, 6, 8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 16, 15, 14, 13, 12, 11, 10];
  let outHubsId = [1, 3, 5, 7, 1, 3, 5, 7, 0, 0, 0, 0, 10, 12, 14, 16, 2, 3, 4, 5, 6, 7, 8, 1, 16, 15, 14, 13, 12, 11, 10, 9];
  let params = [];
  for(let i = 0; i < 16; i++){ params.push({type:'straight'}); }
  for(let i = 0; i < 16; i++){ params.push({type:'circle'}); }
  let cxs = constSeq(200, 16);
  let cys = constSeq(200, 16);
  let radiuses = constSeq(60, 8).concat(constSeq(120, 8));
  let rad1s = arSeq(0, PI / 4, 8).concat(arSeq(2 * PI, -PI / 4, 8));
  let rad2s = arSeq(PI / 4, PI / 4, 8).concat(arSeq(7 * PI / 4, -PI / 4, 8));
  for(let i = 0; i < 16; i++){
    params[16 + i]['cx'] = cxs[i]; params[16 + i]['cy'] = cys[i]; params[16 + i]['radius'] = radiuses[i];
    params[16 + i]['rad1'] = rad1s[i]; params[16 + i]['rad2'] = rad2s[i];
    console.log(params[16 + i]);
  }
  graph.registFlow(inHubsId, outHubsId, params);
  graph.registActor([0, 0, 0, 0], [2, 3, 2, 3], [1, 1, 1, 1]);
}

function createPattern2(){
  for(let y = 0; y < 4; y++){
    for(let x = 0; x < 4; x++){
      graph.hubs.push(new hub(80 + x * 80, 80 + y * 80));
    }
  }
  graph.registEasingFlow([1, 0, 8, 12, 14, 15, 7, 3], [0, 4, 12, 13, 15, 11, 3, 2], 0);
  graph.registEasingFlow([1, 5, 8, 9, 14, 10, 7, 6], [5, 4, 9, 13, 10, 11, 6, 2], 1);
  graph.registEasingFlow([4, 9, 13, 10, 11, 6, 2, 5], [8, 5, 14, 9, 7, 10, 1, 6], 2);
  graph.registJumpFlow([1, 8, 14, 7], [8, 14, 7, 1]);
  graph.registJumpFlow([4, 2, 11, 13], [2, 11, 13, 4]);
  graph.registActor([0, 3, 15, 12], [2, 2, 3, 3], [2, 2, 2, 2]);
}

// 配列関数
// これとconcutを組み合わせる。
// [1, 2, 3].concat([4, 5])で[1, 2, 3, 4, 5]になる。

function constSeq(c, n){
  // cがn個。
  let array = [];
  for(let i = 0; i < n; i++){ array.push(c); }
  return array;
}

function arSeq(start, interval, n){
  // startからintervalずつn個
  let array = [];
  for(let i = 0; i < n; i++){ array.push(start + interval * i); }
  return array;
}

function arCosSeq(start, interval, n, radius = 1, pivot = 0){
  // startからintervalずつn個をradius * cos([]) の[]に放り込む。pivotは定数ずらし。
  let array = [];
  for(let i = 0; i < n; i++){ array.push(pivot + radius * cos(start + interval * i)); }
  return array;
}

function arSinSeq(start, interval, n, radius = 1, pivot = 0){
  // startからintervalずつn個をradius * sin([]) の[]に放り込む。pivotは定数ずらし。
  let array = [];
  for(let i = 0; i < n; i++){ array.push(pivot + radius * sin(start + interval * i)); }
  return array;
}
