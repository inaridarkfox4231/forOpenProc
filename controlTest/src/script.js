// flowベースでの書き換えをする実験～～

// sizeFactorは廃止。sortingMachineは段ボール箱のやつで、、箱で。
// 明日はcompletionをflowのメソッドに追加していくつかのflowの内容を整理するのと、
// あとあれ、ボールを運ぶゲーム、実装の入口に立ちたいのと、
// それとcircularFlowをinfo使ってサクッと書いてしまう。

'use strict';
let all; // 全体
let backgroundColor;
let palette; // カラーパレット

const PATTERN_NUM = 1;
const COLOR_NUM = 7;

const DIRECT = 0; // orientedFlowの位置指定、直接指定。
const DIFF = 1 // 差分指定。

const IDLE = 0;
const IN_PROGRESS = 1;
const COMPLETED = 2;

function setup(){
  createCanvas(600, 600);
  // palette HSBでやってみたい
  colorMode(HSB, 100);
  backgroundColor = color(63, 20, 100);
  palette = [color(0, 100, 100), color(10, 100, 100), color(17, 100, 100), color(35, 100, 100), color(52, 100, 100), color(64, 100, 100), color(80, 100, 100)];
  all = new entity();
  all.initialize();
  //console.log(palette);
}

function draw(){
  background(backgroundColor);
  all.update(); // updateする
  all.initialGimicAction();  // 初期化前ギミックチェック
  all.completeGimicAction(); // 完了時ギミックチェック
  all.draw();
  push();
  fill('red');
  rect(0, 0, 40, 40);
  fill('blue')
  rect(0, 40, 40, 40);
  fill(0);
  text('stop', 10, 20);
  text('start', 10, 60);
  pop();
}
// updateしてからGimicをチェックすると、例えばこういうことが起きる。
// まず、completeGimicでinActivateするやつを作ると、それを踏んだactorの動きが止まる。
// インターバルの後、それを解放する何かしらのGimicが発動したとすると、その優先度が最後（後ろの方に配置する）なら、
// そのあとすぐupdateに行くから解放される。これが逆だと、解放した直後に再びGimicが発動して
// 動きが止まってしまうので、配置順がすごく大事。

// バリエーションチェンジ
function mouseClicked(){
  if(mouseX < 40 && mouseY < 80){
    if(mouseY < 40){ noLoop(); }
    else{ loop(); }
    return;
  }
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
    if(keyIsDown(DOWN_ARROW)){
      this.cnt += diff; // ただ、これだと前に進むことしかできないのでそこが課題ですね・・・
    }
    return false; // 統一性
  }
} // limitは廃止（使う側が何とかしろ）（てかもうクラスにする意味ないやんな）

class loopCounter extends counter{ // ぐるぐるまわる
  constructor(period){ // periodは正にしてね
    super();
    this.period = period;
  }
  step(diff = 1){
    this.cnt += diff;
    if(this.cnt > this.period){ this.cnt -= this.period; return true; }
    return false; // 周回時にtrueを返す（何か処理したいときにどうぞ）
  }
}
class reverseCounter extends counter{ // いったりきたり
  constructor(interval){
    super();
    this.interval = interval;
    this.signature = 1; // 符号
  }
  step(diff = 1){
    // diffは常に正オッケーです。
    this.cnt += diff * this.signature;
    if(this.cnt > this.interval){
      this.cnt = 2 * this.interval - this.cnt;
      this.signature *= -1;
      return true;
    }else if(this.cnt < 0){
      this.cnt = -this.cnt;
      this.signature *= -1;
      return true;
    }
    return false; // 折り返すときにtrueを返す
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
    if(this.nextFlowIndex < 0){ // -1はランダムフラグ
      _actor.setFlow(this.convertList[randomInt(this.convertList.length)]);
    }else{
      _actor.setFlow(this.convertList[this.nextFlowIndex]);
    } // 次のflowが与えられるならそのままisActive継続、次の処理へ。
    // わざとこのあとinActivateにして特定の条件下でactivateさせても面白そう。
  }
  display(gr){} // 一応書いておかないと不都合が生じそうだ
}

// generateHubは特定のフローに・・あーどうしよかな。んー。。
// こういうの、なんか別の概念が必要な気がする。convertしないからさ。違うでしょって話。

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
    _actor.setPos(this.from.x, this.from.y); // 初期位置与える、基本これでactorの位置いじってる、今は。
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

class straightFlow extends orbitalFlow{
  constructor(from, to, factor){
    super(from, to);
    this.span = p5.Vector.dist(from, to);
    this.factor = factor; // 2なら2倍速とかそういう。
  }
  execute(_actor){
    // 直線
    let progress = this.getProgress(_actor, _actor.speed * this.factor); // 速くなったり遅くなったり
    _actor.setPos(map(progress, 0, 1, this.from.x, this.to.x), map(progress, 0, 1, this.from.y, this.to.y));
  }
  display(gr){
    // 線を引くだけです（ビジュアル要らないならなんかオプション付けてね・・あるいは、んー）
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

// ejectiveFlowにしよ

flow.index = 0; // convertに使うflowの連番

// 純粋なactorはflowをこなすだけ、言われたことをやるだけの存在
class actor{
  constructor(f = undefined){
    // colorIdはそのうち廃止してビジュアルをセッティングするなんかつくる
    this.index = actor.index++;
    this.currentFlow = f; // 名称をcurrentFlowに変更
    this.timer = new counter();
    this.isActive = false; // デフォルトをfalseにしてプログラムのインプット時にtrueにする作戦で行く
    this.state = IDLE; // 状態（IDLE, IN_PROGRESS, COMPLETED）
    this.info = {}; // 辞書。メモ帳的な。
    //（flow開始時に登録して終了時に削除、どんな情報が必要かはflowに書いてある。）
    // たとえていうなら出張に持っていくメモ帳のようなものね。業務が終わったら不要になるのです。
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
    // initialGimicが入るのはここ
    if(this.state === IDLE){
      this.idleAction();
    }
    if(this.state === IN_PROGRESS){
      this.in_progressAction();
    }else if(this.state === COMPLETED){
      this.completeAction();
    }
    // completeGimicが入るのはここ。
    // IN_PROGRESSのあとすぐにCOMPLETEDにしないことでGimicをはさむ余地を与える.
  }
  idleAction(){
    this.currentFlow.initialize(this); // flowに初期化してもらう
    this.setState(IN_PROGRESS);
  }
  in_progressAction(){
    this.currentFlow.execute(this); // 実行！この中で適切なタイミングでsetState(COMPLETED)してもらうの
  }
  completeAction(){
    //this.setState(IDLE);
    // ここにthis.currentFlow.completion(this)って書きたいね
    this.currentFlow.convert(this); // ここで行先が定められないと[IDLEかつundefined]いわゆるニートになります（おい）
    this.setState(IDLE);
  }
  kill(){
    // 自分を排除する
    let selfId;
    for(selfId = 0; selfId < all.actors.length; selfId++){
      if(all.actors[selfId].index === this.index){ break; }
    }
    all.actors.splice(selfId, 1);
  }
  display(){};
}

// 色や形を与えられたactor. ビジュアル的に分かりやすいので今はこれしか使ってない。
// myColorは廃止。visualがすべてを担う、まあ当然よね。
class movingActor extends actor{
  constructor(f = undefined, speed = 1, colorId = 0){
    super(f);
    this.pos = createVector(-100, -100); // flowが始まれば勝手に・・って感じ。
    let colorOfActor = color(hue(palette[colorId]), saturation(palette[colorId]), 100); // 自分の色。
    this.visual = new rollingFigure(colorOfActor); // 回転する図形
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
    this.visible = true;
  }
  setPos(x, y){ // そのうちゲーム作ってみるとかなったら全部これ経由しないとね。
    this.pos.x = x;
    this.pos.y = y; // 今更だけどposをセットする関数（ほんとに今更）
  }
  getPos(){
    return this.pos; // ゲッター
  }
  setSpeed(newSpeed){
    this.speed = newSpeed;
  }
  // 今ここにsetVisualを作りたい。色id, サイズとか形とか。
  setVisual(newColorId){
    this.visual.reset(newColorId);
  }
  show(){ this.visible = true; }   // 姿を現す
  hide(){ this.visible = false; }  // 消える
  display(){
    if(!this.visible){ return; }
    this.visual.display(this.pos);
  }
}

// 便宜上、位置情報オンリーのactor作りますか。
class controller extends actor{
  constructor(f = undefined, x = 0, y = 0, speed = 1){
    super(f);
    this.pos = createVector(x, y);
    this.speed = speed;
  }
  setPos(x, y){ // そのうちゲーム作ってみるとかなったら全部これ経由しないとね。
    this.pos.x = x;
    this.pos.y = y; // 今更だけどposをセットする関数（ほんとに今更）
  }
  getPos(){
    return this.pos; // ゲッター
  }
  setSpeed(newSpeed){
    this.speed = newSpeed;
  }
}

// 条件1: myColorという名前のcolorオブジェクトを持ってる。
// 条件2: changeColor(x, y, z, w)という色変更の関数を持ってる。
// 背景が単色ならクラスの構成工夫すればこれで・・
class colorController extends controller{
  // カラーオブジェクトを有する。色変更。まとめて変えることも。
  constructor(f = undefined, x = 0, y = 0, speed = 1){
    super(f, x, y, speed);
    this.targetArray = []; // myColorという名前のcolorオブジェクトを持ってることが条件。
    // targetはchangeColor(x, y, z, w)という名前の関数を持ってる必要がある。これを呼び出すことになる。
    // モードの概念を加えれば、2つまでいじれる、かな・・・
  }
  in_progressAction(){
    let thirdValue = brightness(this.targetArray[0].myColor);
    let fourceValue = alpha(this.targetArray[0].myColor);
    this.currentFlow.execute(this); // 実行！この中で適切なタイミングでsetState(COMPLETED)してもらうの
    this.targetArray.forEach(function(target){ target.changeColor(this.pos.x, this.pos.y, thirdValue, fourceValue); }, this)
  }
  addTarget(targetColor){
    this.targetArray.push(targetColor);
  }
  addMultiTarget(targetColorArray){
    targetColorArray.forEach(function(t){ this.addTarget(t); }, this);
  }
  // removeとかはまた今度
}

class backgroundColorController extends controller{
  // 背景色を変える
  constructor(f = undefined, x = 0, y = 0, speed = 1){
    super(f, x, y, speed);
  }
  in_progressAction(){
    let thirdValue = brightness(backgroundColor);
    let fourceValue = alpha(backgroundColor);
    this.currentFlow.execute(this); // 実行！この中でsetState(COMPLETED)してもらう
    backgroundColor = color(this.pos.x, this.pos.y, thirdValue, fourceValue);
  }
}
// むぅぅ。posControllerも作りたい。足し算で挙動に変化を加えるとか。

// たとえば背景をクラス扱いしてそれを形成する色の部分に変化を加えて・・とかできる。


// 1つだけflowをこなしたら消える
class combat extends actor{
  constructor(f = undefined){
    super(f);
    // 1ずつ増えるしvisual要らないしって感じ。
  }
  completeAction(){ this.kill(); } // ひとつflowを終えたら消滅
}

actor.index = 0; // 0, 1, 2, 3, ....

// figureクラスは図形の管理を行う
// やることは図形を表示させること、回転はオプションかな・・
// たとえばアイテムとか、オブジェクト的な奴とか。回転しないことも考慮しないとなぁ。
class figure{
  constructor(myColor){
    this.myColor = myColor; // 色クラス使いまーす
    // サイズと形廃止
    this.graphic = createGraphics(40, 40);
    figure.setGraphic(this.graphic, this.myColor);
  }
  reset(newColor){
    figure.setGraphic(this.graphic, newColor);
  }
  changeColor(x, y, z, w){ // 色が変わるといいね（え？）
    this.myColor = color(x, y, z, w);
    figure.setGraphic(this.graphic, this.myColor); // update.
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
    // 汎用コードなのにサイズとか考えるべきではなかったのだ。以上。（え・・）
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    image(this.graphic, -20, -20); // 20x20に合わせる
    pop();
  }
}

// というわけでrollingFigure. // id指定になってたので修正。
class rollingFigure extends figure{
  constructor(myColor){
    super(myColor);
    //this.rotation = random(2 * PI);
    this.rotation = 0; // 0にしよー
  }
  // updateはflowを定めてたとえば小さくなって消えるとか出来るようになるんだけどね（まだ）
  // もしupdateするならactorのupdateに書くことになりそうだけど。
  display(pos){
    push();
    translate(pos.x, pos.y);
    this.rotation += 0.1; // これも本来はfigureのupdateに書かないと・・基本的にupdate→drawの原則は破っちゃいけない
    rotate(this.rotation);
    image(this.graphic, -20, -20); // 20x20に合わせる
    pop();
  }
}

class entity{
  constructor(){
    this.base = createGraphics(width, height);
    this.additive = createGraphics(width, height); // addFlowsで作るやつー
    this.flows = [];
    this.baseFlows = []; // baseのflowの配列
    this.addFlows = [];  // 動かすflowからなる配列    // これをupdateすることでflowを動かしたいんだけど
    this.actors = [];
    this.initialGimic = [];  // flow開始時のギミック
    this.completeGimic = []; // flow終了時のギミック
    this.patternIndex = 0; // うまくいくのかな・・
    this.patternArray = [createPattern13] // いちいち全部クリエイトするのあほらしいからこれ用意したよ。
    //this.patternArray = [createPattern0, createPattern1, createPattern2, createPattern3, createPattern4, createPattern5, createPattern6, createPattern7, createPattern8, createPattern9, createPattern10, createPattern11, createPattern12, createPattern13];
  }
  getFlow(givenIndex){
    for(let i = 0; i < this.flows.length; i++){
      if(this.flows[i].index === givenIndex){ return this.flows[i]; break; }
    }
    return undefined; // forEachだとreturnで終わってくれないことを知った
  }
  getActor(givenIndex){
    for(let i = 0; i < this.actors.length; i++){
      if(this.actors[i].index === givenIndex){ return this.actors[i]; break; }
    }
    return undefined;
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
    this.initialGimic = [];
    this.completeGimic = [];
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
  registActor(flowIds, speeds, colorIds){
    // flowはメソッドでidから取得。
    for(let i = 0; i < flowIds.length; i++){
      let f = this.getFlow(flowIds[i]);
      let newActor = new movingActor(f, speeds[i], colorIds[i]);
      this.actors.push(newActor);
    }
  }
  registFlow(paramSet, flag = true){
    // paramSetはパラメータの辞書(params)の配列。
    paramSet.forEach(function(params){
      let newFlow = entity.createFlow(params);
      this.flows.push(newFlow);
      if(flag){
        this.baseFlows.push(newFlow); //flagをoffにするとbaseFlowに入らないので描画されない。
      }
    }, this);
  }
  registAddFlow(paramSet, flag = true){
    // こちらはaddFlowに入れるためのあれ。
    paramSet.forEach(function(params){
      let newFlow = entity.createFlow(params);
      this.flows.push(newFlow);
      this.addFlows.push(newFlow);
    }, this);
  }
  connect(index, nextIndexList){
    // index番のflowの行先リストをnextIndexListによって作る
    nextIndexList.forEach(function(nextIndex){
      this.getFlow(index).convertList.push(this.getFlow(nextIndex));
    }, this)
  }
  connectMulti(indexList, nextIndexListArray){
    // IndexListに書かれたindexのflowにまとめて指定する
    // たとえば[6, 7, 8], [[2], [3], [4, 5]] ってやると6に2, 7に3, 8に4, 5が指定される
    for(let i = 0; i < indexList.length; i++){
      this.connect(indexList[i], nextIndexListArray[i]);
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
      return new fallFlow(params['speed'], params['distance'], params['height']);
    }else if(params['type'] === 'shooting'){
      return new shootingFlow(params['v'], params['id1'], params['id2']); // fromは廃止
    }else if(params['type'] === 'wait'){
      return new waitFlow(params['span']); // spanフレーム数だけアイドリング。combatに使うなど用途色々
    }else if(params['type'] === 'colorSort'){
      return new colorSortHub(params['targetColor']); // targetColorだけ設定
    }else if(params['type'] === 'orbitalEasing'){
      return new orbitalEasingFlow(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['from'], params['to']);
    }else if(params['type'] === 'orientedMuzzle'){
      return new orientedMuzzle(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['kind'], params['infoVectorArray'], params['mode']);
    }else if(params['type'] === 'vector'){
      return new vectorFlow(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['directionVector']);
    }
  }
  initialGimicAction(){
    if(this.initialGimic.length === 0){ return; }
    this.initialGimic.forEach(function(g){
      this.actors.forEach(function(a){
        if(a.currentFlow === undefined){ return; }
        if(g.initialCheck(a, a.currentFlow.index)){ g.action(a); }
      })
    }, this)
  }
  completeGimicAction(){
    if(this.completeGimic.length === 0){ return; }
    this.completeGimic.forEach(function(g){
      this.actors.forEach(function(a){ // forEachの場合のcontinueは「return」だそうです（関数処理だから）
        if(a.currentFlow === undefined){ return; }
        if(g.completeCheck(a, a.currentFlow.index)){ g.action(a); }
      })
    }, this)
  }
  update(){
    // flowも？
    this.actors.forEach(function(_actor){
      _actor.update(); // flowもupdateしたいんだけどね
    }) // addFlowsを毎フレームupdateできないか考えてみる。なんなら新しくクラス作るとか。activeFlow（？？？）
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

// --------------------------------------------------------------------------------------- //

function createPattern13(){
  // 十字キー操作
  let vecs = getVector([100, 200, 200, 100], [100, 100, 200, 200]);
  let paramSet = getOrbitalFlow(vecs, [0, 1, 2, 3], [1, 2, 3, 0], 'straight');
  all.registFlow(paramSet);
  all.connectMulti([0, 1, 2, 3], [[1], [2], [3], [0]]);
  all.registActor([0], [1], [0]);
  all.activateAll();
}

// 速度を与えて毎フレームその分だけ移動するとか？その場合イージングはどうなる・・

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
