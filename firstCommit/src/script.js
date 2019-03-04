'use strict';
// spiralFlowだけの世界を作ってみて。テスト。
// 今現在どこまで複雑な事をやってるのか知りたい
// ビジュアルだけ
let all;
let clickFlag;
let hueSet;

const IDLE = 0; // initialize前の状態
const IN_PROGRESS = 1; // flow実行中の状態
const COMPLETED = 2; // flowが完了した状態

// ここで何かしらのflowを用意する必要があるみたいです
// というかflowのセットですね。つまり外部的なactorとしてentityが唯一存在していて、
// flowが一通り、用意されて、それは外部のメソッドとして作るんですが、
// そしてその間のキー操作によるconvert条件が一通り、例えば今までのように、次々とクリックにより次のイメージを
// 出現させるなど。あれはswitchPatternとしてentityのメソッドとして表現していたんですが、
// これをflowのconvertとして表現するわけですね。そして新しくパターンを追加する際には、
// それに対応したflowを作るわけですね。パターン0, パターン1, パターン2, etc...
// これなら新しいパターンを追加しやすいし、つなぐのも簡単（0→1→2→0を0→1→2→3→0にするなど）。
// それに以前と違っていきなり全部ロードされることも無いし。
// 何より、setupでentityにセットされるパターンを差し替えることで、
// 新しいパターンを簡単に試すことができる。ね。つなぎ方を変えれば・・
// まあでも一応flowはすべて・・あ、そうか、作る必要は必ずしもないのか。たとえば、0, 1, 2, 3として・・
// 多分順番に let pattern0 = ..., let pattern1 = ... んー、これ全部クラス？か。成程・・うん。
// let p0 = new pattern0(); let p1 = new pattern1(); let p2 = pattern2(); ...
// p0 → p1 → p2 → p0 (connection)
// all = new entity(p0); こういうこと？で、all.activate(); そしてすべてが、動き出す（なんの映画だ）

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

// MassGameうまくいきすぎて結局本質が分かりにくくなってしまった感ある
// もうちょっとシンプルな例でやるか

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
class spiralFlow extends flow{
  constructor(){
    super();
  }
  execute(){}
}

// actorはflowをこなすだけの存在
class actor{
  constructor(f){
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
class movingActor extends actor{
  constructor(f){ super(f); }
}

class figure{
  constructor(){}
}

// 描画の層を管理、とりあえず背景とオブジェクトの2枚。これを切り取ってcanvasに描画して使う（はず）（？）
class layerMaster extends actor{
  constructor(f){
    super(f);
    this.bgLayer = createGraphics(640, 480); // 必要に応じてサイズ変更とかありそうですね
    this.objLayer = createGraphics(640, 480); // オブジェクトのシートは毎フレームクリアされてオブジェクトが
    // 描画される、毎フレームやることはまずbackground敷いてその上にオブジェクト。うん。たぶんね。
    // 今は面倒だからbgLayerは単色でいいや・・あ、単色に黒でstraightFlowとか描くかもだけど。
    // そこらへんはflowMasterがどれをどっちに描くとか、actorMasterが決める、actorは基本objLayerにしか描かないよと。
  }
}

// actorを管理する。場面ごとに必要なactorを用意してflowにしたがって適宜指示を出す感じかも。
class actorMaster extends actor{
  constructor(f){
    super(f);
    this.actors = [];
  }
}

// flowを管理する。場面ごとに必要なflowを用意してflowに従って接続ないしは管理を行うのかどうかわからない誰か教えて（
class flowMaster extends actor{
  constructor(f){
    super(f);
    this.flows = [];
  }
}

// 今まではactorsとflowsはentityが管理してたけどよく考えたらプログラムの実行中にやってることがほぼないなと。
// だったらactorとflowの管理は↑こういうのに任せてentityはこいつらをupdateないしdisplayするだけでいいかなとか。
// あ、displayはlayorの仕事・・ですね。

actor.index = 0;
flow.index = 0;

// 今までのentityは監督が全部何から何までやってる感じだったけどそれを変えようかなと。

// method確認中・・
// getFlow, getActor要らないよな・・何であるんだこれは・・
// resetは場面の転換で表現したいところ。
// activateAll() をやるのはコマンダーだろうなぁ普通に考えて。updateもdisplayもコマンダーがやる、のがいい？
// registActor, registFlowってあるけどこれも設計図に従ってcommanderとtransporterがやればいいのか？
// actorに最初のflowを与えるための指示とかどうするんだろ
// connectはこれもtransporterが必要なflowすべて持ってるから設計図に従って接続するんですかね・・
// createFlowの汎用関数はもうちょっと使いやすくしたいですねー
// あ、終わりですね。

// entityもactor扱いするとすべてがすっきりするそうです（まじか）

class entity extends actor{
  constructor(f){
    super(f);
    this.commander = new actorMaster(); // 指揮する人
    this.converter = new flowMaster(); // 流す人
    this.carpenter = new layerMaster(); // 舞台を作る人
  }
  initialize(){
    // 初めにやることってなんだ・・・・・
  }
  update(){
    this.commander.update();
    this.converter.update(); // こうじゃないの？
  };
  display(){
    this.carpenter.display(); // で、こう。
  };
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

// -------------------------------------------------------------------------------------------------- //
function initialize(){
  let p0 = new pattern0();
  let p1 = new pattern1();
  p0.convertList.push(p1); // p0 → p1.
  p1.convertList.push(p0); // p1 → p0.
  return p0;
}

// もしくは、p1, p2, p3. ... , pnとあって、p0からクリック位置によって各々のパターンに跳べるようにするとか。
// で、またp0に戻ってきて、みたいな。そういうのも、いいね。

class pattern0 extends flow{
  constructor(){
    super();
  }
  initialize(_actor){}
  execute(_actor){
    // クリックされたらCOMPLETEDにしてね
    if(clickFlag){ _actor.setState(COMPLETED); clickFlag = false; }
  }
  convert(_actor){} // 次のパターンにしてね
}

class pattern1 extends flow(){
  constructor(){
    super();
  }
  initialize(_actor){}
  execute(_actor){
    // クリックされたらCOMPLETEDにしてね
    if(clickFlag){ _actor.setState(COMPLETED); clickFlag = false; }
  }
  convert(_actor){} // 次のパターンにしてね
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
