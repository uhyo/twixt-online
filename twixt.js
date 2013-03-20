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
	var playerNumber = game.env==="standalone" ? 1 : 2;
	var twixt=game.add(TwixtHost);
	//ユーザーの出現を待つ
	game.event.on("entry",function(user){
		if(twixt.userlist.users.length<playerNumber){
			//参加枠あり
			twixt.event.emit("entry",user);
		}
	});
});
game.start();

//設定
//Global!!!
var setting={
	//点の数
	fieldx:24,
	fieldy:24,
	//描画関係
	backgroundColor:"#cccccc",
	//プレイヤーの色
	color:["#ffffff","#ff0000"],
	lightColor:["#eeeeee","#ffcccc"],
	//点の間隔(px単位)
	pointDistance:24,
	//点の半径
	pointRadius:2,
	//点の色
	pointColor:"#333333",
	//ゴールラインの幅
	goallineWidth:4,
	
};
//定義
function TwixtHost(game,event,param){
	this.board=game.add(Board);
	this.userlist=game.add(UserList);
}
TwixtHost.prototype.init=function(game,event,param){
	//イベント待受
	event.on("entry",function(user){
		//ユーザー出現
		console.log(user);
		//丸投げ
		this.userlist.event.emit("entry",user);
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
}
Board.prototype.init=function(game,event,param){
};
Board.prototype.renderInit=function(view){
	//盤面を初期化する
	var s=svg("svg",function(s){
		s.width.baseVal.valueAsString=setting.pointDistance*(setting.fieldx+1)+"px";
		s.height.baseVal.valueAsString=setting.pointDistance*(setting.fieldx+1)+"px";
		//背景
		s.appendChild(svg("rect",function(rect){
			rect.width.baseVal.valueAsString="100%";
			rect.height.baseVal.valueAsString="100%";
			//why not fill property
			rect.setAttribute("fill",setting.backgroundColor);
		}));
		//点のg
		s.appendChild(svg("g",function(g){
			g.id="points";
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
					var c=svg("circle",function(c){
						c.cx.baseVal.valueAsString=(x+1)*setting.pointDistance+"px";
						c.cy.baseVal.valueAsString=(y+1)*setting.pointDistance+"px";
						c.r.baseVal.valueAsString=setting.pointRadius+"px";
						c.setAttribute("fill",setting.pointColor);
					});
					g.appendChild(c);
				}
			}
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
	return div;

};
Board.prototype.render=function(view){
	var div=view.getItem();
};
function UserList(game,event,param){
	this.users=[];	//UserPanel[]
}
UserList.prototype.init=function(game,event,param){
	event.on("entry",function(user){
		//ユーザーが追加された
		var box=game.add(UserBox,{
			user:user,
			index:this.users.length,
		});
		event.emit("addUserBox",box);
	}.bind(this));
	event.on("addUserBox",function(box){
		this.users.push(box);
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
	this.name=null;
	this.state=UserBox.STATE_PREPARING;
}
UserBox.STATE_PREPARING=1;
UserBox.STATE_TURNPLAYER=2;
UserBox.STATE_WAITING=3;
UserBox.prototype.init=function(game,event,param){
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
	return div;
};
UserBox.prototype.render=function(view){
	var div=view.getItem();
	var store=view.getStore();
	if(this.state===UserBox.STATE_PREPARING){
		//準備中
		store.name.textContent="";
		store.state.textContent="準備中";
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
