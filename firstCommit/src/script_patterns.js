'use strict';
// 従来のパターンシークエンスのスクリプト

let all;
let clickFlag;
let hueSet;

const IDLE = 0; // initialize前の状態
const IN_PROGRESS = 1; // flow実行中の状態
const COMPLETED = 2; // flowが完了した状態

function setup(){
  createCanvas(640, 480);
  colorMode(HSB, 100); // hueだけでいろいろ指定出来て便利なので。
  hueSet = [0, 10, 17, 35, 52, 64, 80];
  let initialFlow = initialize(); // 初期化でもろもろ準備して最後に最初のFlowを返す
  all = new entity(initialFlow); // それをセットしてentityを準備
  clickFlag = false; // クリックされるとtrueになり、情報を処理した後でfalseに戻る
  all.activate(); // activate. これですべてが動き出すといいのだけどね。
}

function draw(){
  all.update();
  all.display();
}

// 押されたときは何も起こらない。押して離されたときに起きる。
function mouseClicked(){
  clickFlag = true;
}

// 簡単なカウンター
class counter{
  constructor(){
    this.cnt = 0;
    this.limit = -1; // limit復活(-1かあるいは正の数を取る)
  }
  getCnt(){ return this.cnt; }
  getProgress(){ // 進捗
    if(this.limit < 0){ return this.cnt; }
    if(this.cnt >= this.limit){ return 1; }
    return this.cnt / this.limit;
  }
  reset(limit){
    this.cnt = 0;
    this.limit = limit;
  }
  step(diff = 1){ // diffは正の値が前提
    this.cnt += diff;
  }
}

class flow{
  constructor(){
    this.index = flow.index++;
    this.convertList = [];
  }
  addFlow(_flow){ this.convertList.push(_flow); }
  initialize(_actor){} // flowの内容に応じて様々な初期化を行います
  execute(_actor){} // デフォルトは何もしない。つまりCOMPLETEDにすらしない。
  convert(_actor){
    let n = this.convertList.length;
    if(n === 0){ _actor.setFlow(undefined); _actor.inActivate(); } // non-Activeにすることでエラーを防ぎます。
    else{ _actor.setFlow(this.convertList[randomInt(n)]); }
  }
  display(gr){} // 今気付いたけど本来actorもどこかしらの背景grに貼り付けて使うんじゃ・・
}

// fromからtoへspanフレーム数で移動するflow.
class constantFlow extends flow{
  constructor(from, to, span){
    super();
    this.from = createVector(from.x, from.y);
    this.to = createVector(to.x, to.y);
    this.span = span;
  }
  initialize(_actor){
    _actor.timer.reset(this.span);
  }
  execute(_actor){
    _actor.timer.step();
    let prg = _actor.timer.getProgress();
    _actor.pos.x = map(prg, 0, 1, this.from.x, this.to.x);
    _actor.pos.y = map(prg, 0, 1, this.from.y, this.to.y);
    if(prg === 1){ _actor.setState(COMPLETED); }
  }
  // grは基本的にbgLayerに描くけどactorに装備されてobjLayerに描くこともあるという。
  display(gr){
    gr.push();
    gr.strokeWeight(1.0);
    gr.line(this.from.x, this.from.y, this.to.x, this.to.y);
    gr.translate(this.to.x, this.to.y); // 矢印の先っちょへ
    let v = createVector(this.to.x - this.from.x, this.to.y - this.from.y);
    gr.rotate(v.heading()); // vがx軸正方向になる
    gr.line(0, 0, -10, 5);
    gr.line(0, 0, -10, -5);
    gr.pop();
  }
}

// 以前のように、多彩なフロー、もしくはハブを追加していくことができる。

// actorはflowをこなすだけの存在
class actor{
  constructor(f = undefined){
    this.index = actor.index++; // 通し番号
    this.currentFlow = f; // 実行中のフロー
    this.timer = new counter(); // カウンター
    this.isActive = false; // updateを実行するか否かを意味する変数
    this.state = IDLE; // 状態変数
  }
  activate(){ this.isActive = true; } // IDLEかつnon-Activeの状態でこれをやると直ちにflowを開始する
  inActivate(){ this.isActive = false; } // 仕組みになっていてシンプルかつ強力なシステムを構築する
  setState(newState){ this.state = newState; } // stateをチェンジする
  setFlow(newFlow){ this.currentFlow = newFlow; } // flowをセットする
  update(){
    if(!this.isActive){ return; } // これが強力。
    if(this.state === IDLE){
      this.idleAction();
    }else if(this.state === IN_PROGRESS){
      this.in_progressAction();
    }else if(this.state === COMPLETED){
      this.completedAction();
    } // これが基本。ここをいろいろカスタマイズする。
  }
  idleAction(){ this.currentFlow.initialize(this); this.setState(IN_PROGRESS); }
  in_progressAction(){ this.currentFlow.execute(this); } // いつCOMPLETEDするかはflowが決める（当然）
  completedAction(){ this.currentFlow.convert(this); this.setState(IDLE); } // convertで次のflowが与えられる
  display(gr){} // actorはそれ専用のsheetに貼り付けるのでgraphicを引数に取ります、多分。
}

// 以下がビジュアルの部分. とりあえずシンプルにいきましょう。
class movingActor extends actor{
  constructor(f = undefined, colorId){
    super(f);
    this.pos = createVector();
    let myColor = color(hueSet[colorId], 100, 100);
    this.visual = new figure(myColor);
  }
  setPos(x, y){
    this.pos.set(x, y);
  }
  getPos(){
    return this.pos;
  }
  display(gr){
    this.visual.display(gr, this.pos); // 自分の位置に表示
  }
}

class figure{
  constructor(myColor){
    this.myColor = myColor;
    this.graphic = createGraphics(40, 40);
    figure.setGraphic(this.graphic, myColor);
    this.rotation = 0; // 動きがないとね。
  }
  static setGraphic(img, myColor){
    // 形のバリエーションは個別のプログラムでやってね
    img.clear();
    img.noStroke();
    img.fill(myColor);
    // 正方形
    img.rect(10, 10, 20, 20);
    img.fill(255);
    img.rect(16, 16, 2, 5);
    img.rect(24, 16, 2, 5);
  }
  display(gr, pos){
    gr.push();
    gr.translate(pos.x, pos.y);
    this.rotation += 0.1; // これも本来はfigureのupdateに書かないと・・基本的にupdate→drawの原則は破っちゃいけない
    gr.rotate(this.rotation);
    gr.image(this.graphic, -20, -20); // 20x20に合わせる
    gr.pop();
  }
}

actor.index = 0;
flow.index = 0;

class entity extends actor{
  constructor(f = undefined){
    super(f);
    this.actors = [];
    this.bgLayer = createGraphics(640, 480);
    this.objLayer = createGraphics(640, 480);
    this.bgLayer.colorMode(HSB, 100);  // デフォルトはRGBモードなので注意する。
    this.objLayer.colorMode(HSB, 100);
  }
  in_progressAction(){
    this.actors.forEach(function(a){ a.update(); }) // 構成メンバーのupdate
    this.currentFlow.execute(this);
  }
  reset(){
    actor.index = 0;  // カウントリセット
    flow.index = 0;
    this.actors = [];
    this.bgLayer.clear();
    this.objLayer.clear();
  }
  display(){
    image(this.bgLayer, 0, 0); // bgLayerの内容は各々のパターン（タイトルやセレクト）のexecuteに書いてある
    image(this.objLayer, 0, 0);
  }
}

// -------------------------------------------------------------------------------------------------- //
function initialize(){
  let p0 = new pattern(0);
  let p1 = new pattern(1);
  p0.convertList.push(p1); // p0 → p1.
  p1.convertList.push(p0); // p1 → p0.
  return p0; // そうそう。これをentityにセットする。
}

class pattern extends flow{
  constructor(patternIndex){
    super();
    this.patternIndex = patternIndex; // indexに応じてパターンを生成
  }
  initialize(_entity){
    pattern.createPattern(this.patternIndex, _entity);
  }
  execute(_entity){
    _entity.objLayer.clear(); // objLayerは毎フレームリセットしてactorを貼り付ける(displayableでなければスルーされる)
    _entity.actors.forEach(function(a){ a.display(_entity.objLayer); })
    if(clickFlag){ _entity.setState(COMPLETED); clickFlag = false; } // クリックしたらパターンチェンジ、の表現
  }
  convert(_entity){
    _entity.currentFlow = this.convertList[0]; // 普通のコンバート
    _entity.reset(); // 移るときはリセット
  }
  static createPattern(index, _entity){
    if(index === 0){
      // パターンを記述（横3, 縦2の一般的な格子）
      _entity.bgLayer.background(0, 30, 100);
      let posX = multiSeq(arSeq(100, 100, 4), 3);
      let posY = jointSeq([constSeq(100, 4), constSeq(200, 4), constSeq(300, 4)]);
      let vecs = getVector(posX, posY);
      let flowSet = pattern.getConstantFlows(vecs, [0, 1, 2, 4, 1, 2, 3, 5, 6, 7, 8, 9, 10, 7, 9, 10, 11], [1, 2, 3, 0, 5, 6, 7, 4, 5, 6, 4, 5, 6, 11, 8, 9, 10], constSeq(40, 17));
      pattern.connectFlows(flowSet, [4, 8, 11, 5, 9, 12, 7, 3, 14, 10, 0, 15, 1, 16, 2, 6, 13], [[7], [7], [7], [8], [8], [8], [3], [0], [10], [3], [1, 4], [11, 14], [2, 5], [12, 15], [6], [9, 13], [16]]);
      pattern.displayFlows(_entity.bgLayer, flowSet);
      let actorSet = pattern.getActors(flowSet, [0, 7, 14], [0, 1, 2]);
      _entity.actors = actorSet;
      pattern.activateAll(actorSet);
    }else if(index === 1){
      // パターンを記述
      _entity.bgLayer.background(40, 30, 100);
      let posX = multiSeq(arSeq(100, 100, 4), 3);
      let posY = jointSeq([constSeq(200, 4), constSeq(300, 4), constSeq(400, 4)]);
      let vecs = getVector(posX, posY);
      let flowSet = pattern.getConstantFlows(vecs, [0, 1, 2, 4, 1, 2, 3, 5, 6, 7, 8, 9, 10, 7, 9, 10, 11], [1, 2, 3, 0, 5, 6, 7, 4, 5, 6, 4, 5, 6, 11, 8, 9, 10], constSeq(70, 17));
      pattern.connectFlows(flowSet, [4, 8, 11, 5, 9, 12, 7, 3, 14, 10, 0, 15, 1, 16, 2, 6, 13], [[7], [7], [7], [8], [8], [8], [3], [0], [10], [3], [1, 4], [11, 14], [2, 5], [12, 15], [6], [9, 13], [16]]);
      pattern.displayFlows(_entity.bgLayer, flowSet);
      let actorSet = pattern.getActors(flowSet, [0, 7, 14], [0, 1, 2]);
      _entity.actors = actorSet;
      pattern.activateAll(actorSet);
    }
  }
  static getConstantFlows(vecs, fromIds, toIds, spans){
    // constantFlowをまとめてゲットだぜ
    let flowSet = [];
    for(let i = 0; i < fromIds.length; i++){
      let _flow = new constantFlow(vecs[fromIds[i]], vecs[toIds[i]], spans[i]);
      flowSet.push(_flow);
    }
    return flowSet;
  }
  // flowの登録関数は今までと同じようにいくらでも増やすことができる。
  // 今までと違ってグローバルの関数としてではなく、patternClassのstaticメソッドとしてだけど。
  static connectFlows(flowSet, idSet, destinationSet){
    // idSetの各idのflowにdestinationSetの各flowIdSetに対応するflowが登録される（はずだぜ）
    for(let i = 0; i < idSet.length; i++){
      destinationSet[i].forEach(function(id){ flowSet[idSet[i]].convertList.push(flowSet[id]); })
    }
  }
  static displayFlows(gr, flowSet){
    // graphicにflowをまとめて描画だぜ
    flowSet.forEach(function(_flow){ _flow.display(gr); })
  }
  static getActors(flows, flowIds, colorIds){
    // まとめてactorゲットだぜ（スピードが必要なら用意する）（あ、あとfigureIdほしいです）（ぜいたく～～）
    let actorSet = [];
    for(let i = 0; i < flowIds.length; i++){
      let _actor = new movingActor(flows[flowIds[i]], colorIds[i]);
      actorSet.push(_actor);
    }
    return actorSet;
  }
  static setActorPoses(vecs, vecIds, actorSet){
    for(let i = 0; i < vecs.length; i++){ actorSet[i].setPos(vecs[vecIds[i]]); }
  }
  static activateAll(actorSet){
    actorSet.forEach(function(_actor){ _actor.activate(); })
  }
}

// -------------------------------------------------------------------------------------------------- //
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

function rotationSeq(x, y, angle, n, centerX = 0, centerY = 0){
  // (x, y)をangleだけ0回～n-1回回転させたもののセットを返す(中心はオプション、デフォルトは0, 0)
  let array = [];
  let vec = createVector(x, y);
  array.push(createVector(x + centerX, y + centerY));
  for(let k = 1; k < n; k++){
    vec.set(vec.x * cos(angle) - vec.y * sin(angle), vec.x * sin(angle) + vec.y * cos(angle));
    array.push(createVector(vec.x + centerX, vec.y + centerY));
  }
  return array;
}

function multiRotationSeq(array, angle, n, centerX = 0, centerY = 0){
  // arrayの中身をすべて然るべくrotationしたものの配列を返す
  let finalArray = [];
  array.forEach(function(vec){
    let rotArray = rotationSeq(vec.x, vec.y, angle, n, centerX, centerY);
    finalArray = finalArray.concat(rotArray);
  })
  return finalArray;
}

function commandShuffle(array, sortArray){
  // arrayを好きな順番にして返す。たとえばsortArrayが[0, 3, 2, 1]なら[array[0], array[3], array[2], array[1]].
  let newArray = [];
  for(let i = 0; i < array.length; i++){
    newArray.push(array[sortArray[i]]);
  }
  return newArray; // もちろんだけどarrayとsortArrayの長さは同じでsortArrayは0~len-1のソートでないとエラーになる
}

function reverseShuffle(array){
  // 通常のリバース。
  let newArray = [];
  for(let i = 0; i < array.length; i++){ newArray.push(array[array.length - i - 1]); }
  return newArray;
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

// -------------------------------------------------------------------------------------------------- //
