// flowベースでの書き換えをする実験～～

'use strict';
let all; // 全体
let palette; // カラーパレット

const PATTERN_NUM = 1;
const IDLE = 0;
const IN_PROGRESS = 1;
const COMPLETED = 2;

function setup(){
  createCanvas(400, 600);
  palette = [color(248, 155, 1), color(248, 230, 1), color(38, 248, 1), color(1, 248, 210), color(2, 9, 247), color(240, 2, 247), color(249, 0, 6)];
  all = new entity();
  all.initialize();
  //console.log(palette);
}

function draw(){
  background(220);
  all.update();
  all.draw();
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

// 簡単なものでいいです（簡単になりすぎ）
class counter{
  constructor(){
    this.cnt = 0;
  }
  getCnt(){ return this.cnt; }
  reset(){ this.cnt = 0; }
  step(diff = 1){
    this.cnt += diff; // カウンターはマイナスでもいいんだよ
  }
} // limitは廃止（使う側が何とかしろ）

class loopCounter extends counter{ // ぐるぐるまわる
  constructor(period){ // periodは正にしてね
    super();
    this.period = period;
  }
  step(diff = 1){
    this.cnt += diff;
    if(this.cnt > this.period){ this.cnt -= this.period; }
  }
}
class reverseCounter extends counter{ // いったりきたり
  constructor(interval){
    super();
    this.interval = interval;
    this.upward = true; // falseのときは正の数を与えると下がります。常に正の数を与え続けることができます。
  }
  step(diff = 1){
    // diffは常に正オッケーです。
    this.cnt += diff * (this.upward ? 1 : -1);
    if(this.cnt > this.interval){ this.cnt = 2 * this.interval - this.cnt; }
    else if(this.cnt < 0){ this.cnt = -this.cnt; }
  }
}

// 全部フロー。ただし複雑なconvertはハブにおまかせ～色とかいじれるといいね。今位置情報しかいじってない・・
class flow{
  constructor(){
    this.index = flow.index++;
    this.convertList = []; // 次のflowのリスト
    this.nextFlowIndex = -1; // デフォルトは-1, ランダムの意味
  }
  initialize(_actor){} // stateを送らせるのはactor.
  execute(_actor){
    _actor.setState(COMPLETED) // デフォルトはstateをCOMPLETEDにするだけ。こっちはタイミング決めるのはflowですから。
  }
  convert(_actor){
    //_actor.setState(IDLE); // IDLEにするのはactor.
    if(this.convertList.length === 0){
      _actor.setFlow(undefined);
      _actor.inActivate(); // 次のフローがなければすることはないです。止まります。再びあれするならflowをsetしてね。
      return;
    }
    if(this.nextFlowIndex < 0){
      _actor.setFlow(this.convertList[randomInt(this.convertList.length)]);
    }else{
      _actor.setFlow(this.convertList[this.nextFlowIndex]);
    } // 次のflowが与えられるならそのままisActive継続、次の処理へ。
  }
  display(gr){} // 一応書いておかないと不都合が生じそうだ
}

// hubです。位置情報とかは基本なし（あることもある）。複雑なflowの接続を一手に引き受けます。
class assembleHub extends flow{
  // いくつか集まったら解放される。
  constructor(limit){
    super();
    this.limit = limit;
    this.volume = 0; // lim-1→limのときtrue, 1→0のときfalse.
    this.open = false; // 出口が開いてるかどうかのフラグ
  }
  initialize(_actor){
    this.volume++; // これだけ。
    if(this.volume >= this.limit){ this.open = true; } // limitに達したら開くよ
  }
  execute(_actor){
    if(this.open){
      _actor.setState(COMPLETED);
      this.volume--; // 出て行ったら減らす
      if(this.volume === 0){ this.open = false; } // 0になったタイミングで閉じる
    } // 開いてるなら行って良し
  }
}

// 始点と終点とspanからなりどこかからどこかへ行くことが目的のFlow.
// 対象はmovingActorを想定しているのでposとか持ってないとエラーになります。
class orbitalFlow extends flow{
  constructor(from, to){
    super();
    this.from = from; // スタートの位置ベクトル
    this.to = to; // ゴールの位置ベクトル
    this.span;
  }
  getSpan(){ return this.span; }
  initialize(_actor){
    _actor.pos.set(this.from.x, this.from.y); // 初期位置与える、基本これでactorの位置いじってる、今は。
    _actor.timer.reset(); // あ、resetでいいの・・
  }
  getProgress(_actor, diff){ // 進捗状況を取得（0~1）
    _actor.timer.step(diff); // 進める～
    let cnt = _actor.timer.getCnt(); // カウントゲットする～
    if(cnt >= this.span){
      cnt = this.span;
      _actor.setState(COMPLETED); // 処理終了のお知らせ
    }
    return cnt / this.span; // 進捗報告(％)
  }
}

class jumpFlow extends orbitalFlow{
  // ジャンプするやつ
  constructor(from, to){
    super(from, to);
    this.span = p5.Vector.dist(from, to);
  }
  execute(_actor){
    let progress = this.getProgress(_actor, _actor.speed);
    _actor.pos.x = map(progress, 0, 1, this.from.x, this.to.x);
    _actor.pos.y = map(progress, 0, 1, this.from.y, this.to.y);
    _actor.pos.y -= 2 * this.span * progress * (1 - progress); // 高さはとりあえずthis.span/2にしてみる
  }
}

class straightFlow extends orbitalFlow{
  constructor(from, to, factor){
    super(from, to);
    this.span = p5.Vector.dist(from, to);
    this.factor = factor; // 2なら2倍速とかそういう。
  }
  execute(_actor){
    // 直線
    let progress = this.getProgress(_actor, _actor.speed * this.factor); // 速くなったり遅くなったり
    _actor.pos.x = map(progress, 0, 1, this.from.x, this.to.x);
    _actor.pos.y = map(progress, 0, 1, this.from.y, this.to.y);
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

// actorを画面外にふっとばす。ふっとばし方によりいろいろ。
class shootingFlow extends flow{
  constructor(){ super(); }
  initialize(_actor){
    _actor.timer.reset(); // resetするだけ
  }
  static eject(_actor){
    // 画面外に出たら抹殺
    if(_actor.pos.x > width || _actor.pos.x < 0 || _actor.pos.y < 0 || _actor.pos.y > height){
      _actor.kill(); // 画面外に出たら消える
    }
  }
}

// 放物線を描きながら画面外に消えていく
class fallFlow extends shootingFlow{
  constructor(vx, vy, gravity){
    super();
    this.vx = vx; // 水平方向の初速度
    this.vy = vy; // 垂直方向の初速度
    this.gravity = gravity;
  }
  execute(_actor){
    _actor.timer.step(); // カウントは1ずつ増やす
    let cnt = _actor.timer.getCnt();
    _actor.pos.x += this.vx * cnt;
    _actor.pos.y += this.vy - this.gravity * cnt; // これでいいね。物理。
    shootingFlow.eject(_actor);
  }
}

// 直線的に動きながら消滅
class throwFlow extends shootingFlow{
  constructor(v){
    super();
    this.v = v; // 大きさ正規化しないほうが楽しいからこれでいいや
  }
  execute(_actor){
    _actor.pos.x += this.v.x * _actor.speed; // ベクトルvの方向にとんでいく。
    _actor.pos.y += this.v.y * _actor.speed;
    shootingFlow.eject(_actor);
  }
}

flow.index = 0; // convertに使うflowの連番

// 純粋なactorはflowをこなすだけ、言われたことをやるだけの存在
class actor{
  constructor(f = undefined, speed = 1, kind = 0){
    // kindはそのうち廃止してビジュアルをセッティングするなんかつくる
    this.index = actor.index++;
    this.currentFlow = f; // 名称をcurrentFlowに変更
    this.timer = new counter();
    this.isActive = false; // デフォルトをfalseにしてプログラムのインプット時にtrueにする作戦で行く
    this.state = IDLE; // 状態（IDLE, IN_PROGRESS, COMPLETED）
  }
  activate(){ this.isActive = true; } // isActiveがfalse⇔updateしない。シンプル。これを目指している。
  inActivate(){ this.isActive = false; } // 冗長だけどコードの可読性の為に両方用意する。
  setState(newState){ this.state = newState; } // stateをチェンジ
  setFlow(newFlow){ this.currentFlow = newFlow; } // flowをセットする
  // 再スタートさせるなら、まずflowをセット、次いでactivateという流れになります。
  // flowだけセットしてactivateしなければ待機状態を実現できます。いわゆるポーズ、
  // entityの側でまとめてactivate, inActivateすればまとめて動きを止めることも・・・・
  update(){
    if(!this.isActive){ return; } // activeじゃないなら何もすることはない。
    if(this.state === IDLE){
      this.currentFlow.initialize(this); // flowに初期化してもらう
      this.setState(IN_PROGRESS);
    }
    if(this.state === IN_PROGRESS){
      this.currentFlow.execute(this); // 実行！この中で適切なタイミングでsetState(COMPLETED)してもらうの
    }
    if(this.state === COMPLETED){
      this.setState(IDLE);
      this.currentFlow.convert(this); // ここで行先が定められないと[IDLEかつundefined]いわゆるニートになります（おい）
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
  constructor(f = undefined, speed = 1, kind = 0){
    super(f);
    this.pos = createVector(0, 0); // flowが始まれば勝手に・・って感じ。
    this.visual = new rollingFigure(kind); // 回転する図形
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
  }
  display(){
    this.visual.display(this.pos);
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
  // updateはflowを定めてたとえば小さくなって消えるとか出来るようになるんだけどね（まだ）
  // もしupdateするならactorのupdateに書くことになりそうだけど。
  display(pos){
    push();
    translate(pos.x, pos.y);
    this.rotation += 0.1; // これも本来はfigureのupdateに書かないと・・基本的にupdate→drawの原則は破っちゃいけない
    rotate(this.rotation);
    image(this.graphic, -10, -10); // 20x20に合わせる
    pop();
  }
}

// flowのupdateとかやりたいわね
// 使い終わったactorの再利用とかしても面白そう（他のプログラムでやってね）（trash）
class entity{
  constructor(){
    this.base = createGraphics(width, height);
    this.additive = createGraphics(width, height); // addFlowsで作るやつー
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列    // これをupdateすることでflowを動かしたいんだけど
    this.actors = [];
    this.patternIndex = 1; // うまくいくのかな・・
    this.patternArray = [createPattern0, createPattern1];
  }
  getFlow(index){
    return this.flows[index];
  }
  initialize(){
    this.patternArray[this.patternIndex]();
    this.baseFlows.forEach(function(f){ f.display(this.base); }, this); // ベースグラフの初期化（addは毎ターン）
  }
  reset(){
    this.base.clear();
    this.additive.clear();
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列
    this.actors = [];
    flow.index = 0; // 通し番号リセット
    actor.index = 0;
  }
  activateAll(){ // まとめてactivate.
    this.actors.forEach(function(_actor){ _actor.activate(); }, this);
    // 一部だけしたくないならこの後個別にinActivateするとか？
  }
  switchPattern(newIndex){
    this.reset();
    this.patternIndex = newIndex;
    this.initialize(); // これだけか。まぁhub無くなったしな。
  }
  registActor(flowIds, speeds, kinds){
    // flowはメソッドでidから取得。
    for(let i = 0; i < flowIds.length; i++){
      let f = this.getFlow(flowIds[i]);
      let newActor = new movingActor(f, speeds[i], kinds[i])
      // newActor.initialize(); // ここで初期化しません
      this.actors.push(newActor);
    }
  }
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
  registNextFlow(index, nextIndexList){
    // index番のflowの行先リストをnextIndexListによって作る
    nextIndexList.forEach(function(nextIndex){
      this.flows[index].convertList.push(this.flows[nextIndex]);
    }, this)
  }
  registNextFlowMulti(indexList, nextIndexListArray){
    // IndexListに書かれたindexのflowにまとめて指定する
    // たとえば[6, 7, 8], [[2], [3], [4, 5]] ってやると6に2, 7に3, 8に4, 5が指定される
    for(let i = 0; i < indexList.length; i++){
      this.registNextFlow(indexList[i], nextIndexListArray[i]);
    }
  }
  static createFlow(params){
    if(params['type'] === 'straight'){
      return new straightFlow(params['from'], params['to'], params['factor']);
    }else if(params['type'] === 'jump'){
      return new jumpFlow(params['from'], params['to']);
    }else if(params['type'] === 'assemble'){
      return new assembleHub(params['limit']);
    }else if(params['type'] === 'fall'){
      return new fallFlow(params['vx'], params['vy'], params['gravity']);
    }else if(params['type'] === 'throw'){
      return new throwFlow(params['v']); // fromは廃止
    }
  }
  update(){
    this.actors.forEach(function(_actor){
      _actor.update(); // flowもupdateしたいんだけどね
    })
  }
  draw(){
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

// --------------------------------------------------------------------------------------- //

// ここでmain→subの順にregistすればOK
function createPattern0(){
  // 作ってみるか・・・（どきどき）
  let vecs = getVector([100, 100, 300, 300], [100, 300, 300, 100]);
  let paramSet = getOrbitalFlow(vecs, [0, 1, 2, 3], [1, 2, 3, 0], 'straight');
  all.registFlow(paramSet);
  all.registNextFlowMulti([0, 1, 2, 3], [[1], [2], [3], []]);
  all.registActor([0], [2], [0]);
  all.activateAll();
}

function createPattern1(){
  let posX = multiSeq([100, 200, 300], 4);
  let posY = jointSeq([constSeq(100, 3), constSeq(200, 3), constSeq(300, 3), constSeq(400, 3)]);
  let vecs = getVector(posX, posY);
  let paramSet = getOrbitalFlow(vecs, [1, 1, 0, 4, 2, 4, 4, 3, 7, 5, 6, 8], [0, 2, 3, 1, 5, 3, 5, 6, 4, 8, 7, 7], 'straight');
  paramSet.push({type:'assemble', limit: 3});
  all.registFlow(paramSet);
  all.registNextFlowMulti([0, 1, 2, 3, 4, 5], [[2], [4], [7], [0, 1], [9], [7]]);
  let additional = getOrbitalFlow(vecs, [6, 10, 8, 9, 11], [9, 7, 11, 10, 10], 'jump');
  all.registFlow(additional);
  all.registNextFlowMulti([6, 7, 8, 9, 10, 11, 12], [[9], [10, 13], [12], [11, 15], [8], [8], [3, 5, 6]]);
  all.registNextFlowMulti([13, 14, 15, 16, 17], [[16], [8], [17], [14], [14]]);
  console.log(all.flows[7]);
  all.registActor([3, 5, 6], [2, 2, 2], [0, 1, 2]);
  all.activateAll();
}
// generateHubとkillHub作りたい
// 色に合わせてconvertも作りたいけど明日にしよ

// --------------------------------------------------------------------------------------- //
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

function jointSeq(arrayOfArray){
  // 全部繋げる
  let array = arrayOfArray[0];
  console.log(array);
  for(let i = 1; i < arrayOfArray.length; i++){
    array = array.concat(arrayOfArray[i]);
  }
  return array;
}

function multiSeq(a, m){
  // arrayがm個
  let array = [];
  for(let i = 0; i < m; i++){ array = array.concat(a); }
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

function getVector(posX, posY){
  let vecs = [];
  for(let i = 0; i < posX.length; i++){
    vecs.push(createVector(posX[i], posY[i]));
  }
  return vecs;
}

// OrbitalFlow用の辞書作るよー
function getOrbitalFlow(vecs, fromIds, toIds, typename, allOne = true){
  let paramSet = [];
  for(let i = 0; i < fromIds.length; i++){
    let dict = {type: typename, from: vecs[fromIds[i]], to: vecs[toIds[i]]};
    if(allOne){ dict['factor'] = 1; } // factorをすべて1にするオプション
    paramSet.push(dict);
  }
  return paramSet;
}
