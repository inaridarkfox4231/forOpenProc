// intersectionのchange.

let all;

function setup(){
  createCanvas(400, 400);
  all = new entity();
  all.initialize();
}

function draw(){
  background(220);
  all.update();
  all.display();
}

// デバッグ用
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
    this.diff; // これ要るかな・・カウントの進め方をカスタマイズできるようにすれば要らないかも
  }
  getCnt(){ return this.cnt; }
  getState(){ return this.isOn; }
  setting(lim, diff){
    this.cnt = 0;
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

// 全部フロー。convertはallの仕事。hubは廃止。
class flow{
  constructor(){
    this.index = flow.index++;
    this.convertible = false; // デフォルト（convertできるところだけtrueにする）
    this.params = {}; // convertに使うパラメータ（たとえば'simple'とか'random'とか指定）
  }
  isConvertible(){ return this.convertible; }
  initialize(_actor){} // プロセス開始時の処理。たとえばstraightFlowならtimerのsettingとか
  // default(){} // どこにも行けない時の処理を書くかもしれない
  execute(_actor){}
  complete(_actor){} // プロセス終了時の処理。たとえば_actor.kill()でここで終わったりとかね
  // paramsに何か入れるときはここ↑に書いてください。params['id'] = '_actorの色のid' とか。
  convert(_actor){
    let nextFlow = all.getNextFlow(this.index, this.params); // paramsから次のFlowを取得
    _actor.state = nextFlow;
  } // allに頼んで次のflowを設定してもらう
  display(gr){} // line型なら線、hub型ならボックスとかそういうのを描画する用。
}

// 始点と終点とspanからなりどこかからどこかへ行くことが目的のFlow.
class orbitalFlow extends flow{
  constructor(from, to){
    super();
    this.from = from; // スタートの位置ベクトル
    this.to = to; // ゴールの位置ベクトル
    this.span;
  }
  getSpan(){ return this.span; }
  initialize(_actor){
    _actor.pos.set(this.from.x, this.from.y);
    _actor.timer.setting(this.span, _actor.speed);
  }
}

class straightFlow extends orbitalFlow{
  constructor(from, to, factor){
    super(from, to);
    this.span = p5.Vector.dist(from, to);
    this.factor = factor; // 2なら2倍速とかそういう。
  }
  getSpan(){
    return this.span / this.factor;
  }
  execute(_actor){
    // ストレートフロー
    if(!_actor.timer.getState()){ return; } // 車の一時停止とかに使えそう
    _actor.timer.step();
    //console.log(_actor.pos);
    let cnt = _actor.timer.getCnt();
    _actor.pos.x = map(cnt, 0, this.span / this.factor, this.from.x, this.to.x);
    _actor.pos.y = map(cnt, 0, this.span / this.factor, this.from.y, this.to.y);
    if(!_actor.timer.getState()){ _actor.isActive = false; } // タイマーが切れたらnon-Activeにする
  }
  display(gr){
    // 線を引くだけです
    gr.push();
    gr.strokeWeight(1.0);
    gr.line(this.from.x, this.from.y, this.to.x, this.to.y);
    gr.translate(this.from.x, this.from.y); // 矢印の根元に行って
    let directionVector = createVector(this.to.x - this.from.x, this.to.y - this.from.y);
    gr.rotate(directionVector.heading()); // ぐるんってやって行先をx軸正方向に置いて
    let arrowSize = 7;
    gr.translate(this.span - arrowSize, 0);
    gr.fill(0);
    gr.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    gr.pop();
  }
}
// とりあえずこれしか使ってないですね・・あのプログラムでは。というか基本的に。
// それこそ色に応じてオブジェクトをえり分けるとかそういうことをやってないですから。今のところは。
// たとえばgenerateHubとかこの後定義するけどね。

flow.index = 0; // convertに使うflowの連番

class actor{
  constructor(f, speed = 1, kind = 0){
    this.index = actor.index++;
    this.state = f;
    this.pos = createVector(0, 0); // flowが始まれば勝手に・・って感じ。
    this.visual = new rollingFigure(kind); // 回転する図形
    this.timer = new counter(); // タイマーとしての役割を果たすカウンター、くらいの意味
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
    this.isActive = true; // stateにおける処理が実行中かどうかをあらわす。何もしない時はfalseのまま。
    this.state.initialize(this); // これ、忘れてた。
  }
  convert(){
    this.state.convert(this);
    // 上記のconvertでstateが変わっているため上と下でthis.stateの内容が異なる。
    this.state.initialize(this);
    this.isActive = true;
  }
  update(){
    if(!this.isActive && this.state.isConvertible()){
      this.convert();
    }
    // flow-hub-flowはもうなくなったよ。
    if(this.isActive){
      this.state.execute(this); // 処理の本体（timerOffは多分この中でやるんだろう）
      // executeの結果non-Activeになったらcomplete処理をする
      if(!this.isActive){
        this.state.complete(this)
        // その時点でconvert出来ない時は最初に戻る。convert出来るようになるまで停滞する。
        if(this.state.isConvertible()){ this.convert(); }
      }
    }
  }
  display(){
    this.visual.display(this.pos);
  }
  kill(){
    // 自分を排除する
    let selfId;
    for(selfId = 0; selfId < all.actors.length; selfId++){
      if(all.actors[selfId].id === this.index){ break; }
    }
    all.actors.splice(selfId, 1);
  }
}

actor.index = 0; // 0, 1, 2, 3, ....

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
    this.mainFlowNum = 0; // mainGraphのFlowの総数
    this.convertList = []; // convertに使う配列の配列. 通し番号で入ってる。
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
    //console.log(this.mainGraph.flows);
    this.createGraph();
  }
  createGraph(){
    this.mainGraph.createVisual();
    this.subGraph.createVisual();
  }
  getFlow(index){ // 通し番号からflowを取得
    // 番号はmain→subの順につけるのよー
    //console.log("getFlow");
    //console.log(this.mainGraph.flows);
    if(index < this.mainFlowNum){ return this.mainGraph.flows[index]; }
    return this.subGraph.flows[index - this.mainFlowNum];
  }
  reset(){
    this.mainGraph.reset();
    this.subGraph.reset();
    this.actors = [];
  }
  getNextFlow(index, params){
    let nextFlowIndex;
    let indexList = this.convertList[index];
    if(params['type'] === 'random'){ nextFlowIndex = indexList[randomInt(indexList.length)]; }
    else if(params['type'] === 'simple'){ nextFlowIndex = indexList[0]; }
    else if(params['type'] === 'direct'){ nextFlowIndex = indexList[params['id']];
    }
    return this.getFlow(nextFlowIndex);
  }
  registActor(flowIds, speeds, kinds){
    // flowはメソッドでidから取得。
    for(let i = 0; i < flowIds.length; i++){
      let f = this.getFlow(flowIds[i]);
      //console.log('registActor');
      //console.log(f);
      this.actors.push(new actor(f, speeds[i], kinds[i]));
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
      _actor.display();
    })
  }
}

class graph{
  // グラフクラス
  constructor(){
    this.flows = [];
    this.visual = createGraphics(width, height);
  }
  reset(){
    this.flows = [];
    this.visual.clear();
  }
  // subGraphの書き換えはここで。
  createVisual(){
    // たとえばsubGraphで位置情報が更新されるたびにここを・・
    this.flows.forEach(function(f){ f.display(this.visual); }, this);
  }
  // flowを作るときにhubを使わなきゃいいのよね
  registFlow(paramSet){
    // paramSetはパラメータの辞書(params)の配列
    paramSet.forEach(function(params){
      let newFlow = graph.createFlow(params);
      //console.log(newFlow);
      this.flows.push(newFlow);
    }, this);
  }
  static createFlow(params){
    if(params['type'] === 'straight'){
      return new straightFlow(params['from'], params['to'], params['factor']);
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

// ここでmain→subの順にregistすればOK
function createPattern(){
  let posX = [100, 300, 300, 100];
  let posY = [100, 100, 300, 300];
  let vecs = getVectors(posX, posY);
  let paramSet = getOrbitalFlows(vecs, [0, 1, 2], [1, 2, 3], 'straight');
  paramSet.forEach(function(params){ params['factor'] = 1; });
  // mainとsubへの振り分け
  all.mainGraph.registFlow(paramSet);
  all.mainFlowNum = all.mainGraph.flows.length; // mainGraphのflowの数はここで計算する
  // パターンで指定することが増えたね。
  // 1. convertListの初期設定
  // 2. convert typeの設定、convert可能性の初期設定（たとえば行き止まりには指定しない）
  all.convertList = [[1], [2], []];
  let mainFlows = all.mainGraph.flows;
  //console.log(all.mainGraph.flows);
  for(let i = 0; i < 2; i++){ mainFlows[i].params['type'] = 'simple'; mainFlows[i].convertible = true; }
  all.registActor([0], [2], [0]);
}

// utility.
function randomInt(n){
  // 0, 1, ..., n-1のどれかを返す
  return Math.floor(random(n));
}

function getVectors(posX, posY){
  let vecs = [];
  for(let i = 0; i < posX.length; i++){
    vecs.push(createVector(posX[i], posY[i]));
  }
  return vecs;
}

// OrbitalFlow用の辞書作るよー
function getOrbitalFlows(vecs, fromIds, toIds, typename){
  let paramSet = [];
  for(let i = 0; i < fromIds.length; i++){
    let dict = {type: typename, from: vecs[fromIds[i]], to: vecs[toIds[i]]};
    paramSet.push(dict);
  }
  return paramSet;
}
