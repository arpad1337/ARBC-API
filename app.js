
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var db = require('./db').init();

var app = express();

// all environments
app.set('port', process.env.NODE_PORT || 8120);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(require('connect-multiparty')({
    uploadDir: '/tmp'
}));

app.use(function(req, res, next){
	if(req.query.refresh) {
		console.log("Refreshing db...");
		db.init();
	}
	res.sendJSON = function(content){
		this.set({ 'content-type': 'application/json; charset=utf-8' });
		this.end(JSON.stringify(content));
	};
	next();
});

app.use(app.router);

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/books', routes.list);
app.get('/books/:id(\\d+)$', routes.get);
app.post('/books/recognize', routes.recognize);
app.post('/books', routes.add);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Server listening on port ' + app.get('port'));
});
