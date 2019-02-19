// flowベースでの書き換えをする実験～～

'use strict';
let all; // 全体

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
    //this.params = {}; // convertに使うパラメータ（たとえば'simple'とか'random'とか指定）
    // paramsを廃止してみる
    this.initialFunc = trivVoid;
    this.completeFunc = trivVoid;
    this.convertFunc = triv;  // え？？
  }
  isConvertible(){ return this.convertible; }
  initialize(_actor){ this.initialFunc(this, _actor); } // プロセス開始時の処理。たとえばstraightFlowならtimerのsettingとか
  // default(){} // どこにも行けない時の処理を書くかもしれない
  execute(_actor){} // 処理の本体
  complete(_actor){ this.completeFunc(this, _actor); } // プロセス終了時の処理。たとえば_actor.kill()でここで終わったりとか
  // paramsに何か入れるときはここ↑に書いてください。params['id'] = '_actorの色のid' とか。
  convert(_actor){
    let nextFlow = all.getNextFlow(this.index, this.convertFunc(this, _actor));
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
    this.initialFunc(this, _actor)
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
      // default実装するなら、Activeじゃない（処理は終わった）けど待機中ってときに暇つぶしでって感じになりそう
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
      if(all.actors[selfId].index === this.index){ break; }
    }
    console.log("selfId = %d", selfId);
    all.actors.splice(selfId, 1);
  }
}

actor.index = 0; // 0, 1, 2, 3, ....

// figureクラスは図形の管理を行う
// やることは図形を表示させること、回転はオプションかな・・
// たとえばアイテムとか、オブジェクト的な奴とか。回転しないことも考慮しないとなぁ。
class figure{
  constructor(kind){
    this.kind = kind; // 0~6の値
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

// めんどくさいのでさらに書き換え。graphクラスは廃止。flowすべて持たせて。
class entity{
  constructor(){
    this.base = createGraphics(width, height);
    this.additive = createGraphics(width, height);
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列
    this.convertList = [];
    this.actors = [];
  }
  getFlow(index){
    return this.flows[index];
  }
  initialize(){
    createPattern(); // ベースグラフの作成（addは毎ターン描く）
    this.baseFlows.forEach(function(f){ f.display(this.base); }, this);
  }
  reset(){
    this.base.clear();
    this.additive.clear();
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列
    this.convertList = [];
    this.actors = [];
  }
  getNextFlow(flowId, givenId){
    // console.log(givenId);
    // givenIdが-1のときはランダム、具体的なときはそれを返す。そんだけ。
    let nextList = this.convertList[flowId];
    let nextId;
    if(givenId < 0){ nextId = nextList[randomInt(nextList.length)]; }
    else{ nextId = givenId; }
    return this.getFlow(nextList[nextId]);
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
  // flowを作るときにhubを使わなきゃいいのよね
  // flagは付加構造を作るときにfalseが使用される・・
  registFlow(paramSet, flag = true){
    // paramSetはパラメータの辞書(params)の配列
    paramSet.forEach(function(params){
      let newFlow = entity.createFlow(params);
      this.flows.push(newFlow);
      if(flag){
        this.baseFlows.push(newFlow);
      }else{
        this.addFlows.push(newFlow);
      }
    }, this);
  }
  static createFlow(params){
    if(params['type'] === 'straight'){
      return new straightFlow(params['from'], params['to'], params['factor']);
    }
  }
  update(){
    this.actors.forEach(function(_actor){
      _actor.update();
    })
  }
  display(){
    image(this.base, 0, 0);
    if(this.addFlows.length > 0){
      this.additive.clear();
      this.addFlows.forEach(function(f){ f.display(this.additive); })
    }
    this.actors.forEach(function(_actor){
      _actor.display();
    })
  }
}

// 各種画像を作ります
function inputGraphic(img, graphicsId){
  img.noStroke();
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
  }else if(graphicsId === 5){ // 水色のなんか
    img.fill(0, 162, 232);
    for(let k = 0; k < 6; k++){
      let t = 2 * PI * k / 6;
      let t1 = t + 2 * PI / 20;
      let t2 = t - 2 * PI / 20;
      img.quad(10 + 10 * sin(t), 10 - 10 * cos(t), 10 + 5 * sin(t1), 10 - 5 * cos(t1), 10, 10, 10 + 5 * sin(t2), 10 - 5 * cos(t2));
    }
  }else if(graphicsId === 6){ // 星。
    img.fill(255, 242, 0);
    for(let k = 0; k < 5; k++){
      let t = 2 * PI * k / 5;
      let t1 = t - 2 * PI / 10;
      let t2 = t + 2 * PI / 10;
      img.triangle(10 + 10 * sin(t), 10 - 10 * cos(t), 10 + 5 * sin(t1), 10 - 5 * cos(t1), 10 + 5 * sin(t2), 10 - 5 * cos(t2));
    }
    img.ellipse(10, 10, 10, 10);
  }
}

// ここでmain→subの順にregistすればOK

// 実践しましょうか
function createPattern(){
  let posX = arSeq(20, 50, 8).concat(arSeq(20, 50, 8));
  let posY = constSeq(50, 8).concat(constSeq(300, 8));
  let vecs = getVectors(posX, posY);
  let paramSet = getOrbitalFlows(vecs, arSeq(0, 1, 7).concat([8, 1, 2, 3, 4, 5, 6, 7]).concat(arSeq(9, 1, 7)), arSeq(1, 1, 7).concat([0, 9, 10, 11, 12, 13, 14,
  15]).concat(arSeq(8, 1, 7)),'straight');
  paramSet.forEach(function(params){ params['factor'] = 1; });
  all.registFlow(paramSet);
  all.convertList = [[8, 1], [9, 2], [10, 3], [11, 4], [12, 5], [13, 6], [14], [0], [15], [16], [17], [18], [19], [20], [21],
  [7], [15], [16], [17], [18], [19], [20]];
  for(let i = 0; i < 22; i++){ all.flows[i].convertible = true;  }
  for(let i = 0; i < 6; i++){ all.flows[i].convertFunc = equiv; }
  for(let i = 6; i < 22; i++){all.flows[i].convertFunc = simple; }
  // 生成ポイント
  for(let i = 16; i < 22; i++){ all.flows[i].completeFunc = generateActor; }
  // 殺す処理
  all.flows[15].completeFunc = killActor; // すげぇ。ほんとに消えやがったぜ。
  all.registActor([0, 0, 0, 0, 0, 0, 0], [1, 1.5, 2, 2.5, 3, 3.5, 4], [0, 1, 2, 3, 4, 5, 6])
}


// utility.
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

// 各種代入関数
function trivVoid(_flow, _actor){ return; }
function triv(_flow, _actor){ return -1; }
function simple(_flow, _actor){ return 0; }
function equiv(_flow, _actor){
  if(_flow.index === _actor.visual.kind){ // 色が0, 1, ..., 6に応じてconvert.
    return 0;
  }
  return 1;
}
function generateActor(_flow, _actor){ // actorの生成ポイント
  if(all.actors.length >= 10){ return; }
  all.registActor([0], [2 + randomInt(3)], [randomInt(7)]);
  // これをいくつか配置しておいて踏むと0番にactorが生成する感じ
}
function killActor(_flow, _actor){ _actor.kill(); }
