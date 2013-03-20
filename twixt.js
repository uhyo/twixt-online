var game=new Game();

//ゲーム開始
game.init(Game.ClientDOMView,function(){
	return {
		root:document.body,
	};
});
game.event.on("gamestart",function(){
	var board=game.add(Board);
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
	color1p:"#ffffff",
	color2p:"#ff0000",
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

				line.setAttribute("stroke",setting.color1p);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=(setting.fieldy-0.5)*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=(setting.fieldx-1)*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-0.5)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color1p);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=1.5*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=1.5*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-1)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color2p);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
			g.appendChild(svg("line",function(line){
				line.x1.baseVal.valueAsString=(setting.fieldx-0.5)*setting.pointDistance+"px";
				line.y1.baseVal.valueAsString=2*setting.pointDistance+"px";
				line.x2.baseVal.valueAsString=(setting.fieldx-0.5)*setting.pointDistance+"px";
				line.y2.baseVal.valueAsString=(setting.fieldy-1)*setting.pointDistance+"px";

				line.setAttribute("stroke",setting.color2p);
				line.setAttribute("stroke-width",setting.goallineWidth+"px");
				line.setAttribute("stroke-linecap","square");
			}));
		}));
	});
	return s;

};
Board.prototype.render=function(view){
	console.log(view.getItem());
};
Board.prototype.renderTop=true;

//svgノード(view用)
function svg(name,callback){
	var node=document.createElementNS("http://www.w3.org/2000/svg",name);
	if(callback){
		callback(node);
	}
	return node;
}
