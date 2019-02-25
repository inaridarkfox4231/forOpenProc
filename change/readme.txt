できました。
とりあえずここまでで一旦切りますね・・これ以上はプログラムごとにカスタマイズする必要がありそうなので。
やったことは単純です。flowだけにしてhubをなくし、graphはsubとmainの概念を無くしました。
パターンのインプットが多少難しくなったけれどできることは格段に増えましたね。やったやった。
まあ満足してないけど。やりたいことの1％も達成してないので。
class flow{
  constructor(){
    this.index = flow.index++;
    this.convertible = true;
    this.initialFunc = trivVoid;
    this.completeFunc = trivVoid;
    this.convertFunc = triv;
  }
  isConvertible(){ return this.convertible; }
  initialize(_actor){ this.initialFunc(this, _actor); }
  // defaultAction(_actor){} // completeしたあとconvert出来ない時の処理
  execute(_actor){}
  complete(_actor){ this.completeFunc(this, _actor); }
  convert(_actor){
    let nextFlow = all.getNextFlow(this.index, this.convertFunc(this, _actor));
    _actor.state = nextFlow;
  }
  display(gr){}
}
これが現時点でのもっとも一般的なflowの形。
どこかからどこかへ、という旧来の概念を完全に超越した、はず。まだ作ってないから何とも言えないのよね・・

大きくなってきたので移しました。
