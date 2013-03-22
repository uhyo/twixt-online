var game=new Game();

//ゲーム開始
game.init(Game.ClientDOMView,function(){
	return {
		root:document.body,
	};
});
game.useUser(Game.DOMUser,function(user){
});
game.event.on("gamestart",function(){
	//プレイヤー数を考えておく
	var twixt=game.add(TwixtHost);
	//ユーザーの出現を待つ
	game.event.on("entry",function(user){
		if(twixt.userlist.users.length<setting.playerNumber){
			//参加枠あり
			twixt.event.emit("entry",user);
		}
	});
});
game.start();

//設定
//Global!!! const
var twixtNamespace=twixtNamespace;
//Global!!!
var setting={
	//人数
	playerNumber: game.env==="standalone" ? 1 : 2,
	//点の数
	fieldx:24,
	fieldy:24,
	//描画関係
	backgroundColor:"#cccccc",
	bglineColor:"#00aa00",
	//プレイヤーの色
	color:["#ffffff","#ff0000"],
	lightColor:["#eeeeee","#ffcccc"],
	//点の間隔(px単位)
	pointDistance:24,
	//点の半径
	pointRadius:2,
	//石の半径
	stoneRadius:5,
	//判定用の点の半径
	pointClickRadius:12,
	//点の色
	pointColor:"#333333",
	//選択時の点の色
	selectPointColor:"#9999ff",
	holdedPointColor:"#ff99ff",
	//ゴールラインの幅
	goallineWidth:4,
	//リンクの幅
	linkWidth:4,
	
};
//定義
function TwixtHost(game,event,param){
	this.board=game.add(Board,{
		host:this,
	});
	this.userlist=game.add(UserList,{
		host:this,
	});
	this.state=TwixtHost.STATE_PREPARING;
}
TwixtHost.STATE_PREPARING=1;
TwixtHost.STATE_PLAYING=2;
TwixtHost.STATE_FINISHED=3;
TwixtHost.prototype.init=function(game,event,param){
	//イベント待受
	event.on("entry",function(user){
		//ユーザー出現
		//丸投げ
		this.userlist.event.emit("entry",user);
		//今度のこと
		var _this=this;
		user.event.on("tap",function(x,y){
			//ターンプレイヤーかどうかチェック
			if(_this.state!==TwixtHost.STATE_PLAYING){
				//まだ
				return;
			}
			var ul=_this.userlist;
			var tu=ul.users[ul.turn];
			if(tu.user!==user){
				//ターンプレイヤーではない
				return;
			}
			if(ul.put){
				//既に石をおいた
				return;
			}
			//石を置くぞ!
			_this.board.event.emit("putStone",_this.userlist.turn,x,y);
		});
		user.event.on("link",function(from,to){
			//リンクをはる
			if(!from || !to)return;	//不正
			//ターンプレイヤーかどうかチェック
			if(_this.state!==TwixtHost.STATE_PLAYING){
				//まだ
				return;
			}
			var ul=_this.userlist;
			var tu=ul.users[ul.turn];
			if(tu.user!==user){
				//ターンプレイヤーではない
				return;
			}
			//リンクを置くぞ!
			_this.board.event.emit("putLink",_this.userlist.turn,from,to);
		});
		user.event.on("turnend",function(){
			//ターン終了する
			var ul=_this.userlist;
			var tu=ul.users[ul.turn];
			if(_this.state!==TwixtHost.STATE_PLAYING){
				//まだ
				return;
			}
			if(tu.user!==user){
				//ターンプレイヤーではない
				return;
			}
			//ターンをまわす
			ul.event.emit("setTurn",(ul.turn+1)%ul.users.length);
			ul.users.forEach(function(box,i){
				//ターンプレイヤーを設定
				box.event.emit("state", i===ul.turn ? UserBox.STATE_TURNPLAYER : UserBox.STATE_WAITING);
			});
		});
		user.event.on("pierule",function(){
			//パイルール適用
			var ul=_this.userlist;
			var tu=ul.users[ul.turn];
			if(_this.state!==TwixtHost.STATE_PLAYING){
				//まだ
				return;
			}
			if(tu.user!==user){
				//ターンプレイヤーではない
				return;
			}
			if(ul.turncount!==1){
				//パイルール適用できない
				return;
			}
			if(ul.put){
				//もうだめ
				return;
			}
			//ターンをまわす
			ul.host.board.event.emit("pierule",ul.turn);
			ul.event.emit("setTurn",(ul.turn+1)%ul.users.length);
			ul.users.forEach(function(box,i){
				//ターンプレイヤーを設定
				box.event.emit("state", i===ul.turn ? UserBox.STATE_TURNPLAYER : UserBox.STATE_WAITING);
			});
		});
	}.bind(this));
	//状態変化
	event.on("state",function(state){
		this.state=state;
	}.bind(this));
	event.on("end",function(winner){
		//この人がかった
		event.emit("state",TwixtHost.STATE_FINISHED);
		//ユーザーたち・・・
		this.userlist.users.forEach(function(box,i){
			box.event.emit("state", i===winner ? UserBox.STATE_WINNER : UserBox.STATE_LOSER);
		});
		//しばらくしたら初期化する
		setTimeout(function(){
			var board=game.add(Board,{
				host:this,
			});
			var userlist=game.add(UserList,{
				host:this,
			});
			event.emit("init",board,userlist);
		}.bind(this),10000);
	}.bind(this));
	//初期化
	event.on("init",function(board,userlist){
		this.board=board;
		this.userlist=userlist;
	}.bind(this));
};
TwixtHost.prototype.renderTop=true;
TwixtHost.prototype.renderInit=function(view){
	var div=document.createElement("div");
	return div;
};
TwixtHost.prototype.render=function(view){
	var div=view.getItem();
	//中身けす
	var range=document.createRange();
	range.selectNodeContents(div);
	range.deleteContents();
	range.detach();
	//ボード
	div.appendChild(view.render(this.board));
	//ユーザー一覧
	div.appendChild(view.render(this.userlist));
};
function Board(game,event,param){
	this.stones={};	//"x,y":index
	this.links={};	//"x1,y1,x2,y2":index(p1,p2: (x,y)-sorted)
	this.host=param.host;	//TwixtHost
}
Board.prototype.init=function(game,event,param){
	//index番のユーザーが石を置く
	event.on("putStone",function(index,x,y){
		if(this.stones[x+","+y]!=null){
			//すでにある!置けない
			return;
		}
		//1P
		if(index===0 && (x===0 || x===setting.fieldx-1) ||
		   index===1 && (y===0 || y===setting.fieldy-1)){
			//ラインは越えられない
			return;
		   }
		//まだない!置ける
		event.emit("setStone",index,x,y);
	}.bind(this));
	event.on("setStone",function(index,x,y){
		this.stones[x+","+y]=index;
		//置いた通知
		this.host.userlist.event.emit("putComplete",index);
	}.bind(this));
	//リンクを設置要請（確定ではないようだ）
	event.on("putLink",function(index,from,to){
		//2乗距離を算出
		var d2=Math.pow(from.x-to.x,2)+Math.pow(from.y-to.y,2);
		if(d2!==5){
			//位置が合わない
			return;
		}
		//fromとtoを並び替え?
		var tmp;
		if(from.x>to.x || from.x===to.x && from.y>to.y){
			//fromのほうがあとだ!逆にする
			var tmp=from;
			from=to,to=tmp;
		}
		var ln=this.links[from.x+","+from.y+","+to.x+","+to.y];
		if(ln!=null){
			//すでにリンクがある
			if(ln===index){
				//自分のだ!外す
				event.emit("elimLink",index,from,to);
			}
			return;
		}
		//既存リンクとあたり判定する
		var flag=false;
		var l1=makeLine(from.x,from.y,to.x,to.y);
		//var ymn=Math.min(from.y,to.y), ymx=Math.max(from.y,to.y);
		for(var key in this.links){
			if(this.links[key]==null)continue;
			var arr=key.split(",").map(function(x){return x-0;});
			var l2=makeLine(arr[0],arr[1],arr[2],arr[3]);
			var pt=hit(l1,l2);
			//範囲内で重なるやつがあるとだめ
			//xはソートされているがyはされていない
			//var ymn2=Math.min(arr[1],arr[3]), ymx2=Math.max(arr[1],arr[3]);
			if(from.x<pt.x && pt.x<to.x && arr[0]<pt.x && pt.x<arr[2]){
				//範囲内にある
				flag=true;
				break;
			}
		}
		if(flag){
			//ぶつかるのがあった
			return;
		}
		//リンク設置OK
		event.emit("setLink",index,from,to);
		//2点を通る直線の式（ax+by+c=0）を導く
		function makeLine(x1,y1,x2,y2){
			if(x1===x2){
				//y軸に垂直
				return {
					a:1,
					b:0,
					c:-x1,
				};
			}else{
				//その他
				var m=(y2-y1)/(x2-x1);	//傾き
				//y=m(x-x1)+y1
				//y=mx-mx1+y1
				//-mx+y+mx1-y1=0
				return {
					a:-m,
					b:1,
					c:m*x1-y1,
				};
			}
		}
		//交点を求める
		function hit(line1,line2){
			//hard
			var det=line1.a*line2.b-line2.a*line1.b;
			if(Math.abs(det)<=0.001){
				//交点が一つに定まらない(det=0)
				return {
					x:null,
					y:null
				};
			}
			var x;
			var y=(line2.a*line1.c-line1.a*line2.c)/det;
			if(Math.abs(line1.a)>0.001){
				//a!=0
				x=-(line1.b*y+line1.c)/line1.a;
			}else{
				//この場合a2!=0
				x=-(line2.b*y+line2.c)/line2.a;
			}
			return {
				x:x,
				y:y,
			};
		}

	}.bind(this));
	event.on("setLink",function(index,from,to){
		var _this=this;
		this.links[from.x+","+from.y+","+to.x+","+to.y]=index;
		//勝利判定
		if(judge(index)){
			//勝った
			this.host.event.emit("end",index);
		}

		//勝利判定
		function judge(index){
			var stones=_this.stones;
			var links=_this.links;
			var flag={};	//"x,y":true(探索済)
			var result=false;
			//探索用方向指示
			var back=[[-2,-1],[-1,-2],[-1,2],[-2,1]];
			var forward=[[1,-2],[2,-1],[2,1],[1,2]];
			if(index===0){
				//1P:上から探索
				for(var x=1;x<setting.fieldx-1;x++){
					if(!flag[x+",0"]){
						//未探索
						explore(index,x,0);
					}
				}
				//全探索終了。下端に到達したかどうか見る
				for(var x=1;x<setting.fieldx-1;x++){
					if(flag[x+","+(setting.fieldy-1)]){
						//あった
						result=true;
						break;
					}
				}
			}else if(index===1){
				//2P:左から探索
				for(var y=1;y<setting.fieldy-1;y++){
					if(!flag["0,"+y]){
						//未探索
						explore(index,0,y);
					}
				}
				for(var y=1;y<setting.fieldy-1;y++){
					if(flag[(setting.fieldx-1)+","+y]){
						//あった
						result=true;
						break;
					}
				}
			}
			return result;
			//探索
			function explore(index,x,y){
				flag[x+","+y]=true;	//探索済
				for(var i=0;i<4;i++){
					var nx=x+back[i][0], ny=y+back[i][1];
					//リンクを探す
					var ln=links[nx+","+ny+","+x+","+y];
					if(ln===index){
						//あった
						if(!flag[nx+","+ny]){
							//未探索だ
							flag[nx+","+ny]=true;
							explore(index,nx,ny);
						}
					}
				}
				for(var i=0;i<4;i++){
					var nx=x+forward[i][0], ny=y+forward[i][1];
					//リンクを探す
					var ln=links[x+","+y+","+nx+","+ny];
					if(ln===index){
						//あった
						if(!flag[nx+","+ny]){
							//未探索だ
							flag[nx+","+ny]=true;
							explore(index,nx,ny);
						}
					}
				}
			}
		}
	}.bind(this));
	event.on("elimLink",function(index,from,to){
		delete this.links[from.x+","+from.y+","+to.x+","+to.y];
	}.bind(this));
	//パイルール適用
	event.on("pierule",function(index){
		for(var key in this.stones){
			this.stones[key]=index;
			break;
		}
	}.bind(this));
};
Board.prototype.renderInit=function(view){
	//盤面を初期化する
	var _this=this;
	var store=view.getStore();
	var s=svg("svg",function(s){
		s.width.baseVal.valueAsString=setting.pointDistance*(setting.fieldx+1)+"px";
		s.height.baseVal.valueAsString=setting.pointDistance*(setting.fieldx+1)+"px";
		//背景
		s.appendChild(svg("g",function(g){
			g.appendChild(svg("rect",function(rect){
				rect.width.baseVal.valueAsString="100%";
				rect.height.baseVal.valueAsString="100%";
				//why not fill property
				rect.setAttribute("fill",setting.backgroundColor);
			}));
			//背景の模様
			//[x1,y1,x2,y2]
			[
			 [1,1,setting.fieldx-1,setting.fieldy/2],[1,setting.fieldy-2,setting.fieldx-1,setting.fieldy/2-1],
			 [setting.fieldx-2,1,0,setting.fieldy/2],[setting.fieldx-2,setting.fieldy-2,0,setting.fieldy/2-1],
			 [1,1,setting.fieldx/2,setting.fieldy-1],[setting.fieldx-2,1,setting.fieldx/2-1,setting.fieldy-1],
			 [setting.fieldx/2,0,1,setting.fieldy-2],[setting.fieldx/2-1,0,setting.fieldx-2,setting.fieldy-2],
			].forEach(function(arr){
				g.appendChild(svg("line",function(line){
					line.x1.baseVal.valueAsString=(arr[0]+1)*setting.pointDistance+"px";
					line.y1.baseVal.valueAsString=(arr[1]+1)*setting.pointDistance+"px";
					line.x2.baseVal.valueAsString=(arr[2]+1)*setting.pointDistance+"px";
					line.y2.baseVal.valueAsString=(arr[3]+1)*setting.pointDistance+"px";
					line.setAttribute("stroke",setting.bglineColor);
					line.setAttribute("stroke-width","1px");
				}));
			});
		}));
		//点のg
		s.appendChild(svg("g",function(g){
			g.id="points";
			var stones=_this.stones;
			//点をつけていく
			for(var x=0;x<setting.fieldx;x++){
				for(var y=0;y<setting.fieldy;y++){
					if(x===0 && y===0 ||
					   x===0 && y===setting.fieldy-1 ||
					   x===setting.fieldx-1 && y===0 ||
					   x===setting.fieldx-1 && y===setting.fieldy-1){
						   //角はいらない
						   continue;
					}
					//描画用
					g.appendChild(svg("circle",function(c){
						c.cx.baseVal.valueAsString=(x+1)*setting.pointDistance+"px";
						c.cy.baseVal.valueAsString=(y+1)*setting.pointDistance+"px";
						if(stones[x+","+y]){
							//既に石が置いてある
							c.r.baseVal.valueAsString=setting.stoneRadius+"px";
							c.setAttribute("fill",setting.color[stones[x+","+y]]);
						}else{
							//まだ
							c.r.baseVal.valueAsString=setting.pointRadius+"px";
							c.setAttribute("fill",setting.pointColor);
						}
						//パラメータ
						c.setAttributeNS(twixtNamespace,"x",String(x));
						c.setAttributeNS(twixtNamespace,"y",String(y));
						//ストアに保存
						store["point_"+x+","+y]=c;
					}));
					//上に透明な円（判定用）を重ねる
					g.appendChild(svg("circle",function(c){
						c.cx.baseVal.valueAsString=(x+1)*setting.pointDistance+"px";
						c.cy.baseVal.valueAsString=(y+1)*setting.pointDistance+"px";
						c.r.baseVal.valueAsString=setting.pointClickRadius+"px";
						c.setAttribute("fill","transparent");
						c.className.baseVal="cover";
						//パラメータ
						c.setAttributeNS(twixtNamespace,"x",String(x));
						c.setAttributeNS(twixtNamespace,"y",String(y));
					}));
				}
			}
			//マウス選択時にかぶせるやつを作っておく
			store.mouseover=svg("circle",function(c){
				c.r.baseVal.valueAsString=setting.pointClickRadius+"px";
				c.setAttribute("fill",setting.selectPointColor);
				c.setAttribute("fill-opacity","0.4");
				c.className.baseVal="cover";
			});
			//リンク用
			store.linkStart=svg("circle",function(c){
				c.r.baseVal.valueAsString=setting.pointClickRadius+"px";
				c.setAttribute("fill",setting.holdedPointColor);
				c.setAttribute("fill-opacity","0.4");
				c.className.baseVal="cover";
			});
			//マウスによる選択
			g.addEventListener("mouseover",function(e){
				var t=e.target;
				var c=store.mouseover;
				if(t.tagName==="circle" && t.className.baseVal==="cover" && t!==c){
					//選択
					//マウスオーバーのやつをここへ
					var x=t.getAttributeNS(twixtNamespace,"x")-0;
					var y=t.getAttributeNS(twixtNamespace,"y")-0;
					c.cx.baseVal.valueAsString=(x+1)*setting.pointDistance+"px";
					c.cy.baseVal.valueAsString=(y+1)*setting.pointDistance+"px";
					c.setAttributeNS(twixtNamespace,"x",String(x));
					c.setAttributeNS(twixtNamespace,"y",String(y));
					g.appendChild(c);
				}
			},false);
			//イベント
			//リンク準備
			var linkTarget=null;	//{x:..., y:...}
			g.addEventListener("click",function(e){
				var t=e.target;
				if(t.tagName==="circle" && t.className.baseVal==="cover"){
					//点を選択
					var x=t.getAttributeNS(twixtNamespace,"x")-0;
					var y=t.getAttributeNS(twixtNamespace,"y")-0;
					//石状況をチェック
					var st=this.stones[x+","+y];
					if(st==null){
						//まだ石が置かれていない
						game.user.event.emit("tap",x,y);
					}else{
						//自分の色かチェック
						var ul=this.host.userlist;
						if(game.user===ul.users[st].user && this.host.state===TwixtHost.STATE_PLAYING && ul.turn===st){
							//自分の色だ! リンク置く準備
							var c=store.linkStart;
							if(linkTarget){
								//既に選択済み
								if(linkTarget.x===x && linkTarget.y===y){
									//取り消し
								}else{
									//2点を定めた。2乗距離を計算
									var d2=Math.pow(x-linkTarget.x,2)+Math.pow(y-linkTarget.y,2);
									if(d2===5){
										//桂馬の位置
										game.user.event.emit("link",linkTarget,{
											x:x,y:y
										});
									}
								}
								c.parentNode.removeChild(c);
								linkTarget=null;
							}else{
								c.cx.baseVal.valueAsString=(x+1)*setting.pointDistance+"px";
								c.cy.baseVal.valueAsString=(y+1)*setting.pointDistance+"px";
								c.setAttributeNS(twixtNamespace,"x",String(x));
								c.setAttributeNS(twixtNamespace,"y",String(y));
								g.appendChild(c);
								linkTarget={
									x:x,
									y:y,
								};
							}
						}
					}
				}
			}.bind(_this),false);
			//本当はrenderでやるべきだけど・・・石がおかれたら書き換え
			_this.event.on("setStone",function(index,x,y){
				var id=_this.stones[x+","+y] || index;	//どっち?
				var c=store["point_"+x+","+y];

				c.r.baseVal.valueAsString=setting.stoneRadius+"px";
				c.setAttribute("fill",setting.color[id]);
			});
			_this.event.on("pierule",function(index){
				for(var key in _this.stones){
					//a----
					var c=store["point_"+key];
					c.setAttribute("fill",setting.color[index]);
					break;
				}
			});
		}));
		//ゴールライン的な
		s.appendChild(svg("g",function(g){
			g.id="lines";
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=1.5*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=(setting.fieldx-1)*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=1.5*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color[0]);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=(setting.fieldy-0.5)*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=(setting.fieldx-1)*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-0.5)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color[0]);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=1.5*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=1.5*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-1)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color[1]);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=(setting.fieldx-0.5)*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=(setting.fieldx-0.5)*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-1)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color[1]);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
		}));
		//リンク
		s.appendChild(svg("g",function(g){
			for(var key in _this.links){
				var arr=key.split(",").map(function(x){return x-0;});
				newLink(_this.links[key],{
					x:arr[0],y:arr[1],
				},{
					x:arr[2],y:arr[3],
				});
			}
			//リンクが置かれたら書き換え
			g.id="links";
			_this.event.on("setLink",function(index,from,to){
				//リンク（線）
				newLink(index,from,to);
			});
			//外されたらけす
			_this.event.on("elimLink",function(index,from,to){
				var linkaddr="link_"+from.x+","+from.y+","+to.x+","+to.y;
				var link=store[linkaddr];
				delete store[linkaddr];
				link.parentNode.removeChild(link);
			});
			function newLink(index,from,to){
				var line=svg("line",function(line){
					line.x1.baseVal.valueAsString=(from.x+1)*setting.pointDistance+"px";
					line.y1.baseVal.valueAsString=(from.y+1)*setting.pointDistance+"px";
					line.x2.baseVal.valueAsString=(to.x+1)*setting.pointDistance+"px";
					line.y2.baseVal.valueAsString=(to.y+1)*setting.pointDistance+"px";
					//色
					line.setAttribute("stroke",setting.color[index]);
					line.setAttribute("stroke-width",setting.linkWidth+"px");
					line.setAttribute("stroke-linecap","butt");
				});
				store["link_"+from.x+","+from.y+","+to.x+","+to.y]=line;
				g.appendChild(line);
			}
		}));
	});
	//スタイル設定
	var store=view.getStore();
	store.svg=s;
	//ラッパ
	var div=document.createElement("div");
	div.style.display="inline-block";
	div.style.verticalAlign="top";
	div.appendChild(s);
	return div;

};
Board.prototype.render=function(view){
	var div=view.getItem();
};
function UserList(game,event,param){
	this.users=[];	//UserBox[]
	this.host=param.host;	//TwixtHost
	this.turncount=0;	//ターンカウント
	this.turn=null;	//ターンプレイヤーの番号
	this.put=null;	//すでに石をおいたかどうか
}
UserList.prototype.init=function(game,event,param){
	event.on("entry",function(user){
		//ユーザーが追加された
		var box=game.add(UserBox,{
			list:this,
			user:user,
			index:this.users.length,
		});
		event.emit("addUserBox",box);
		//ユーザーがいなくなったとき
		user.event.on("disconnect",function(){
			event.emit("bye",user);
		});
	}.bind(this));
	event.on("addUserBox",function(box){
		this.users.push(box);
	}.bind(this));
	event.on("bye",function(user){
		//ユーザーがいなくなった
		this.users=this.users.filter(function(box){return box.user!==user});
		if(this.users.length===0){
			//そして誰もいなくなった
			var board=game.add(Board,{
				host:this.host,
			});
			this.host.event.emit("init",board,this);
		}
	}.bind(this));
	//UserBoxのひとが名前を決定した
	event.on("ready",function(box){
		if(this.users.length===setting.playerNumber && this.users.every(function(box){
			return box.state===UserBox.STATE_PREPARING && box.name!=null;
		})){
			//全員準備OK
			this.users.forEach(function(box,i){
				//ターンプレイヤーを設定
				box.event.emit("state", i===0 ? UserBox.STATE_TURNPLAYER : UserBox.STATE_WAITING);
			});
			//ターン順番を決定
			this.turn=0;
			this.put=false;
			this.host.event.emit("state",TwixtHost.STATE_PLAYING);
		}
	}.bind(this));
	//ユーザーが石を置いた
	event.on("putComplete",function(index){
		this.put=true;
	}.bind(this));
	//新しいターン
	event.on("setTurn",function(turn){
		this.put=false;
		this.turn=turn;
		this.turncount++;
	}.bind(this));
};
UserList.prototype.renderInit=function(view){
	var div=document.createElement("div");
	div.style.display="inline-block";
	div.style.verticalAlign="top";
	return div;
};
UserList.prototype.render=function(view){
	var div=view.getItem();
	//boxを描画
	//全部消去
	var range=document.createRange();
	range.selectNodeContents(div);
	range.deleteContents();
	range.detach();

	this.users.forEach(function(box){
		div.appendChild(view.render(box));
	});
};
function UserBox(game,event,param){
	this.index=param.index||0;
	this.user=param.user;
	//ユーザー情報
	this.list=param.list;	//UserList
	this.name=null;
	this.state=UserBox.STATE_PREPARING;
	//勝ってるか?
	this.result=null;
}
UserBox.STATE_PREPARING=1;
UserBox.STATE_TURNPLAYER=2;
UserBox.STATE_WAITING=3;
UserBox.STATE_WINNER=4;
UserBox.STATE_LOSER=5;
UserBox.prototype.init=function(game,event,param){
	//ユーザー名
	event.on("setName",function(name){
		this.name=name;
		//親に伝える
		this.list.event.emit("ready",this);
	}.bind(this));
	if(this.state===UserBox.STATE_PREPARING && this.name==null){
		//まだ名前が決まっていない（初期状態）
		this.user.event.once("setName",function(name){
			event.emit("setName",name);
		}.bind(this));
	}
	//状態変化
	event.on("state",function(state){
		this.state=state;
	}.bind(this));

};
UserBox.prototype.renderInit=function(view){
	var div=document.createElement("div");
	//スタイル
	div.style.backgroundColor=setting.lightColor[this.index];
	var store=view.getStore();
	//名前欄
	store.name=document.createElement("p");
	div.appendChild(store.name);
	//状態欄
	store.state=document.createElement("p");
	div.appendChild(store.state);
	//コマンド欄
	store.command=document.createElement("p");
	div.appendChild(store.command);
	return div;
};
UserBox.prototype.render=function(view){
	var div=view.getItem();
	var store=view.getStore();
	if(this.state===UserBox.STATE_PREPARING){
		//準備中
		store.state.textContent="準備中";
		store.command.textContent="";
		if(this.name==null){
			//名前が未決定だ!
			if(this.user.internal){
				store.name.textContent="";
				var input=document.createElement("input");
				input.type="text";
				input.size=30;
				input.required=true;
				input.placeholder="名前を入力";
				store.name.appendChild(input);
				//決定
				input=document.createElement("input");
				input.type="button";
				input.value="決定";
				input.addEventListener("click",function(e){
					//名前を決定した
					var nameinput=store.name.getElementsByTagName("input").item(0);
					if(!nameinput.value)return;
					this.user.event.emit("setName",nameinput.value);
				}.bind(this),false);
				store.name.appendChild(input);
			}else{
				//待っている
				store.name.textContent="名前入力中";
			}
		}else{
			store.name.textContent=this.name;
		}
	}else{
		store.name.textContent=this.name;
		var st;
		switch(this.state){
			case UserBox.STATE_TURNPLAYER:
				st="ターンプレイヤー";
				break;
			case UserBox.STATE_WAITING:
				st="待機中";
				break;
			case UserBox.STATE_WINNER:
				st="勝ち";
				break;
			case UserBox.STATE_LOSER:
				st="負け";
				break;
		}
		store.state.textContent=st;
		store.command.textContent="";
		if(this.state===UserBox.STATE_TURNPLAYER && this.user.internal){
			//パイルール適用できる
			if(this.list.turncount===1){
				store.command.appendChild(function(_this){
					var input=document.createElement("input");
					input.type="button";
					input.value="パイルール適用";
					input.addEventListener("click",function(e){
						_this.user.event.emit("pierule");
					},false);
					return input;
				}(this));
			}
			//ターンを回す
			store.command.appendChild(function(_this){
				var input=document.createElement("input");
				input.type="button";
				input.value="ターン終了";
				input.addEventListener("click",function(e){
					_this.user.event.emit("turnend");
				},false);
				return input;
			}(this));
		}
	}
};

//svgノード(view用)
function svg(name,callback){
	var node=document.createElementNS("http://www.w3.org/2000/svg",name);
	if(callback){
		callback(node);
	}
	return node;
}
