// flowベースでの書き換えをする実験～～

'use strict';
let all; // 全体
let palette; // カラーパレット

const PATTERN_NUM = 6;
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

class killHub extends flow{
  // 殺すだけ
  constructor(){ super(); }
  execute(_actor){ _actor.kill(); } // おわり。ギミック処理もできるけどflowにすればvisualも定められるし（位置情報が必要）
} // 位置やビジュアルを設けるかどうかは個別のプログラムに任せましょう

class colorSortHub extends flow{
  // 特定の色を1に、それ以外を0に。convertListは0と1のふたつであることを想定している。targetを1に振り分ける。
  constructor(targetColor){
    super();
    this.targetColor = targetColor;
  }
  convert(_actor){
    if(_actor.visual.kind === this.targetColor){
      this.nextFlowIndex = 1;
    }else{
      this.nextFlowIndex = 0;
    }
    _actor.setFlow(this.convertList[this.nextFlowIndex]); // 然るべくconvert. おわり。
  }
} // そのうち別プロジェクトでやるつもり。

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

// 放物線を描きながら画面外に消えていく。物理、すごい・・
class fallFlow extends shootingFlow{
  constructor(speed, distance, maxHeight){ // 速さ、水平最高点到達距離、垂直最高点到達距離
    super();
    this.vx = speed; // 水平初速度
    this.vy = 2 * abs(speed) * maxHeight / distance; // 垂直初速度
    this.gravity = 2 * pow(speed / distance, 2) * maxHeight; // 重力加速度
  }
  execute(_actor){
    _actor.timer.step(); // カウントは1ずつ増やす
    let cnt = _actor.timer.getCnt();
    _actor.pos.x += this.vx;
    _actor.pos.y -= this.vy - this.gravity * cnt; // これでいいね。物理。
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
    this.patternIndex = 5; // うまくいくのかな・・
    this.patternArray = [createPattern0, createPattern1, createPattern2, createPattern3, createPattern4, createPattern5];
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
    if(params['type'] === 'straight'){
      return new straightFlow(params['from'], params['to'], params['factor']);
    }else if(params['type'] === 'jump'){
      return new jumpFlow(params['from'], params['to']);
    }else if(params['type'] === 'assemble'){
      return new assembleHub(params['limit']);
    }else if(params['type'] === 'fall'){
      return new fallFlow(params['speed'], params['distance'], params['height']);
    }else if(params['type'] === 'throw'){
      return new throwFlow(params['v']); // fromは廃止
    }else if(params['type'] === 'wait'){
      return new waitFlow(params['span']); // spanフレーム数だけアイドリング。combatに使うなど用途色々
    }else if(params['type'] === 'colorSort'){
      return new colorSortHub(params['targetColor']); // targetColorだけ設定
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

// ここでmain→subの順にregistすればOK
function createPattern0(){
  // 作ってみるか・・・（どきどき）
  let vecs = getVector([100, 100, 300, 300], [100, 300, 300, 100]);
  let paramSet = getOrbitalFlow(vecs, [0, 1, 2, 3], [1, 2, 3, 0], 'straight');
  all.registFlow(paramSet);
  all.registFlow([{type:'wait', span:120}]); // waitFlowをさっそくつかってみよう→成功～いろいろ使えそう。
  all.connectMulti([0, 1, 2, 3, 4], [[1], [4], [3], [0], [2]]);
  all.registActor([0], [2], [0]);
  all.activateAll();
  // 3番にkillを放り込んでみる
  //all.initialGimic.push(new killGimic(1)); // うまくいってるみたい
  all.completeGimic.push(new killGimic(3));
}

function createPattern1(){
  // assembleとjumpの実験
  let posX = multiSeq([100, 200, 300], 4);
  let posY = jointSeq([constSeq(100, 3), constSeq(200, 3), constSeq(300, 3), constSeq(400, 3)]);
  let vecs = getVector(posX, posY);
  let paramSet = getOrbitalFlow(vecs, [1, 1, 0, 4, 2, 4, 4, 3, 7, 5, 6, 8], [0, 2, 3, 1, 5, 3, 5, 6, 4, 8, 7, 7], 'straight');
  paramSet.push({type:'assemble', limit: 3});
  all.registFlow(paramSet);
  all.connectMulti([0, 1, 2, 3, 4, 5], [[2], [4], [7], [0, 1], [9], [7]]);
  let additional = getOrbitalFlow(vecs, [6, 10, 8, 9, 11], [9, 7, 11, 10, 10], 'jump');
  all.registFlow(additional);
  all.connectMulti([6, 7, 8, 9, 10, 11, 12], [[9], [10, 13], [12], [11, 15], [8], [8], [3, 5, 6]]);
  all.connectMulti([13, 14, 15, 16, 17], [[16], [8], [17], [14], [14]]);
  all.registActor([3, 5, 6], [2, 2, 2], [0, 1, 2]);
  all.activateAll();
}
// generateHubとkillHub作りたい
// 色に合わせてconvertも作りたいけど明日にしよ
function createPattern2(){
  // shootingの実験
  let posX = [60].concat(constSeq(120, 5)).concat(constSeq(180, 5)).concat([240, 300]);
  let posY = [180].concat(arSeq(60, 60, 5)).concat(arSeq(60, 60, 5)).concat([180, 180]);
  let vecs = getVector(posX, posY);

  let paramSet = getOrbitalFlow(vecs, [0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 8, 11], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'straight');

  all.registFlow(paramSet);
  let throwSet = typeSeq('throw', 4);
  let vSet = [createVector(1, 1), createVector(1, 1), createVector(1, -1), createVector(1, -1)];

  for(let i = 0; i < 4; i++){ throwSet[i]['v'] = vSet[i]; }

  let fallSet = typeSeq('fall', 3);
  let dataSet = [[1, 30, 60], [1, 60, 120], [2, 60, 60]];
  for(let i = 0; i < 3; i++){ fallSet[i]['speed'] = dataSet[i][0]; fallSet[i]['distance'] = dataSet[i][1]; fallSet[i]['height'] = dataSet[i][2]; }
  all.registFlow(throwSet.concat(fallSet));
  all.connectMulti(arSeq(0, 1, 12), [[5], [6], [7], [8], [9], [12], [13], [10, 16], [14], [15], [11, 17], [18]]);
  all.registActor([0, 1, 2, 3, 4, 2, 2], [2, 2, 2, 2, 2, 2, 2], [0, 1, 2, 3, 4, 5, 6]);
  all.activateAll();
}

function createPattern3(){
  // generateHubの実験。
  let posX = [160, 120, 200, 80, 160, 240, 40, 120, 200, 280, 80, 160, 240, 120, 200, 160, 120, 200];
  for(let i = 0; i < 18; i++){ posX[i] += 160; }
  let posY = [40, 80, 80, 120, 120, 120, 160, 160, 160, 160, 200, 200, 200, 240, 240, 280, 320, 320];
  let vecs = getVector(posX, posY);

  let paramSet = getOrbitalFlow(vecs, [0, 2, 1, 1, 4, 5, 3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 10, 11, 14, 14, 13, 15, 16], [1, 0, 3, 4, 2, 2, 6, 3, 7, 4, 8, 5, 10, 7, 11, 8, 12, 9, 13, 13, 11, 12, 15, 14, 17], 'straight');
  all.registFlow(paramSet);
  all.registFlow([{type:'fall', speed:-2, distance:60, height:60}, {type:'fall', speed:2, distance:60, height:60}]);
  all.connectMulti(arSeq(0, 1, 25), [[2, 3], [0], [6], [4, 8], [1], [1], [12, 25], [6], [7, 14], [4, 8], [9, 16], [5, 10], [18, 13], [7, 14], [15, 19], [9, 16], [17], [11, 26], [22], [22], [15, 19], [17], [23], [20, 21], [24]]);
  all.registActor([8, 9, 14, 15, 24], [2, 2, 2, 2, 1], [0, 1, 2, 3, 6]);
  all.activateAll();
  all.completeGimic.push(new generateGimic(24, [0, 1, 3, 4])); // 24の完了時に0, 1, 3, 4のいずれかに発生させる
}

function createPattern4(){
  // activate, inactivateの実験。
  let posX = [100, 340, 340, 100, 180, 260, 260, 180];
  let posY = [100, 100, 340, 340, 180, 180, 260, 260];
  let vecs = getVector(posX, posY);
  let paramSet = getOrbitalFlow(vecs, [0, 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 0, 5, 6, 7, 4], 'straight');

  all.registFlow(paramSet);
  all.connectMulti([0, 1, 2, 3, 4, 5, 6, 7], [[1], [2], [3], [0], [5], [6], [7], [4]]);

  all.registActor([0, 4], [1, 3], [0, 1]);
  all.activateAll();

  for(let i = 4; i <= 7; i++){
    all.completeGimic.push(new inActivateGimic(i)); // 4～7は完了時に止まる。
  }
  for(let i = 0; i <= 3; i++){
    all.completeGimic.push(new activateGimic(i, 1)); // 0～3を踏むと1番がactivateされる
  }
}

function createPattern5(){
  // colorSortHubの実験
  let posX = arSeq(60, 40, 8).concat(arSeq(100, 40, 7));
  let posY = constSeq(80, 8).concat(constSeq(160, 7));
  let vecs = getVector(posX, posY);
  let paramSet = getOrbitalFlow(vecs, [0, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 'straight');
  all.registFlow(paramSet);
  // 次にfallFlow
  paramSet = constSeq({type:'fall', speed:2, distance:50, height:50}, 7);
  all.registFlow(paramSet);
  // 次にcolorSortHub
  paramSet = typeSeq('colorSort', 6); // const使うと全部同じになっちゃう
  for(let i = 0; i < 6; i++){ paramSet[i]['targetColor'] = i; } // 0, 1, 2, 3, 4, 5を分けてね
  console.log(paramSet);
  all.registFlow(paramSet);
  // 次にgenerateModule
  all.registFlow([{type:'wait', span:30}]); // ここに普通のactorを走らせて、自分とつないでウロボロスにする
  // 次に接続
  all.connectMulti(arSeq(0, 1, 28), [[21], [22], [23], [24], [25], [26], [13], [14], [15], [16], [17], [18], [19], [20], [], [], [], [], [], [], [], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 12], [27]]);
  // 次にgenerateGimic
  all.completeGimic.push(new generateGimic(27, [0]));
  // 生成用のactor
  let generateRunner = new actor(all.getFlow(27));
  generateRunner.activate();
  all.actors.push(generateRunner); // 走るだけ
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
