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
	//ゴールラインの幅
	goallineWidth:4,
	
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
		user.event.on("turnend",function(){
			//ターン終了する
			var ul=_this.userlist;
			var tu=ul.users[ul.turn];
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
	}.bind(this));
	//状態変化
	event.on("state",function(state){
		this.state=state;
	}.bind(this));
};
TwixtHost.prototype.renderTop=true;
TwixtHost.prototype.renderInit=function(view){
	var div=document.createElement("div");
	//ボード
	div.appendChild(view.render(this.board));
	//ユーザー一覧
	div.appendChild(view.render(this.userlist));
	return div;
};
TwixtHost.prototype.render=function(view){
	var div=view.getItem();
};
function Board(game,event,param){
	this.stones={};	//"x,y":index
	this.host=param.host;	//TwixtHost
}
Board.prototype.init=function(game,event,param){
	//index番のユーザーが石を置く
	event.on("putStone",function(index,x,y){
		if(this.stones[x+","+y]==null){
			//まだない!置ける
			this.stones[x+","+y]=index;
			//置いた通知
			this.host.userlist.event.emit("putComplete",index);
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
						c.setAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","x",String(x));
						c.setAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","y",String(y));
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
						c.setAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","x",String(x));
						c.setAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","y",String(y));
					}));
				}
			}
			//マウスによる選択
			var selectedCircle=null;
			g.addEventListener("mouseover",function(e){
				var t=e.target;
				if(selectedCircle && selectedCircle!==t){
					selectedCircle.setAttribute("fill","transparent");	//戻す
					t.removeAttribute("fill-opacity");
				}
				if(t.tagName==="circle" && t.className.baseVal==="cover"){
					//選択
					t.setAttribute("fill",setting.selectPointColor);
					t.setAttribute("fill-opacity","0.4");
					selectedCircle=t;
				}else{
					selectedCircle=null;
				}
			},false);
			//本当はrenderでやるべきだけど・・・石がおかれたら書き換え
			_this.event.on("putStone",function(index,x,y){
				var id=_this.stones[x+","+y] || index;	//どっち?
				var c=store["point_"+x+","+y];

				c.r.baseVal.valueAsString=setting.stoneRadius+"px";
				c.setAttribute("fill",setting.color[id]);
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
	});
	//スタイル設定
	var store=view.getStore();
	store.svg=s;
	//ラッパ
	var div=document.createElement("div");
	div.style.display="inline-block";
	div.style.verticalAlign="top";
	div.appendChild(s);
	//イベント
	s.addEventListener("click",function(e){
		var t=e.target;
		if(t.tagName==="circle" && t.className.baseVal==="cover"){
			//点を選択
			var x=t.getAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","x")-0;
			var y=t.getAttributeNS("http://uhyohyohyo.sakura.ne.jp/namespace/twixt","y")-0;
			game.user.event.emit("tap",x,y);
		}
	},false);
	return div;

};
Board.prototype.render=function(view){
	var div=view.getItem();
};
function UserList(game,event,param){
	this.users=[];	//UserBox[]
	this.host=param.host;	//TwixtHost
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
	});
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
}
UserBox.STATE_PREPARING=1;
UserBox.STATE_TURNPLAYER=2;
UserBox.STATE_WAITING=3;
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
		store.state.textContent= this.state===UserBox.STATE_TURNPLAYER ? "ターンプレイヤー" : "待機中";
		store.command.textContent="";
		if(this.state===UserBox.STATE_TURNPLAYER && this.user.internal){
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
