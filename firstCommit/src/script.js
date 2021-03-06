'use strict';
// spiralFlowだけの世界を作ってみて。テスト。
// 今現在どこまで複雑な事をやってるのか知りたい
// ビジュアルだけ

// フローを動かすにはどうするか？どうするか具体的に決めればいい。終わり。・・
// もっと具体的に言うと、たとえば行先が3つくらいあったとしてそれらが一定周期で移り変わる場合、
// そのフローをアクターに装備させてアクターの動きに応じて変化させればいいし
// ビジュアルについても毎フレームobjLayerに描画させるようにentityに装備させるflowに書いておけばいいわけ。
// そのflowにはどのflowを事前にbase, つまりbgLayerに描いておくかも書いておく。
// アニメとかで背景の岩と仕掛け岩を区別して描くイメージ。仕掛け岩は動くからobjLayerに描く。

// ていうか、actorの描画メソッドに登録flowの描画メソッドを呼び出すように書くだけでしょ。

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

  // 違う。
  // 本当にinitializeでやることは各種パターンのイニシャライズフローの生成とその間の連携(connect)。
  // 具体的にはどこからどこへ行けるかの指示。タイトルからセレクト、セレクトからプレイ、etc.
  // それをグローバルの関数でやりつつ、
  // 起点となるイニシャライズフローをentityにセットして
  // entityをactivateすることですべてが動き出すっていうシナリオですかね。
  // そんな感じだと思う。
  // あ、そうなってるのね・・失礼

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
    this.convertList = []; // 今回分かったように具体的なシーンにおいてはconvertConditionが明確に与えられます
    // 辞書で管理するべきかもだけど
    // indexはおそらくデフォルトでは不要・・行先をころころ変えるハブのようなものに付加的に付与されるものかと。
    // 他に、こないだのMassGameのような場合でも0番1番と具体的に指示されるならoverrideで済むので。
  }
  addFlow(_flow){ this.convertList.push(_flow); }
  initialize(_actor){} // flowの内容に応じて様々な初期化を行います
  execute(_actor){} // デフォルトは何もしない。つまりCOMPLETEDにすらしない。
  convert(_actor){
    // デフォルトはいわゆるランダムスローですね。どれかを適当に返す。
    // もちろんソリッドな状況では具体的に指示され・・それはoverrideで何とでも。
    let n = this.convertList.length;
    if(n === 0){ _actor.setFlow(undefined); _actor.inActivate(); } // non-Activeにすることでエラーを防ぎます。
    else{ _actor.setFlow(this.convertList[randomInt(n)]); }
    // _actorがundefined装備かつactiveだとエラーが発生する仕様はデバッグの為にあえてそうしています。
  }
  display(gr){} // 今気付いたけど本来actorもどこかしらの背景grに貼り付けて使うんじゃ・・
}

// つまり場面ごとに背景があってそこに貼り付けると。で、描画する際はそこから画面のサイズだけ切り取る、と。
// それによりスクロールを実現する？pygameでそうしたように。

// fromからtoへspanフレーム数で移動するflow.
// MassGameのやつはプログラム用にバリバリカスタマイズしてるけどこれはごくごく普通のconstantFlowになります。
// というか特殊化とは要するにそういうことです。これは汎用コードなので特殊化する必要がないだけで。
class constantFlow extends flow{
  constructor(from, to, span){
    super();
    this.from = createVector(from.x, from.y);
    this.to = createVector(to.x, to.y);
    this.span = span;
  }
  initialize(_actor){
    _actor.timer.reset(this.span);
    //console.log('constant %d', this.index);
  }
  execute(_actor){
    _actor.timer.step();
    let prg = _actor.timer.getProgress();
    //console.log("%d %d", _actor.pos.x, _actor.pos.y)
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
// entityがactorで他のactorはすべてこれが統括

// 今まではactorsとflowsはentityが管理してたけどよく考えたらプログラムの実行中にやってることがほぼないなと。
// だったらactorとflowの管理は↑こういうのに任せてentityはこいつらをupdateないしdisplayするだけでいいかなとか。
// あ、displayはlayorの仕事・・ですね。

actor.index = 0;
flow.index = 0;

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

// actorである以上updateはあれだし、ということはidleActionとかin_progressActionとかcompletedActionがあるわけで。
// たぶんcompletedActionで画面の移行をやるんだろうなと。リセットとかその辺。
class entity extends actor{
  constructor(f = undefined){
    super(f);
    this.actors = [];
    this.bgLayer = createGraphics(640, 480);
    this.objLayer = createGraphics(640, 480);
    this.bgLayer.colorMode(HSB, 100);  // デフォルトはRGBモードなので注意する。
    this.objLayer.colorMode(HSB, 100);
    // 今まで複数のレイヤーを駆使するとかなかったからつい・・・・

    // たとえば特別なactorを用意してそれを元にoffsetを計算し
    // displayメソッドをいじることでスクロールを可能にするとかそういうのもできそう
    // 画面内のactorだけ描画するとか他の工夫も要りそうだけど
    // さらにactor以外のクラスも必要になる場合もありそう
    // 宝箱とか？？階段ってハブだっけ。
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
  // よく考えたらdisplay関係もexecuteに書いた方がいいのかな・・だってどう描画するかが常に同じって事はないでしょうに。
  // それか・・んー。個別に指定したいけどね。
  // それともobjLayerへの貼り付けだけexecuteに書くとか。

  display(){
    //this.actors.forEach(function(a){ a.display(this.objLayer); }) // objLayerにactorの画像を貼り付ける→execute?
    image(this.bgLayer, 0, 0); // bgLayerの内容は各々のパターン（タイトルやセレクト）のexecuteに書いてある
    // movingVariousFigureでこれを使ってるはず（パターンに応じて背景色変えてるでしょ、あれ。）
    image(this.objLayer, 0, 0);
  }
}

// 考えたんだけどポーズとかも？かなぁ。ポーズは途中退場みたいな感じで、いろいろなactorを一旦non-Activeにする。
// で、画面に透明度のあるカバーをかぶせるとか・・それ床屋にいる間に考えたんだけど（（
// bgLayer → objLayer → coverLayerって感じで、基本coverLayerは何も書かなくって、
// pause..のときもあれ、背景とかは普通に出てるし。その場合はクリアしないでそのまま、みたいな。
// つまりpause命令が出ると更新されないレイヤーがそのまま貼り付けられてポーズが、ってのを延々と繰り返す感じ。
// 更新はいつやるのか？
// 更新はexecuteでやるからそれをパスする感じなんかな。。つまりそのstateのFlowに「pauseのときはexecuteしないでね」
// って書いてあるのかも。だってタイトル画面にポーズはないでしょ・・だから、ね。

// entityのところには基本的にすべてのステートで共通の処理しか書けないはず。個別の処理をフローに書く。

// -------------------------------------------------------------------------------------------------- //
function initialize(){
  let p0 = new pattern(0);
  let p1 = new pattern(1);
  p0.convertList.push(p1); // p0 → p1.
  p1.convertList.push(p0); // p1 → p0.
  return p0; // そうそう。これをentityにセットする。
}

// もしくは、p1, p2, p3. ... , pnとあって、p0からクリック位置によって各々のパターンに跳べるようにするとか。
// で、またp0に戻ってきて、みたいな。そういうのも、いいね。

// MassGameではこのpattern0に相当するところがpreparationでそれが終わったところで
// delayなりallなりのシークエンスへと移行していったわけなんですが、
// MovingVariousFigure的なあれはそれと全く違ってですね、
// クリックするたびに違うパターンが現れる「だけ」ですから、何もすることが無いんですね。
// ただ勝手にfigureがあっちいったりこっちいったりしているだけ。
// だからそれを反映したものになっている、つまりこの時点でもう既に具体的なんですよね。だからどうってことも
// ないですけど・・ずっとそういうの作ってきたわけですしおすし。

// 初めに一回だけやるのがinitialize
// そのflowの間やり続けるのがexecute
// flowのチェンジ時にやることは・・どうするかな・・これ分けた方がいいんじゃ・・
// リセットするかどうかもここに書く
// パターンをクラスにするのはあのプログラムでもそうなるでしょうね。
// パターン作成部分を「あれ」と同じようにstaticで書いて同じclassをとっかえひっかえする感じ、
// つまりクラス生成時の引数から対応したstaticのパターンを呼び出してはめることで使うみたいな？
// あっちの・・クリックでどのページにでも跳べるやつ、あれはハブ使った方がいい、でないとすべてのパターンに
// すべてのパターンへの接続を書く羽目になる。馬鹿みたい。ハブ挟んだ方が賢い。
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
