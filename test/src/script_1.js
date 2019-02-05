// 即時間数ってなんだろう
// 参考：http://blog.tojiru.net/article/197270788.html
/*

(function(param){
  'use strict';
  console.log(param);
}("hello!")); // これでconsoleにhello!と出力される

var str = "echo";
if(str === window.str){ console.log("true"); }
function dummy(){
  console.log("wooooooo!");
}

window.dummy(); // 関数はwindowオブジェクトのプロパティです。
*/
(function tigerroar(){ console.log("guaooooooo!!"); })();
//window.tigerroar(); // 実行されない

var hogera = function() {
  alert('functionの前に = や var があるので関数は式です');
};

[
  function() {
    alert('配列に格納されてるときもfunctionより先に [ があるので式です');
  }
];

if(function() {alert(1); }){
  alert('こんな不細工なことやりませんが式なので条件式にも使えます');
}

(function() {
  alert('(1+ 1)と同じ意味での( )で関数をくくれば、functionより先に ( があるので式となります');
})(); // この最後の()で関数を呼び出している

+function(){ alert("なんと+で始めてもいいんだって！"); }(); // へぇー。
void function(){ alert("voidが意味的に分かりやすいので推奨されている"); }();
// でもvoidは何をreturnに設定してもundefinedを返すの。まぁ、()でくくりましょう・・
