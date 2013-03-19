var uhyoooooo=require('uhyoooooo'), http=require('http'), express=require('express');
//HTTP server
var srv=express();

srv.get("/",function(req,res){
	res.sendfile("client.html");
});

var http_wrap=http.createServer(srv);
//uhyoooooo app
var app=uhyoooooo.createServer(http_wrap);
http_wrap.listen(8080);

app.init(["twixt.js"],{
	title:"twixt online",
});
