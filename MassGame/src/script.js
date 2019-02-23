// flowベースでの書き換えをする実験～～

'use strict';
let all; // 全体
let palette; // カラーパレット

let parallelFunc = [funcP0, funcP1];
let normalFunc = [funcN0, funcN1];

const PATTERN_NUM = 1;
const IDLE = 0;
const IN_PROGRESS = 1;
const COMPLETED = 2;

function setup(){
  createCanvas(600, 600);
  // palette HSBでやってみたい
  palette = [color(248, 155, 1), color(248, 230, 1), color(38, 248, 1), color(1, 248, 210), color(2, 9, 247), color(240, 2, 247), color(249, 0, 6)];
  all = new entity();
  all.initialize();
  //console.log(palette);
}

function draw(){
  background(220);
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
    this.cnt += diff; // カウンターはマイナスでもいいんだよ
    return false; // 統一性
  }
} // limitは廃止（使う側が何とかしろ）（てかもうクラスにする意味ないやんな）

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
    // わざとこのあとinActivateにして特定の条件下でactivateさせても面白そう。
  }
  display(gr){} // 一応書いておかないと不都合が生じそうだ
}

class waitFlow extends flow{
  // ただ単に一定数カウントを進めるだけ。いわゆるアイドリングってやつね。
  constructor(span){
    super();
    this.span = span; // どれくらい進めるか
  }
  initialize(_actor){ _actor.timer.reset(); }
  execute(_actor){
    _actor.timer.step(1);
    //console.log(_actor.timer.getCnt());
    if(_actor.timer.getCnt() >= this.span){ _actor.setState(COMPLETED); } // limitって書いちゃった
  }
  // これの派生で、たとえば_actor.setState(COMPLETED)の前くらいに、
  // 「キューの先頭のidをもつactorについてごにょごにょ」
  // とか書いて、デフォルトは何もしない、にすれば、たとえばそのidをもつactorをactivateするとか、
  // スピードが上がってるのを戻すとか、色々指示をとっかえひっかえしてできる。
  // で、使い方としてはそのキューにidぶちこんでcombat走らせるだけだから簡単。
  // spanで効果時間をいじれるし、combatのスピードを調節すれば効果時間をいじることも・・（未定）
}

// やっと本題に入れる。2時間もかかったよ。
// ratioが1より大きい時はずれ幅を直接長さで指定できるようにしたら面白そうね
// ずれ幅にもイージング（1付近うろうろ系）を適用しても面白そう（やめて）
class easingFlow extends flow{
  constructor(easeId_parallel, easeId_normal, ratio, spanTime){
    super();
    this.easeId_parallel = easeId_parallel;
    this.easeId_normal = easeId_normal;
    this.ratio = ratio // 垂直イージングの限界の距離に対する幅。
    this.from; // 予めがっちり決めるのがorbital, 行先だけ決めるのがoriented, 方向と距離だけ決めるのがvector
    this.to; // なんだけど最終的にはどっちもfromとtoが確定します。
    this.spanTime = spanTime; // 所要フレーム数（デフォルトはfromからtoまでの距離をスピードで割ったもの）
    this.diffVector; // 垂直方向へのずれ。
  }
  setSpanTime(_actor){
    if(this.spanTime < 0){
      this.spanTime = p5.Vector.dist(this.from, this.to) / _actor.speed; // fromとtoが決まった後で適切に呼び出す
    }
  }
  initialize(_actor){
    this.setSpanTime(_actor);
    // ずれ
    this.diffVector = createVector(this.to.y - this.from.y, -(this.to.x - this.from.x)).mult(this.ratio);
    //console.log(this.diffVector.x);
    //console.log(this.diffVector.y);
    _actor.timer.reset();
  }
  getProgress(_actor){
    //console.log(_actor);
    _actor.timer.step(); // 1ずつ増やす
    let cnt = _actor.timer.getCnt();
    if(cnt >= this.spanTime){
      cnt = this.spanTime;
      _actor.setState(COMPLETED);
    }
    return cnt / this.spanTime;
  }
  execute(_actor){
    let progress = this.getProgress(_actor);
    let easedProgress = parallelFunc[this.easeId_parallel](progress);
    //console.log(normalFunc[0]);
    //console.log(this);
    let normalDiff = normalFunc[this.easeId_normal](progress);
    //console.log(this.to);
    _actor.pos.x = map(easedProgress, 0, 1, this.from.x, this.to.x);
    _actor.pos.y = map(easedProgress, 0, 1, this.from.y, this.to.y);
    let easeVectorN = p5.Vector.mult(this.diffVector, normalDiff);
    //console.log(easeVectorN.x);
    //console.log(easeVectorN.y);
    _actor.pos.add(easeVectorN);
  }
}

class orbitalEasingFlow extends easingFlow{
  constructor(easeId_parallel, easeId_normal, ratio, spanTime, from, to){
    super(easeId_parallel, easeId_normal, ratio, spanTime)
    this.from = from;
    this.to = to; // fromとtoがベクトルで与えられる最も一般的な形
  }
  initialize(_actor){
    _actor.pos.set(this.from.x, this.from.y); // orbitalなので初期位置を設定
    this.setSpanTime(_actor);
    // ずれ
    this.diffVector = createVector(this.to.y - this.from.y, -(this.to.x - this.from.x)).mult(this.ratio);
    _actor.timer.reset();
  }
}

class orientedFlow extends easingFlow{
  constructor(easeId_parallel, easeId_normal, ratio, spanTime, to){
    super(easeId_parallel, easeId_normal, ratio, spanTime)
    this.to = to;
  }
  initialize(_actor){
    this.from = createVector(_actor.pos.x, _actor.pos.y);
    this.setSpanTime(_actor);
    this.diffVector = createVector(this.to.y - this.from.y, -(this.to.x - this.from.x)).mult(this.ratio);
    _actor.timer.reset();
  }
  setDestination(to){ // 直接toをいじれる
    this.to = to;
  }
}

class vectorFlow extends easingFlow{
  constructor(easeId_parallel, easeId_normal, ratio, spanTime, directionVector){
    super(easeId_parallel, easeId_normal, ratio, spanTime)
    this.directionVector = directionVector;
  }
  initialize(_actor){
    this.from = createVector(_actor.pos.x, _actor.pos.y);
    this.to = p5.Vector.add(this.from, this.directionVector);
    this.setSpanTime(_actor);
    this.diffVector = createVector(this.to.y - this.from.y, -(this.to.x - this.from.x)).mult(this.ratio);
    _actor.timer.reset();
  }
}

flow.index = 0; // convertに使うflowの連番

// 純粋なactorはflowをこなすだけ、言われたことをやるだけの存在
class actor{
  constructor(f = undefined){
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
    //console.log("initialize");
    this.setState(IN_PROGRESS);
  }
  in_progressAction(){
    this.currentFlow.execute(this); // 実行！この中で適切なタイミングでsetState(COMPLETED)してもらうの
  }
  completeAction(){
    this.setState(IDLE);
    this.currentFlow.convert(this); // ここで行先が定められないと[IDLEかつundefined]いわゆるニートになります（おい）
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
class movingActor extends actor{
  constructor(f = undefined, speed = 1, kind = 0){
    super(f);
    this.pos = createVector(-100, -100); // flowが始まれば勝手に・・って感じ。
    this.visual = new rollingFigure(kind); // 回転する図形
    this.speed = speed; // 今の状況だとスピードも要るかな・・クラスとして分離するかは要相談（composition）
  }
  display(){
    this.visual.display(this.pos);
  }
}

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

// flowの開始時、終了時に何かさせたいときの処理
// initialはflowのinitializeの直前、completeはflowの完了直後に発動する
class Gimic{
  constructor(myFlowId){
    this.myFlowId = myFlowId; // どこのflowの最初や最後でいたずらするか
  }
  action(_actor){ return; };
  initialCheck(_actor, flowId){
    if(_actor.state === IDLE && _actor.isActive && flowId === this.myFlowId){ return true; }
    return false;
  }
  completeCheck(_actor, flowId){
    if(_actor.state === COMPLETED && _actor.isActive && flowId === this.myFlowId){ return true; }
    return false;
  }
}

// killするだけ
class killGimic extends Gimic{
  constructor(myFlowId){
    super(myFlowId);
  }
  action(_actor){
    _actor.inActivate();
    _actor.kill();
  }
}

class inActivateGimic extends Gimic{
  constructor(myFlowId){
    super(myFlowId);
  }
  action(_actor){
    _actor.inActivate(); // 踏んだ人をinActivateするだけ
    //console.log(_actor.isActive);
  }
}

class activateGimic extends Gimic{
  constructor(myFlowId, targetActorId){
    super(myFlowId);
    this.targetActorId = targetActorId;
  }
  action(_actor){
    all.getActor(this.targetActorId).activate(); // ターゲットをactivateする
  }
}

// targetFlowIdのところは-1でallRandomにしたり、
// 範囲は特定（2とか）なら[2], 3と4と5のどれかなら[3, 4, 5]みたいに指定。

class generateGimic extends Gimic{
  constructor(myFlowId, targetFlowIdArray, targetColor = -1, limit = 10){
    super(myFlowId);
    this.targetFlowIdArray = targetFlowIdArray; // 発生させる対象flow（ハブでもいいし）
    this.targetColor = targetColor; // 色指定。-1のときはランダム
    this.limit = limit; // 限界値（たとえば10なら10匹以上にはしない）
  }
  action(_actor){
    let targetFlowId = this.targetFlowIdArray[randomInt(this.targetFlowIdArray.length)]; // ランダムでどこか
    if(all.actors.length >= this.limit){ return; }
    let setColor = this.targetColor;
    if(setColor < 0){ setColor = randomInt(7); } // -1のときはランダム
    let newActor = new movingActor(all.flows[targetFlowId], 2 + randomInt(3), setColor);
    newActor.activate();
    all.actors.push(newActor);
  }
}


// コードの再利用ができるならこれを複数バージョンに・・って事も出来るんだけどね

// Colosseoっていう、いわゆる紅白戦みたいなやつ作りたいんだけど。なんか、互いに殺しあってどっちが勝つとか。
// HP設定しといて、攻撃と防御作って、色々。その時にこれで、
// 攻撃や防御UP,DOWN, HP増減、回復、色々。まあ回復はHub..HubにGimic配置してもいいし。
// そういうのに使えそうね。
// キャラビジュアルは黒と白のシンプルな奴にして縦棒で目とか付けて一応ディレクション変更で向きが変わるように、
// やられたら目がバッテンになって消えるみたいな
// ダメージの色とか決めて（バー出せたらかっこいいけど）

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
    this.initialGimic = [];  // flow開始時のギミック
    this.completeGimic = []; // flow終了時のギミック
    this.patternIndex = 0; // うまくいくのかな・・
    this.patternArray = [createPattern0];
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
  registActor(flowIds, speeds, kinds){
    // flowはメソッドでidから取得。
    //console.log(this.flows);
    for(let i = 0; i < flowIds.length; i++){
      let f = this.getFlow(flowIds[i]);
      let newActor = new movingActor(f, speeds[i], kinds[i])
      //console.log(newActor);
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
    if(params['type'] === 'orbitalEasing'){
      return new orbitalEasingFlow(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['from'], params['to']);
    }else if(params['type'] === 'oriented'){
      return new orientedFlow(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['to']);
    }else if(params['type'] === 'vector'){
      return new vectorFlow(params['easeId1'], params['easeId2'], params['ratio'], params['spanTime'], params['directionVector']);
    }
  }
  initialGimicAction(){
    if(this.initialGimic.length === 0){ return; }
    this.initialGimic.forEach(function(g){
      this.actors.forEach(function(a){
        if(g.initialCheck(a, a.currentFlow.index)){ g.action(a); }
      })
    }, this)
  }
  completeGimicAction(){
    if(this.completeGimic.length === 0){ return; }
    this.completeGimic.forEach(function(g){
      this.actors.forEach(function(a){
        if(g.completeCheck(a, a.currentFlow.index)){ g.action(a); }
      })
    }, this)
  }
  update(){
    this.actors.forEach(function(_actor){
      //console.log(_actor);
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

// 各種画像を作ります
function inputGraphic(img, graphicsId){
  img.noStroke();
  img.fill(palette[graphicsId]);
  img.rect(2, 2, 16, 16);
}

// --------------------------------------------------------------------------------------- //

function createPattern0(){
  // まずorbitalEasingを5つ。
  let posX = [100, 200, 300, 400, 500, 500, 400, 300, 200, 100];
  let posY = constSeq(100, 5).concat(constSeq(400, 5));
  let vecs = getVector(posX, posY);
  let paramSet = getEasingFlow(vecs, 'orbitalEasing', constSeq(0, 5), constSeq(0, 5), constSeq(0.1, 5), constSeq(120, 5), [0, 1, 2, 3, 4], [5, 6, 7, 8, 9]);
  all.registFlow(paramSet);
  // 次にorientedを5つ。
  posX = arSinSeq(0, 2 * PI / 5, 5, 200, 300);
  posY = arCosSeq(0, 2 * PI / 5, 5, -100, 300);
  vecs = getVector(posX, posY);
  paramSet = getEasingFlow(vecs, 'oriented', constSeq(0, 5), constSeq(0, 5), constSeq(0.1, 5), constSeq(120, 5), [0, 1, 2, 3, 4]);
  all.registFlow(paramSet);
  // 次にvectorFlowを5つ。
  posX = constSeq(0, 5);
  posY = constSeq(-150, 5);
  vecs = getVector(posX, posY);
  paramSet = getEasingFlow(vecs, 'vector', constSeq(0, 5), constSeq(0, 5), constSeq(0.1, 5), constSeq(120, 5), [0, 1, 2, 3, 4]);
  all.registFlow(paramSet);
  // つなげましょう
  all.connectMulti([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [[5], [6], [7], [8], [9], [10], [11], [12], [13], [14]]);
  all.registActor([0, 1, 2, 3, 4], [1, 1, 1, 1, 1], [0, 1, 2, 3, 4]);
  all.activateAll();
}

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
  //console.log(array);
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

function getEasingFlow(vecs, typename, idSet1, idSet2, ratioSet, spanSet, firstVectorIds, secondVectorIds = undefined){
  // typenameSetは色々、orbitalとかorientedとかvectorとか入ってる。
  // typenameに応じたeasingFlowのパラメータセットの配列を作成して返却する
  let paramSet = [];
  for(let i = 0; i < idSet1.length; i++){
    let dict = {type:typename, easeId1:idSet1[i], easeId2:idSet2[i], ratio:ratioSet[i], spanTime:spanSet[i]};
    if(typename === 'orbitalEasing'){
      dict['from'] = vecs[firstVectorIds[i]];
      dict['to'] = vecs[secondVectorIds[i]];
    }else if(typename === 'oriented'){
      dict['to'] = vecs[firstVectorIds[i]];
    }else if(typename === 'vector'){
      dict['directionVector'] = vecs[firstVectorIds[i]];
    }
    paramSet.push(dict);
  }
  return paramSet;
}

function funcP0(r){
  return r*r;
}

function funcP1(r){
  return r;
}

function funcN0(r){
  return sin(2 * PI * r);
}

function funcN1(r){
  return 0;
}
