'use strict';
// spiralFlowだけの世界を作ってみて。テスト。
// 今現在どこまで複雑な事をやってるのか知りたい
// ビジュアルだけ
let all;
let hueSet;

const IDLE = 0; // initialize前の状態
const IN_PROGRESS = 1; // flow実行中の状態
const COMPLETED = 2; // flowが完了した状態

function setup(){
  createCanvas(640, 480);
  colorMode(HSB, 100); // hueだけでいろいろ指定出来て便利なので。
  hueSet = [0, 10, 17, 35, 52, 64, 80];
  all = new entity();
  all.initialize();
}

function draw(){
  all.update();
  all.display();
}

// MassGameうまくいきすぎて結局本質が分かりにくくなってしまった感ある
// もうちょっとシンプルな例でやるか

class entity{
  constructor(){

  }
  update(){};
  display(){};
}

// つまり、entityの・・
// base: これはflowがいろいろ書き込まれてる。矢印とか。これを事前に作って毎フレーム背景クリアのたびに・・

// initializeで二つの事をやってる。
// 1. createPattern.
// ひとつはパターン生成。必要なactorとflowを作りさらにその間の接続を行う。これもいろんなことごちゃごちゃと
// まとめてやっちゃってて分かりにくいから権限移譲しないとな・・って思って今書いてる感じ。
// 2. drawBase.
// もうひとつはbaseと今呼ばれている矢印とか色々書かれた奴を作る処理。まっさらなキャンバスに矢印を書き込んでますね。
// 矢印、自分なりの表現を見つけたい・・あれあんま好きじゃない。
// それはさておき、そうか、ここで作ってるのか・・それを毎フレーム、背景クリア、base描画、それとは別に
// canvasに直接オブジェクト描画、であのアニメーションを作っているとそういうわけだ。

// これをね。

// 役割分担すると。つまりオブジェクトって毎フレーム動くでしょ、だからそれ専用のグラフィックを別に作って、
// そっちを毎フレームクリアしてオブジェクト貼り付け、で、それを毎フレーム背景描画のあとで貼り付け、みたいな。イメージ。
// もしさらに何かしら、たとえば動く何か、みたいのあるんだったら・・ないか。基本、静的と動的、かな。
// そう。静的オブジェクトのレイヤーと動的オブジェクトのレイヤーを分けようってこと。
// もっとも背景の色が変わる場合は静的であっても変化はあるんだけどそこはそれ。
// だからどっちかというと静的動的よりかは描画順の方が大事なのかな、でもまあいいよ。
// だって背景後で描画したら全部消えちゃうでしょ。

// この場合、flow(といっても矢印系とか)のdisplayとactor(特に動く点とか)のdisplayに特別な違いはなさそう。
// ああそうか、背景は基本いじらないもんね。つまり毎フレーム基本同じものを使い続けるのがbackgroundで、
// 毎フレームクリアして違う位置に描画するのを繰り返すのがobjectの方って感じかな。
// さらにそれらもあらかじめ（今使ってるやつみたいに）グラフィックで描画内容を作っておいてそれを貼り付ける感じで。
// それについても（形の変化とか）必要に応じてクリアの後更新するって感じなのね。

// 簡単なカウンター
class counter{
  constructor(){
    this.cnt = 0;
    this.limit = -1; // limit復活(-1かあるいは正の数を取る)
  }
  getCnt(){ return this.cnt; }
  getProgress(){ // 進捗
    if(limit < 0){ return this.cnt; }
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
    this.convertList = []; // 今回分かったように具体的なシーンにおいてはconvertConditionが明確に与えられます
    // 辞書で管理するべきかもだけど
    // indexはおそらくデフォルトでは不要・・行先をころころ変えるハブのようなものに付加的に付与されるものかと。
    // 他に、こないだのMassGameのような場合でも0番1番と具体的に指示されるならoverrideで済むので。
  }
  initialize(_actor){} // flowの内容に応じて様々な初期化を行います
  execute(_actor){ _actor.setState(COMPLETED); } // デフォルトは普通にCOMPLETEDさせる
  // タイミングは本当に様々です。スタンダードなのはinitilaizeで_actorにtimerをセットさせてそれがきたら
  // というものですけど他にも_actorが一定の値よりy座標が大きくなったらとか画面外に消えたらとか色々。
  convert(_actor){
    // ランダムにオブジェクトがあっちいったりこっちいったりするいわゆるアクション系のアニメーションを描く場合、
    // ほぼすべてのflowがオブジェクトを動かすために使われるので、ここはランダムスローになりますね。
    let n = this.convertList.length;
    if(n === 0){ _actor.setFlow(undefined); _actor.inActivate(); } // non-Activeにすることでエラーを防ぎます。
    else{ _actor.setFlow(randomInt(n)); }
    // _actorがundefined装備かつactiveだとエラーが発生する仕様はデバッグの為にあえてそうしています。
  }
  display(gr){} // 今気付いたけど本来actorもどこかしらの背景grに貼り付けて使うんじゃ・・
}

// つまり場面ごとに背景があってそこに貼り付けると。で、描画する際はそこから画面のサイズだけ切り取る、と。
// それによりスクロールを実現する？pygameでそうしたように。

// 以下が特別な部分
class spiralFlow(){
  constructor(){}
  execute(){}
}

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
  display(){}
}

// 以下がビジュアルの部分
class movingActor{
  constructor(){}
}

class figure{
  constructor(){}
}

// 描画の層を管理、とりあえず背景とオブジェクトの2枚。これを切り取ってcanvasに描画して使う（はず）（？）
class layor extends actor{
  constructor(){
    this.backgroundSheet = createGraphics(640, 480); // 必要に応じてサイズ変更とかありそうですね
    this.objectSheet = createGraphics(640, 480); // オブジェクトのシートは毎フレームクリアされてオブジェクトが
    // 描画される、毎フレームやることはまずbackground敷いてその上にオブジェクト。うん。たぶんね。
  }
}

// actorを管理する。場面ごとに必要なactorを用意してflowにしたがって適宜指示を出す感じかも。
class actorMaster extends actor{
  constructor(){
    this.actors = [];
  }
}

// flowを管理する。場面ごとに必要なflowを用意してflowに従って接続ないしは管理を行うのかどうかわからない誰か教えて（
class flowMaster extends actor{
  constructor(){
    this.flows = [];
  }
}

// 今まではactorsとflowsはentityが管理してたけどよく考えたらプログラムの実行中にやってることがほぼないなと。
// だったらactorとflowの管理は↑こういうのに任せてentityはこいつらをupdateないしdisplayするだけでいいかなとか。
// あ、displayはlayorの仕事・・ですね。

actor.index = 0;
flow.index = 0;

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
