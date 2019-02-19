// Mass Game.
// 36個でやる。一番多彩な表現が可能でかつもっとも少ないので。
// oriented Flow(行先固定のイージングフロー)を使う。
// 36個各々についてidで行先を管理すればフローは3つくらいで済む。（actorに配列を持たせる）

'use strict';
let all; // 全体
let palette; // カラーパレット

function setup(){
  createCanvas(400, 400);
  palette = [color(248, 155, 1), color(248, 230, 1), color(38, 248, 1), color(1, 248, 210), color(2, 9, 247), color(240, 2, 247), color(249, 0, 6)];
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

// バリエーションチェンジ
function mouseClicked(){
  let newIndex = (all.patternIndex + 1) % PATTERN_NUM;
  all.switchPattern(newIndex);
}

// 簡単なものでいいです
class counter{
  constructor(){
    this.cnt = 0;
    this.limit; // -1に設定すると無限カウントになる
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
    if(this.cnt > this.limit && this.limit > 0){ this.isOn = false; } // 忘れてたーーー -1だとあれ。
  }
  pause(){ this.isOn = !this.isOn; } // ポーズ要るかどうか
}

// 全部フロー。convertはallの仕事。hubは廃止。
// あ、そか、いじるの単に数でいいんだ。位置情報とかじゃなくても。まあそれはそれで。
class flow{
  constructor(){
    this.index = flow.index++;
    this.convertible = true; // デフォルト（convertできないところだけsettingでfalseにする）
    //this.params = {}; // convertに使うパラメータ（たとえば'simple'とか'random'とか指定）
    // paramsを廃止してみる
    this.initialFunc = trivVoid;
    this.completeFunc = trivVoid;
    this.convertFunc = triv;  // え？？
  }
  isConvertible(){ return this.convertible; }
  initialize(_actor){ this.initialFunc(this, _actor); } // プロセス開始時の処理。たとえばstraightFlowならtimerのsettingとか
  // defaultAction(_actor){} // completeしたあとconvert出来ない時の処理（一定のペースで跳ねるとか？ぴょんぴょん）
  // エレベータの待ち時間とか表現するのに使えるかもしれない
  execute(_actor){} // 処理の本体
  complete(_actor){ this.completeFunc(this, _actor); } // プロセス終了時の処理。たとえば_actor.kill()でここで終わったりとか
  // paramsに何か入れるときはここ↑に書いてください。params['id'] = '_actorの色のid' とか。
  convert(_actor){
    let nextFlow = all.getNextFlow(this.index, this.convertFunc(this, _actor));
    //console.log(nextFlow);
    _actor.state = nextFlow;
  } // allに頼んで次のflowを設定してもらう
  display(gr){} // line型なら線、hub型ならボックスとかそういうのを描画する用。
}

// hubです。位置情報とかはないです。あくまでflowをつなぐもの、位置はactorが持ってるので。
class assembleHub extends flow{
  // いくつか集まったら解放される。
  constructor(lim){
    super();
    this.limit = lim;
    this.volume = 0; // lim-1→limのときtrue, 1→0のときfalse.
    this.convertible = false;
  }
  initialize(_actor){
    this.initialFunc(this, _actor);
    //console.log(this);
    this.volume++;
    //console.log(this.volume);
    //console.log(this.limit);
    if(this.volume >= this.limit){ this.convertible = true; }
  }
  execute(_actor){ _actor.isActive = false; } // やることないのでいきなりfalse.
  // やったできた。簡単じゃないかー。
  // convertFuncでvolumeと連携させれば「散開」も可能になるはず（ばーーってやつ）
  convert(_actor){
    let nextFlow = all.getNextFlow(this.index, this.convertFunc(this, _actor));
    _actor.state = nextFlow;
    //console.log(nextFlow);
    this.volume--;
    if(this.volume === 0){ this.convertible = false; } // 空になったら閉じる
  }
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
    // タイマー使ってるけどオービタルだからだよ
    this.initialFunc(this, _actor)
    _actor.pos.set(this.from.x, this.from.y);
    _actor.timer.setting(this.span, _actor.speed);
  }
}

class jumpFlow extends orbitalFlow{
  // ジャンプするやつ
  constructor(from, to){
    super(from, to);
    this.span = p5.Vector.dist(from, to);
  }
  execute(_actor){
    if(!_actor.timer.getState()){ return; } // 車の一時停止とかに使えそう
    _actor.timer.step();
    let cnt = _actor.timer.getCnt();
    _actor.pos.x = map(cnt, 0, this.span, this.from.x, this.to.x);
    _actor.pos.y = map(cnt, 0, this.span, this.from.y, this.to.y);
    _actor.pos.y -= (2 / this.span) * cnt * (this.span - cnt); // 高さはとりあえずthis.span/2にしてみる
    if(!_actor.timer.getState()){ _actor.isActive = false; } // タイマーが切れたらnon-Activeにする
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

// actorを画面外にふっとばす
class shootingFlow extends flow{
  constructor(from){
    super();
    this.from = from;
  }
  initialize(_actor){
    this.initialFunc(this, _actor)
    _actor.pos.set(this.from.x, this.from.y);
    _actor.timer.setting(-1, _actor.speed); // 画面外に出たらactorをkillするので無限カウントで
  }
  static eject(_actor){
    // 画面外に出たら抹殺(isActiveはそのままでいい)
    if(_actor.pos.x > width || _actor.pos.x < 0 || _actor.pos.y < 0 || _actor.pos.y > height){
      _actor.kill(); // 画面外に出たら消える
    }
  }
}

// 放物線を描きながら画面外に消えていく
class fallFlow extends shootingFlow{
  constructor(from, ax, vy){
    super(from);
    this.ax = ax;
    this.vy = vy; // 加速度ax, 初期速度vy.
  }
  execute(_actor){
    if(!_actor.timer.getState()){ return; }
    _actor.timer.step();
    let cnt = _actor.timer.getCnt();
    _actor.pos.x += this.ax;
    _actor.pos.y += (cnt - this.vy) / 10;
    shootingFlow.eject(_actor);
  }
}

// 直線的に動きながら消滅
class throwFlow extends shootingFlow{
  constructor(from, v){
    super(from);
    this.v = v; // 大きさ正規化しないほうが楽しいからこれでいいや
  }
  execute(_actor){
    if(!_actor.timer.getState()){ return; }
    _actor.timer.step();
    let cnt = _actor.timer.getCnt();
    _actor.pos.x += this.v.x * _actor.speed; // ベクトルvの方向にばひゅーん
    _actor.pos.y += this.v.y * _actor.speed;
    shootingFlow.eject(_actor);
  }
}

// あっちでやったように、ある程度ロードごとにランダムでfallやthrow, それにいろんな方向で
// 生成されるようにしたら面白いかもね。

// とりあえずこれしか使ってないですね・・あのプログラムでは。というか基本的に。
// それこそ色に応じてオブジェクトをえり分けるとかそういうことをやってないですから。今のところは。

flow.index = 0; // convertに使うflowの連番

// 純粋なactorはflowをこなすだけ、言われたことをやるだけの存在
class actor{
  constructor(f, speed = 1, kind = 0){
    this.index = actor.index++;
    this.state = f;
    this.timer = new counter(); // タイマーとしての役割を果たすカウンター、くらいの意味
    this.isActive = true; // stateにおける処理が実行中かどうかをあらわす。何もしない時はfalseのまま。
  }
  initialize(){
    this.state.initialize(this);
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
  kill(){
    // 自分を排除する
    let selfId;
    for(selfId = 0; selfId < all.actors.length; selfId++){
      if(all.actors[selfId].index === this.index){ break; }
    }
    all.actors.splice(selfId, 1);
  }
}

// 色や形を与えられたactor. ビジュアル的に分かりやすいので今はこれしか使ってない。
class movingActor extends actor{
  constructor(f, speed = 1, kind = 0){
    super(f);
    this.pos = createVector(0, 0); // flowが始まれば勝手に・・って感じ。
    this.visual = new rollingFigure(kind); // 回転する図形
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
  }
  display(){
    this.visual.display(this.pos);
  }
}

// 正直、actorの原型を作ってその継承としてmovingActor(従来のActor)を改めて定めることの利点がよく分からない
// けどね。まあ応用が利くという意味では・・でもflowの継承ああいう風にしちゃったから、それに随伴する形で・・
// いや、movingActorが多彩なflowに随伴しているのか？まあ、見栄え大事だし、でもこのシステムは見栄えがすべて
// ではないはずなのよね。まだよく分かんないのだけど。

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
    this.additive = createGraphics(width, height); // addFlowsで作るやつー
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列
    this.convertList = [];
    this.actors = [];
    this.patternIndex = 0; // うまくいくのかな・・
    this.patternArray = [createPattern0, createPattern1, createPattern2];
  }
  getFlow(index){
    return this.flows[index];
  }
  initialize(){
    this.patternArray[this.patternIndex]();
    //console.log(this.convertList);
    this.baseFlows.forEach(function(f){ f.display(this.base); }, this); // ベースグラフの初期化（addは毎ターン）
  }
  reset(){
    this.base.clear();
    this.additive.clear();
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列
    this.convertList = [];
    this.actors = [];
    // 通し番号リセットしないといけないんだ・・・・・・今まで使ってなかったから全然気づかなかった
    flow.index = 0;
    actor.index = 0;
  }
  switchPattern(newIndex){
    this.reset();
    this.patternIndex = newIndex;
    this.initialize(); // これだけか。まぁhub無くなったしな。
  }
  getNextFlow(flowId, givenId){
    // givenIdが-1のときはランダム、具体的なときはそれを返す。そんだけ。
    let nextList = this.convertList[flowId];
    let nextId;
    if(givenId < 0){
      nextId = nextList[randomInt(nextList.length)];
    }else{
      nextId = nextList[givenId]; // わぁ・・勘違いしてた。。
    }
    return this.getFlow(nextId);
  }
  registActor(flowIds, speeds, kinds){
    // flowはメソッドでidから取得。
    for(let i = 0; i < flowIds.length; i++){
      let f = this.getFlow(flowIds[i]);
      let newActor = new movingActor(f, speeds[i], kinds[i])
      newActor.initialize(); // ここで初期化する
      this.actors.push(newActor);
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
    }else if(params['type'] === 'jump'){
      return new jumpFlow(params['from'], params['to']);
    }else if(params['type'] === 'assemble'){
      return new assembleHub(params['limit']);
    }else if(params['type'] === 'fall'){
      return new fallFlow(params['from'], params['ax'], params['vy']);
    }else if(params['type'] === 'throw'){
      return new throwFlow(params['from'], params['v']);
    }
  }
  update(){
    this.actors.forEach(function(_actor){
      _actor.update();
    })
  }
  display(){
    image(this.base, 0, 0);
    if(this.addFlows.length > 0){ // 付加的な要素は毎フレーム描画し直す感じで
      this.additive.clear();
      this.addFlows.forEach(function(f){ f.display(this.additive); })
      image(this.additive, 0, 0); // 忘れてた、これ無かったら描画されないじゃん
    }
    this.actors.forEach(function(_actor){ // actorの描画
      _actor.display();
    })
  }
}

// 各種画像を作ります
function inputGraphic(img, graphicsId){
  img.noStroke();
  img.fill(palette[graphicsId]);
  img.rect(2, 2, 16, 16);
}

//---------------------------------------------------------------------------------------//
// utility.
function typeSeq(typename, n){
  // typenameの辞書がn個。
  let array = [];
  for(let i = 0; i < n; i++){ array.push({type: typename}); }
  return array;
}

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
function getOrbitalFlow(vecs, fromIds, toIds, typename){
  let paramSet = [];
  for(let i = 0; i < fromIds.length; i++){
    let dict = {type: typename, from: vecs[fromIds[i]], to: vecs[toIds[i]]};
    paramSet.push(dict);
  }
  return paramSet;
}

function getShootingFlow(vecs, fromIds, typename){
  let paramSet = [];
  for(let i = 0; i < fromIds.length; i++){
    let dict = {type: typename, from: vecs[fromIds[i]]};
    paramSet.push(dict);
  }
  return paramSet;
}

// 各種代入関数
function trivVoid(_flow, _actor){ return; } // initializeとcomplete時のデフォルト。
function triv(_flow, _actor){ return -1; } // デフォルトではすべてランダムコンバート、を表現したもの
function simple(_flow, _actor){ return 0; }
