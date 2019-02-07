// abstract graph.

let p1;
let p2;
let m1;
let m2;
let mf;

function setup(){
  createCanvas(200, 200);
  p1 = new point(50, 100);
  p2 = new point(150, 100);
  m1 = new straightMove(p1, p2);
  m2 = new straightMove(p2, p1);
  p1.inFlow.push(m2);
  p1.outFlow.push(m1);
  p2.inFlow.push(m1);
  p2.outFlow.push(m2);
  mf = new movingCircle(p1, 2, color('red'));
  //noLoop();
}

function draw(){
  //console.log("Hello");

  background(230);
  mf.execute();
  //if(frameCount > 120){ noLoop(); }
}

// for debug.
function keyTyped(){
  if(key === 'p'){ noLoop(); }
  if(key === 'q'){ loop(); }
}

// counter.
// how to use:
// 現在のカウントを手に入れる→getCnt().
// isOnのときカウントが動き、そうでないとき動いてない。状態の取得→getState().
// setting: limはcounterが停止するポイントを指定する、-1にすると無限ループになる。
// diffは差分。いくつとびでカウンターが進むかを指定する。
// progress()でカウンターが進む。isOnでなければやることは何もない。
// isOnでもlimitが-1ならカウンターは進めない。ただtrueを返すだけ。
// isOnでlimitが0以上のときは進めて、limitを超えたらoffにしてfalseを返す。
// この、trueならカウンターが進みfalseを返すという挙動により各種の、
// カウンターが一定の値に達した後の処理を行うことができる。
// pauseは純粋なカウンターの一時停止を行う。
class counter{
  constructor(){
    this.cnt = 0;
    this.isOn = false;
    this.limit; // -1のときの挙動どうするかな
    this.increaseValue; // 増分（負の場合もある）
  }
  getCnt(){ return this.cnt; }
  getState(){ return this.isOn; } // 状態の取得
  setting(lim, diff){
    this.cnt = 0;
    this.limit = lim;
    this.increaseValue = diff;
    this.isOn = true;
  }
  progress(){
    if(this.isOn){
      this.cnt += this.increaseValue;
      if(this.limit < 0){ return true; } // limitが-1のときは無限ループ
      if(this.cnt > this.limit){ this.isOn = false; } // limitを超えたら停止
    }
    return this.isOn;
  }
  pause(){ // 停止と再生(cntはそのまま)
    this.isOn = !this.isOn;
  }
}
// normalCounter: 普通のカウンター。limitもincreaseValueも正。
// infiniteCounter: 無限に値が増加し続ける。limit = -1, increaseValue > 0.
// waitCounter: limit = -1でずーっと何もしないし0しか返さない。
// トリガーでsettingが発動したらそこからnormalCounterになり一定時間の後終了する。

class loopCounter extends counter{
  constructor(){
    // 値がループするカウンター
    super();
  }
  progress(){
    if(this.isOn){ // こうしないとpauseできない
      this.cnt += this.increaseValue;
      if(this.cnt > this.limit){ this.cnt -= this.limit; } // スイッチはonのまま。
    }
    return this.isOn;
  }
}

class reversibleCounter extends counter{
  // limitから減っていく流れを表現できるカウンター（双方向のやつに使う）
  // 返す値の所だけ分離してそこだけいじる。これにより、値の増加量の符号をいじらなくて済む（すごい！）
  constructor(){
    super();
    this.reverse = false;
  }
  changeReverse(){
    this.reverse = !this.reverse;
  }
  getCnt(){ if(!this.reverse){ return this.cnt; }else{ return this.limit - this.cnt; } }
}

class reverseLoopCounter extends reversibleCounter{
  constructor(){
    // 値が行ったり来たりするカウンター(increaseValueは正とする)
    super();
  }
  progress(){
    if(this.isOn){
      this.cnt += this.increaseValue;
      if(this.cnt > this.limit || this.cnt < 0){
        if(this.cnt < 0){ this.cnt = -this.cnt; }else{ this.cnt = this.cnt - this.limit; }
        this.changeReverse();
      }
    }
    return this.isOn;
  }
}

class state{
  // actorに持たせるspotもしくはflowです
  constructor(){
    this.span; // 時間的、空間的なへだたり(グラフ作るときに使うから無くさないでください)
    this.timer = new counter(); // カウンター
  }
  convert(){} // 逆じゃない？まずconvertで次のstateを取得した後、
  setting(){} // そのstateにsettingを施す。
  action(){}  // 各フレームにおける演技内容
}

// たとえばactorがmovingFigureで位置の変更とかするとしても
// 渡すのは位置ベクトルだけでいいわけでしょ。そんだけ。

class spot extends state{
  constructor(){
    super();
    this.inFlow = [];   // 入ってくるflow
    this.outFlow = [];  // 出ていくflow
  }
}

class doubleSpot extends state{
  // inとoutが同じflowからなるspot
  constructor(){
    super();
    this.inoutFlow = []; // つまり同じセットということね（2つ同じセットを持つのが無駄）
  }
}

class flow extends state{
  constructor(){
    super();
    this.from;  // 始点となる対象
    this.to;    // 終点となる対象
  }
}

class doubleFlow extends state{
  // from と to が同じflow(いわゆる車輪型)
  constructor(){
    super();
    this.pivot; // スタートとゴールが同じspot.
  }
}

class actor{
  constructor(){
    this.state; // spotもしくはflow
  }
  convert(){
    // convertって書けばflowの場合は普通にtoを返すしspotの場合は普通に計算結果を返す。
  }
  execute(){} // たとえばまあvisualのclassにdisplayさせるとかそういう(displayのが一般的らしい)
}

class relation{
  // 関係性（もはや関係だけ、具体性ゼロ）
  constructor(){
    this.spots = [];
    this.flows = [];
  }
  // 連携の作成
  createRelation(){}
  // リセット
  reset(){}
}

// そろそろ具体化したいけどね・・
class entity{
  constructor(){
    this.field = new relation(); // なにかしらのrelation.
    this.troop = []; // actorの集団（？？）
  }
  // actorの追加と削除
  addActor(){}
  deleteActor(){}
  update(){ this.troop.forEach(function(a){ a.update(); }) }
  execute(){ this.troop.forEach(function(a){ a.execute(); }) }
}

// 抽象論が続いたので具体化します（tukareta）
// ここからは具体例。あれを実現します。たくさんの点をつなぐグラフの上を
// 縦横無尽に好き勝手に点が飛び回る「あれ」を実装します。
// 名付けて「movingFigure」、はい。
// 一応すべての点に入る点と出る点があるとし常に立ち止まらないとする。

// ひとつの具体化
class point extends spot{
  // 要するに、点。visualはrelationの具体化の時にやるからいい。
  constructor(x, y){
    super();
    this.x = x; // 位置
    this.y = y;
    this.span = 0; // 立ち止まらない感じで。立ち止まるんでもいいんだけどまあ具体化だから。
  }
  setting(_actor){ return; }
  convert(){
    let nextMove = random(this.outFlow); // めちゃ適当
    //nextMove.setting();
    return nextMove;
  }
  action(pos){
    pos.set(this.x, this.y); // この位置に止める。そのくらいはいいでしょ。
    return false; // カウンターもクソもない
  }
}

// straightMoveじゃない可能性を残しておきたいのでそこは継承で・・・・
class move extends flow{
  constructor(p1, p2){
    super();
    this.from = p1;
    this.to = p2;
  }
  setting(_actor){
    // カウンター関係
  }
  convert(){
    return this.to; // まあそうよね
  }
  action(pos){
    // posをいじる
  }
}

class straightMove extends move{
  constructor(p1, p2){
    super(p1, p2);
    this.span = sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
  }
  setting(_actor){
    this.timer.setting(this.span, _actor.speed);
  }
  action(pos){ // ←posは_actorにすべきなんでしょうね
    // まず、getStateでfalseが返ってきたら何もしないでtrueを返す。
    // getStateがtrueならprogressを実行
    // その結果を格納しておく
    // progressの後何かしらのaction, 結果を返す。
    // この結果の部分以外は共通みたい。
    if(!this.timer.getState()){ return true; }
    let flag = this.timer.progress();
    let cnt = this.timer.getCnt();
    pos.x = map(cnt, 0, this.span, this.from.x, this.to.x);
    pos.y = map(cnt, 0, this.span, this.from.y, this.to.y);
    return flag;
  }
}

class movingFigure extends actor{
  constructor(p, speed){
    super();
    this.state = p; // どっかのspotからスタート
    this.pos = createVector(p.x, p.y); // で、位置を与えられて・・あとは？
    this.visual = new figure();
    this.speed = speed; // speed忘れてた(increaseValue)
  }
  convert(){
    this.state = this.state.convert();
    //console.log(this);
    this.state.setting(this);
  }
  execute(){
    // actionでfalseが返ってきたらconvertするけど
    // trueが返ってきたらしない。ともかくactionさせる。
    if(!this.state.action(this.pos)){ this.convert(); };
    this.visual.display(this.pos); // このくらいしかやることがない
  }
}

class movingCircle extends movingFigure{
  constructor(p, speed, _color){
    super(p, speed);
    this.visual = new circle(_color); // こんだけ
  }
}

class figure{
  constructor(){}
  display(){}
}

class circle extends figure{
  constructor(color, radius = 10){
    super();
    this.color = color;
    this.radius = radius;
  }
  display(pos){
    push();
    translate(pos.x, pos.y);
    fill(this.color);
    //console.log(this.color);
    noStroke();
    ellipse(0, 0, this.radius, this.radius);
    pop();
  }
}

// とりあえずテスト成功？
