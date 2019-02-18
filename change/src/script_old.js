// intersectionのchange.
// はやくはじめよー。なんかマンネリって思われてそう。
// 実現する時間がないってだけでちゃんと考えてるのに

// intersectionをとりあえずEnterキーで切り替えられるように
// あとhubとflowを同じように取り扱えるように
// そんな感じかな・・
'use strict';
let all;
//let deco;

function setup(){
  createCanvas(400, 400);
  all = new entity();
  //deco = new decoration();
  all.initialize();
}

function draw(){
  background(220);
  all.update();
  all.display();
}

function keyTyped(){
  if(key === 'p'){ noLoop(); }
  if(key === 'q'){ loop(); }
}

// 簡単なものでいいです
class counter{
  constructor(){
    this.cnt = 0;
    this.limit;
    this.isOn;
    this.diff;
  }
  getCnt(){ return this.cnt; }
  getState(){ return this.isOn; }
  setting(lim, diff){
    this.cnt = 0;  // ああーーーーーーわすれてた
    this.limit = lim;
    this.diff = diff;
    this.isOn = true; // スイッチオン
  }
  step(){
    this.cnt += this.diff;
    if(this.cnt > this.limit){ this.isOn = false; }
  }
  pause(){ this.isOn = !this.isOn; } // ポーズ要るかどうか
}

// hubはflowとflowをつなぐ。
class hub{
  constructor(x, y){
    this.index = hub.index++;
    this.x = x;
    this.y = y;
    this.outFlow = [];
    this.isConvertible = false;
  }
  getState(){ return this.isConvertible; }
  registFlow(f){
    this.outFlow.push(f);
    this.isConvertible = true; // flowが登録されればtrueになるけど
  }
  initialize(_actor){} // 何か一回だけやって終わりの場合はここに書くかもね
  execute(_actor){} // ここで何かすることもあるでしょう
  convert(_actor){} // まあ、どうしますかね
  display(gr){
    gr.push();
    gr.translate(this.x, this.y);
    gr.ellipse(0, 0, 10, 10); // hubをあらわす丸い点。
    gr.pop();
  }
}

class randomHub extends hub{
  constructor(x, y){
    super(x, y);
  }
  convert(_actor){
    let n = this.outFlow.length;
    _actor.state = this.outFlow[randomInt(n)];
  }
}

class flow{
  constructor(h1, h2){
    this.index = flow.index++;
    this.from = h1;
    this.to = h2;
    this.span;
    this.isConvertible = true; // うんまぁそうでしょうね
    // 行先が一時的になくなったらfalseもありえる・・というか保留中？
    // で、正式に決定したらtrueに戻す的な
    // 多分線分みたいなのが上行ったりした行ったりするエレベータみたいなの想定してる（？）
    console.log(this.index);
  }
  registInHub(h){ this.from = h; }
  registOutHub(h){ this.to = h; this.isConvertible = true; }
  getState(){ return this.isConvertible; }
  getSpan(){ return this.span; }
  initialize(_actor){
    _actor.timer.setting(this.getSpan(), _actor.speed);
    _actor.isActive = true;
  }
  execute(_actor){} // 位置をいじるんじゃない（適当）
  convert(_actor){
    _actor.state = this.to;
  } // どうするの？
  display(gr){}
}

class straightFlow extends flow{
  constructor(h1, h2, factor){
    // factorはstraightFlowのデフォルトにする
    super(h1, h2);
    this.span = Math.sqrt(pow(h2.x - h1.x, 2) + pow(h2.y - h1.y, 2))
    this.speedFactor = factor; // たとえば2なら2倍速
  }
  getSpan(){ return this.span / this.speedFactor; }
  execute(_actor){
    // ストレートフロー
    if(!_actor.timer.getState()){ return; }
    _actor.timer.step();
    let cnt = _actor.timer.getCnt();
    _actor.pos.x = map(cnt, 0, this.span / this.speedFactor, this.from.x, this.to.x);
    _actor.pos.y = map(cnt, 0, this.span / this.speedFactor, this.from.y, this.to.y);
    if(!_actor.timer.getState()){ _actor.isActive = false; } // タイマーが切れたらnon-Activeにする
  }
  display(gr){
    gr.push();
    gr.strokeWeight(1.0);
    gr.line(this.from.x, this.from.y, this.to.x, this.to.y);
    gr.pop();
  }
}

hub.index = 0;  // convertに使うhubの連番
flow.index = 0; // convertに使うflowの連番

class actor{
  // とりあえずハブにしか置かないから
  constructor(h, speed = 1, kind = 0){
    this.state = h;
    this.pos = createVector(h.x, h.y);
    this.visual = new rollingFigure(kind); // 回転する図形
    this.timer = new counter(); // タイマーとしての役割を果たすカウンター、くらいの意味
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
    this.isActive = false; //stateにおける処理が実行中かどうかをあらわす。何もしない時はfalseのまま。
  }
  convert(){
    this.state.convert(this);
    // 上記のconvertでstateが変わっているため上と下でthis.stateの内容が異なる。
    this.state.initialize(this);
  }
  update(){
    if(!this.isActive && this.state.getState()){
      this.convert();
    }
    // はじめにnon-Activeの処理を書いてそのあとすぐActiveの処理を書くと、
    // non-Activeの中でActiveになった時にそのまま処理を行ってくれる。（従来のflow-hub-flow）
    if(this.isActive){
      this.state.execute(this); // 処理の本体（timerOffは多分この中でやるんだろう）
      if(!this.isActive && this.state.getState()){
        // 行先がない時ここはスルーで上に戻る
        this.convert();
      }
    }
  }
  display(){
    this.visual.display(this.pos);
  }
}

// figureクラスは図形の管理を行う
// やることは図形を表示させること、回転はオプションかな・・
// たとえばアイテムとか、オブジェクト的な奴とか。回転しないことも考慮しないとなぁ。
class figure{
  constructor(kind){
    this.graphic = createGraphics(20, 20);
    inputGraphic(this.graphic, kind);
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    image(this.graphic, -10, -10); // 20x20に合わせる
    pop();
  }
}

// というわけでrollingFigure.
class rollingFigure extends figure{
  constructor(kind){
    super(kind);
    this.rotation = random(2 * PI);
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    this.rotation += 0.1;
    rotate(this.rotation);
    image(this.graphic, -10, -10); // 20x20に合わせる
    pop();
  }
}

class entity{
  constructor(){
    this.mainGraph = new graph();
    this.subGraph = new graph();
    this.mainHubNum = 0;
    this.mainFlowNum = 0;
    this.actors = [];
  }
  // よく考えたらmainもsubもこっちにあるわけで。mainとsubの初期状態での連携もあるのに、
  // 接続を個々のグラフにやらせるのはそもそも不可能な話だった。なので、こっちで構成します。
  // ていうかたとえば「mainのhub」→「subのhub」ってflowはどこに所属するのよ・・・・
  // 結論：hubもflowも独立に構成する。連携（composition）はなし。
  // convertの情報はentityか他の何かしらの統合体が統一的に取り扱い、そこから命令を下す。できるの？？

  // 衝撃の事実・・flowとhubの区別はしなくていいらしい。
  // じゃああれ実は全部flowだけで書ける、言われてみれば当たり前か。
  initialize(){
    // ロード！
    createPattern(); // グローバル・・
    this.mainHubNum = this.mainGraph.hubs.length;
    this.mainFlowNum = this.mainGraph.flows.length;
    this.createGraph();
  }
  createGraph(){
    this.mainGraph.createVisual();
    this.subGraph.createVisual();
  }
  getHub(index){ // 通し番号からhubを取得
    if(index < this.mainHubNum){ return this.mainGraph.hubs[index]; }
    return this.subGraph.hubs[index - this.mainHubNum];
  }
  getFlow(index){ // 通し番号からflowを取得
    if(index < this.mainFlowNum){ return this.mainGraph.flows[index]; }
    return this.subGraph.flows[index - this.mainFlowNum];
  }
  reset(){
    this.mainGraph.reset();
    this.subGraph.reset();
    this.actors = [];
  }
  registActor(defaultHubsIds, speeds, kinds){
    // 基本的にメイングラフにしかアクターを設置しないことにする
    for(let i = 0; i < defaultHubsIds.length; i++){
      let h = this.mainGraph.hubs[defaultHubsIds[i]];
      //console.log("first registActor");
      this.actors.push(new actor(h, speeds[i], kinds[i]));
    }
  }
  update(){
    this.actors.forEach(function(_actor){
      _actor.update();
    })
  }
  display(){
    image(this.mainGraph.visual, 0, 0);
    image(this.subGraph.visual, 0, 0);
    this.actors.forEach(function(_actor){
      //console.log("firstdisplay");
      _actor.display();
    })
  }
}

class graph{
  // グラフクラス
  constructor(){
    this.hubs = [];
    this.flows = [];
    this.visual = createGraphics(width, height);
  }
  reset(){
    this.hubs = [];
    this.flows = [];
    this.visual.clear();
  }
  createVisual(){
    // たとえばsubGraphで位置情報が更新されるたびにここを・・
    this.flows.forEach(function(f){ f.display(this.visual); }, this);
    this.hubs.forEach(function(h){ h.display(this.visual); }, this);
  }
  registHub(posX, posY){
    for(let i = 0; i < posX.length; i++){
      this.hubs.push(new randomHub(posX[i], posY[i]));
    }
  }
  // flowを作るときにhubを使わなきゃいいのよね
  registFlow(inHubsId, outHubsId, paramSet){
    // paramSetはパラメータの辞書(params)の配列
    for(let i = 0; i < inHubsId.length; i++){
      let inHub = this.hubs[inHubsId[i]];
      let outHub = this.hubs[outHubsId[i]];
      let newFlow = graph.createFlow(inHub, outHub, paramSet[i]);
      this.flows.push(newFlow);
      inHub.registFlow(newFlow);
    }
  }
  static createHub(px, py, params){
    if(params['type'] === 'random'){
      return new randomHub(px, py);
    }
  }
  static createFlow(inHub, outHub, params){
    if(params['type'] === 'straight'){
      return new straightFlow(inHub, outHub, params['factor']);
    }
  }
}

// 各種画像を作ります
function inputGraphic(gr, kind){
  if(kind === 0){
    gr.noStroke();
    gr.fill(0, 0, 255); // 青い四角
    gr.rect(2, 2, 16, 16);
  }
}

function createPattern(){
  let posX = [100, 300, 300, 100];
  let posY = [100, 100, 300, 300];
  all.mainGraph.registHub(posX, posY);
  let paramSet = [];
  for(let i = 0; i < 3; i++){ paramSet.push({type:'straight', factor:1}); }
  all.mainGraph.registFlow([0, 1, 2], [1, 2, 3], paramSet);
  all.registActor([0], [2], [0]);
}

/*
// 画像やエフェクトなどの構成を一括して行う（かも）
class decoration{
  constructor(){
    // 色とか
  }
}*/

// utility.
function randomInt(n){
  // 0, 1, ..., n-1のどれかを返す
  return Math.floor(random(n));
}
