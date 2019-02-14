// 具体化しようよ
'use strict';

const HUB_RADIUS = 5;
const PATTERN_NUM = 6;
const GRAPHICS_NUM = 6;

let graph;
let actorGraphics = [];

function setup(){
  createCanvas(400, 400);
  registActorGraphics();
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
  if(key === 'p'){ noLoop(); }
  if(key === 'q'){
    loop();
    console.log(map(1.5, 0, 1, 20, 40));
  }
}

function mouseClicked(){
  graph.switchPattern();
}

// グラフィックの登録
function registActorGraphics(){
  for(let i = 0; i < GRAPHICS_NUM; i++){
    let img = createGraphics(20, 20);
    img.noStroke();
    createActorGraphics(img, i);
    actorGraphics.push(img);
  }
}

// グラフィックの詳細
function createActorGraphics(img, graphicsId){
  if(graphicsId === 0){ // 普通の正方形
    img.fill(0, 0, 255);
    img.rect(3, 3, 14, 14);
  }else if(graphicsId === 1){ // 三角形（火のイメージ）
    img.fill(255, 0, 0);
    img.triangle(10, 0, 10 + 5 * sqrt(3), 15, 10 - 5 * sqrt(3), 15);
  }else if(graphicsId === 2){ // ダイヤ型（クリスタルのイメージ）（色合い工夫してもいいかも）
    img.fill(187, 102, 187);
    img.quad(10, 0, 10 + 10 / sqrt(3), 10, 10, 20, 10 - 10 / sqrt(3), 10);
  }else if(graphicsId === 3){ // 手裏剣（忍者のイメージ）
    img.fill(0);
    img.quad(7, 6, 13, 0, 13, 14, 7, 20);
    img.quad(0, 7, 14, 7, 20, 13, 6, 13);
    img.fill(255);
    img.ellipse(10, 10, 5, 5);
  }else if(graphicsId === 4){ // くさび型（草のイメージ・・くさびだけに（？）
    img.fill(32, 168, 72);
    img.quad(10, 2, 2, 18, 10, 10, 18, 18);
  }else if(graphicsId === 5){ // 星型（オレンジの星）→イナヅマにしよう。それで完成とする。
    img.fill(244, 189, 0);
    img.quad(10, 0, 12, 8, 8, 12, 4, 14);
    img.quad(10, 20, 16, 6, 12, 8, 8, 12);
  }
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

// hubはいろいろいじれる。
// まず、effectが発生するようにできる（convertのタイミングでアクションを起こす）
// デフォルトで何かactionって書いておいて派生形でactionだけいじるようにすれば何でもできるはず
// flowも同様
// 次に今ランダムで返してるところをinFlowに対して同じflowを返さないようにできる
// これはflowにidを付けconvertでactorを取得してそのflowから同じflowかどうか判別して・・ってやると出来る
// noBackHubみたいな
// graphがglobalになってるから問い合わせてもいいけど直接渡した方が早そう

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
    this.visible = true // これをfalseにすると描画の際に軌道が表示されない
  }
  // getter大事。これで取得することにより、オーバーライドするにあたって
  // 実際の値を変えずに返す値だけいじることができる。
  getSpan(){ return this.span; }
  calcPos(pos, cnt){}
  // あとはtoにconvertしてもらうだけ。
  invisible(){ this.visible = false; }
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
    if(!this.visible){ return; }
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
  constructor(h1, h2, idX, idY){
    super(h1, h2);
    this.easingIdX = idX;
    this.easingIdY = idY;
    //console.log(this.easingIdX);
    //console.log(this.easingIdY);
  }
  calcPos(pos, cnt){
    // easedは0~1の値で、easing functionでconvertした後のもの。
    let easedX = easingFlow.easing(cnt / this.span, this.easingIdX);
    let easedY = easingFlow.easing(cnt / this.span, this.easingIdY);
    pos.x = map(easedX, 0, 1, this.from.x, this.to.x);
    pos.y = map(easedY, 0, 1, this.from.y, this.to.y);
  }
  static easing(x, id){
    // xは0以上1以下の値で、返すのは0付近のある値(x=0とx=1で0になる)
    let y = x;
    if(id === 1){
      y = 3 * pow(x, 2) - 2 * pow(x, 3); // 入口は2乗、出口は3乗。
    }else if(id === 2){
      y = 0.5 * (1 - cos(PI * x)); // cosを使った簡単なもの。
    }else if(id === 3){
      y = (50 / 23) * (-2 * pow(x, 3) + 3 * pow(x, 2) - 0.54 * x); // いわゆるBackInOutというやつ。0.1と0.9で極値。
    }else if(id === 4){
      y = 3 * pow(x, 4) - 2 * pow(x, 6); // 入口は4乗、出口は6乗。
    }else if(id === 5){
      y = x * (2 * x - 1); // 多分バックインになるはず
    }else if(id === 6){
      y = 1 + (1 - x) * (2 * x - 1); // 多分バックアウト？
    }else if(id === 7){
      y = x + 0.1 * sin(8 * PI * x); // ぐらぐら
    }else if(id === 8){
      y = constrain(-12 * pow(x, 3) + 18 * pow(x, 2) - 5 * x, 0, 1); // 停止→移動→停止
    }else if(id === 9){
      y = -12 * pow(x, 3) + 18 * pow(x, 2) - 5 * x; // さっきのやつで普通にバックインアウト
    }else if(id === 10){
      y = (x / 8) + (7 / 8) * pow(x, 4); // ゆっくり→ぎゅーん
    }else if(id === 11){
      y = (7 / 8) + (x / 8) - (7 / 8) * pow(1 - x, 4); // ぎゅーん→ゆっくり
    }
    return y;
  }
}

class factorFlow extends straightFlow{
  // スピード可変. 例えばfactor0.5ならスピード半分、2.0ならスピード2倍
  // spanを変化させると矢印の長さまで変化してしまうので、getterを上書きして、
  // timerに返す値だけいじることにする。位置計算の際にもspanの値自体は変えないようにする。
  constructor(h1, h2, factor){
    super(h1, h2);
    this.speedFactor = factor;
  }
  getSpan(){
    // spanの値はタイマーセットの時しか使わないから、ここをいじってタイマーを伸び縮みさせる。
    return this.span / this.speedFactor;
  }
  calcPos(pos, cnt){
    // spanに相当するところをfactorで割る うまくいったね。
    pos.x = map(cnt, 0, this.span / this.speedFactor, this.from.x, this.to.x);
    pos.y = map(cnt, 0, this.span / this.speedFactor, this.from.y, this.to.y);
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
    if(!this.visible){ return; }
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
    //this.timer.setting(this.move.span, this.speed);
    this.timer.setting(this.move.getSpan(), this.speed); // getterで取得するように変更
    this.visual = new figure(kind); // 表現
  }
  setting(){
    this.move = this.move.to.convert();
    //this.timer.setting(this.move.span, this.speed);
    this.timer.setting(this.move.getSpan(), this.speed); // getterで取得するように変更
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
    this.baseGraph = createGraphics(width, height); // これがグラフィック
    // ここ↑に問題があって、グラフをクラスにしてここから上をひとまとめにして、
    // その集合体としてentityを考える必要がある。それにより、
    // 個々のグラフの回転や平行移動が可能になるけどそれは別のsketchでやりましょうね・・
    this.patternIndex = 4;
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
    else if(id === 3){ createPattern3(); }
    else if(id === 4){ createPattern4(); }
    else if(id === 5){ createPattern5(); }
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
    // 将来的にはここでは固定部分だけを描画して可変部分は毎フレーム描画みたいな感じにしたい。
  }
  switchPattern(){
    this.reset();
    this.patternIndex = (this.patternIndex + 1) % PATTERN_NUM;
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
      return new easingFlow(h1, h2, pr['easingIdX'], pr['easingIdY']);
    }else if(pr['type'] === 'circle'){
      return new circleFlow(h1, h2, pr['cx'], pr['cy'], pr['radius'], pr['rad1'], pr['rad2']);
    }else if(pr['type'] === 'jump'){
      return new jumpFlow(h1, h2);
    }else if(pr['type'] === 'factor'){
      //console.log("createFlow");
      //console.log(pr['factor']);
      return new factorFlow(h1, h2, pr['factor']);
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

// そのうち登録・・なんだっけregist？registメソッド作って簡単にするから待ってて

function createPattern0(){
  // 三角形パターン
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
  graph.registFlow(inHubsId, outHubsId, typeSeq('straight', inHubsId.length));
  graph.registActor([0, 10, 14], [2, 2, 2], [0, 0, 0]);
  // ちょっと実験
  //graph.flows[8].invisible(); // 無事消えました！！！
}

function createPattern1(){
  // 円形パターン
  let posX = [200].concat(arCosSeq(0, PI / 4, 8, 60, 200)).concat(arCosSeq(0, PI / 4, 8, 120, 200));
  let posY = [200].concat(arSinSeq(0, PI / 4, 8, 60, 200)).concat(arSinSeq(0, PI / 4, 8, 120, 200));
  graph.registHub(posX, posY);
  // 初めの16個が直線で残りの16個が円軌道。
  let inHubsId = [0, 0, 0, 0, 9, 11, 13, 15, 2, 4, 6, 8, 2, 4, 6, 8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 16, 15, 14, 13, 12, 11, 10];
  let outHubsId = [1, 3, 5, 7, 1, 3, 5, 7, 0, 0, 0, 0, 10, 12, 14, 16, 2, 3, 4, 5, 6, 7, 8, 1, 16, 15, 14, 13, 12, 11, 10, 9];
  let params = typeSeq('straight', 16).concat(typeSeq('circle', 16));
  let cxs = constSeq(200, 16);
  let cys = constSeq(200, 16);
  let radiuses = constSeq(60, 8).concat(constSeq(120, 8));
  let rad1s = arSeq(0, PI / 4, 8).concat(arSeq(2 * PI, -PI / 4, 8));
  let rad2s = arSeq(PI / 4, PI / 4, 8).concat(arSeq(7 * PI / 4, -PI / 4, 8));
  for(let i = 0; i < 16; i++){
    params[16 + i]['cx'] = cxs[i]; params[16 + i]['cy'] = cys[i]; params[16 + i]['radius'] = radiuses[i];
    params[16 + i]['rad1'] = rad1s[i]; params[16 + i]['rad2'] = rad2s[i];
  }
  graph.registFlow(inHubsId, outHubsId, params);
  graph.registActor([0, 0, 0, 0], [2, 3, 2, 3], [1, 1, 1, 1]);
}

function createPattern2(){
  // 正方形パターン
  for(let y = 0; y < 4; y++){
    for(let x = 0; x < 4; x++){
      graph.hubs.push(new hub(80 + x * 80, 80 + y * 80));
    }
  }
  let params = [];
  // easing / jump
  for(let i = 0; i < 24; i++){ params.push({type:'easing', easingId: Math.floor(i / 8)}); }
  let inHubsId = [1, 0, 8, 12, 14, 15, 7, 3, 1, 5, 8, 9, 14, 10, 7, 6, 4, 9, 13, 10, 11, 6, 2, 5];
  let outHubsId = [0, 4, 12, 13, 15, 11, 3, 2, 5, 4, 9, 13, 10, 11, 6, 2, 8, 5, 14, 9, 7, 10, 1, 6];
  for(let i = 0; i < 8; i++){ params.push({type:'jump'}); }
  inHubsId = inHubsId.concat([1, 8, 14, 7, 4, 2, 11, 13]);
  outHubsId = outHubsId.concat([8, 14, 7, 1, 2, 11, 13, 4]);
  graph.registFlow(inHubsId, outHubsId, params);
  graph.registActor([0, 3, 15, 12], [2, 2, 3, 3], [2, 2, 2, 2]);
}

function createPattern3(){
  // factorFlowの実験
  let posX = [];
  let posY = [];
  for(let i = 0; i < 3; i++){
    posX = posX.concat([220 - 60 * i, 340 - 60 * i, 300 - 60 * i, 180 - 60 * i, 140 - 60 * i, 380 - 60 * i]);
    posY = posY.concat([40 + 120 * i, 40 + 120 * i, 120 + 120 * i, 120 + 120 * i, 120 + 120 * i, 40 + 120 * i]);
  }
  graph.registHub(posX, posY);
  graph.registFlow([0, 1, 2, 3, 6, 7, 8, 9, 12, 13, 14, 15], [1, 2, 3, 0, 7, 8, 9, 6, 13, 14, 15, 12], typeSeq('straight', 12));
  graph.registFlow([17, 11, 5], [10, 4, 16], typeSeq('jump', 3));
  let params = typeSeq('factor', 12);
  for(let i = 0; i < 6; i++){ params[i]['factor'] = 2; params[i + 6]['factor'] = 4; }
  graph.registFlow([0, 3, 6, 9, 12, 15, 4, 1, 10, 7, 16, 13], [2, 1, 8, 7, 14, 13, 3, 5, 9, 11, 15, 17], params);
  graph.registActor([4, 10, 16], [1, 2, 3], [3, 3, 3]);
}

function createPattern4(){
  // easingの実験？
  graph.registHub(constSeq(100, 12).concat(constSeq(300, 12)), arSeq(30, 30, 12).concat(arSeq(30, 30, 12)));
  let params = typeSeq('easing', 12);
  for(let i = 0; i < 12; i++){ params[i]['easingIdX'] = i; params[i]['easingIdY'] = i; }
  graph.registFlow(arSeq(0, 1, 12), arSeq(12, 1, 12), params);
  graph.registFlow(arSeq(12, 1, 12), arSeq(0, 1, 12), typeSeq('straight', 12)); // 帰り道はストレート
  graph.registActor(arSeq(0, 1, 12), constSeq(2, 12), constSeq(4, 12));
}

function createPattern5(){
  // multiple easing...
  // おもしろ～い
  graph.registHub([100, 100, 100, 100, 300, 300, 300, 300], [50, 150, 250, 350, 80, 180, 280, 380]);
  let params = typeSeq('easing', 4);
  let idx = [9, 9, 9, 9, 0, 0, 0, 0];
  let idy = [0, 0, 0, 0, 0, 0, 0, 0];
  for(let i = 0; i < 4; i++){ params[i]['easingIdX'] = idx[i]; params[i]['easingIdY'] = idy[i]; }
  params = params.concat(typeSeq('straight', 4));
  console.log(params);
  graph.registFlow([0, 1, 2, 3, 4, 5, 6, 7], [6, 7, 4, 5, 0, 1, 2, 3], params);
  graph.registActor([0, 1, 2, 3], [2, 2, 2, 2], [5, 5, 5, 5]);
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

function typeSeq(typename, n){
  // typenameの辞書がn個。
  let array = [];
  for(let i = 0; i < n; i++){ array.push({type: typename}); }
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
