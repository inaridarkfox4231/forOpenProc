// state遷移やってみるかい？

// めんどくさいし、とりあえずすべてマウス位置で処理しますか、とりあえずは。

'use strict';
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

// 考えたんだけど
// displayとrenderを分けたい。
// 上のdisplay(gr)ってやってることはgrに自分をrenderingする操作。
// displayは基本引数なしで、displayに対して何かする操作。分けたいのよね。
// actorのあれも実質renderingだしなー。・・renderって意味が難しい。

// flowのdisplayも_actor引数に取ったらどうだろう・・何か、変わる気がする。何か。
// たとえばentityのdisplayに this.currentFlow.display(this) って書くとか。
// あ、すべてじゃないけど。だって今まで扱ってきた点とかは普通に・・・んー。
// 今考えたけど、objLayerに描いた時点ではまだdisplayされてないからやっぱdisplayっておかしいな・・renderやな・・
// displayはそのターンのレンダリングがすべて終了した時点でそれを表に出す作業のような気がするんよね。

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
  let titleScene = new titleScene();
  let selectScene = new selectScene();
  let playScene = new playScene();
  let gameoverScene = new gameoverScene();
  let clearScene = new clearScene();
  titleScene.addFlow(selectScene);
  selectScene.addFlow(playScene);
  playScene.convertList = [gameoverScene, clearScene];
  gameoverScene.addFlow(titleScene);
  clearScene.addFlow(titleScene);
  // 後は知らないけどね・・・
  return titleScene;
}

// タイトル
class titleScene extends flow{
  constructor(){
    super();
  }
}

class selectScene extends flow{
  constructor(){
    super();
  }
}

class playScene extends flow{
  constructor(){
    super();
  }
}

class gameoverScene extends flow{
  constructor(){
    super();
  }
}

class clearScene extends flow{
  constructor(){
    super();
  }
}
