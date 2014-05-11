/*
 * routes
 */
var levenshtein = require('levenshtein');
var db = require('../db').init();
var ip = require('../image-processing').init();
var fs = require('fs.extra');
var path = require('path');

module.exports = (function() {
	_checkVectorDistances = function(tolerance, from, to) {
		var dist = 0,
			a = 0,
			b = 0;
		for (var i = 0; i < from.length; i++) {
			a = (from[i].a - to[i].a) * (from[i].a - to[i].a);
			b = (from[i].b - to[i].b) * (from[i].b - to[i].b);
			dist = Math.sqrt(a + b);
			if (dist > tolerance) return false;
		}
		return true;
	};
	_checkKeywords = function(keywords, corpus, books) {
		var documents = {};
		var bookCount = Object.keys(books).length;
		var length, idf, tf, i, k, c, d, stopWord = [];
		for (i in keywords) {
			k = keywords[i];
			for (c in corpus) {
				if (new levenshtein(c, k).distance < 3 && stopWord.indexOf(c) == -1) {
					stopWord.push(c);
					console.log("CHECK: " + k + " to " + c);

					idf = 1 / Math.log(bookCount / corpus[c].count);
					tf = 0.5;
					for (d in corpus[c].books) {
						if (documents[corpus[c].books[d]]) {
							documents[corpus[c].books[d]].keywords.push(c);
							documents[corpus[c].books[d]].score = documents[corpus[c].books[d]].score + idf * (tf + 0.5 * 1 / books[corpus[c].books[d]].keywords.length);
						} else {
							documents[corpus[c].books[d]] = {
								"keywords": [c],
								"score": idf * (tf + 0.5 * 1 / books[corpus[c].books[d]].keywords.length)
							};
						}
					}
				}
			}
		}
		return documents;
	};
	_buildKeywords = function(t, a, p, w) {
		var k = [],
			kw;
		t = t.split(" ");
		t.forEach(function(r) {
			if (r.length >= 3) {
				kw = r.toLowerCase();
				if (k.indexOf(kw) == -1) {
					k.push(kw);
				}
			}
		});
		a = a.split(" ");
		a.forEach(function(r) {
			if (r.length >= 3) {
				kw = r.toLowerCase();
				if (k.indexOf(kw) == -1) {
					k.push(kw);
				}
			}
		});
		p = p.split(" ");
		p.forEach(function(r) {
			if (r.length >= 3) {
				kw = r.toLowerCase();
				if (k.indexOf(kw) == -1) {
					k.push(kw);
				}
			}
		});
		w = w.split(" ");
		w.forEach(function(r) {
			if (r.length >= 3) {
				kw = r.toLowerCase();
				if (k.indexOf(kw) == -1) {
					k.push(kw);
				}
			}
		});
		return k;
	};
	return {
		index: function(req, res) {
			res.sendJSON({
				"heelo": "ojvé"
			});
		},
		recognize: function(req, res) {
			if (!req.files || !req.files.picture) {
				res.sendJSON({
					error: 'there is no file'
				});
				return;
			}

			ip.clusterImage(req.files.picture.path, function(err, result) {
				if (err) {
					console.log(err);
					res.sendJSON({
						error: 'something went wrong'
					});
					return;
				}

				var ids = [], b;

				console.log(result);

				if (result.clustervector) {
					for (b in db.data.books) {
						console.log("Book: " + b);
						if (_checkVectorDistances(78, result.clustervector, db.data.books[b].clustervector)) {
							console.log(b + ": true");
							ids.push(b);
						}
					}
				} else {
					for (b in db.data.books) {
						ids.push(b);
					}
				}

				var keywords = result.keywords;

				ip.recognize(req.files.picture.path, ids, function(err, result) {
					if (err) {
						res.sendJSON({
							error: 'something went wrong 2'
						});
						return;
					}

					if (result !== "null") {
						res.sendJSON({
							success: true,
							data: db.data.books[result]
						});
						return;
					}

					var documents = _checkKeywords(keywords, db.data.keywords, db.data.books);

					var maxScore = 0,
						maxId;

					for (var key in documents) {
						if (documents[key].score > maxScore) {
							maxScore = documents[key].score;
							maxId = key;
						}
					}

					console.log(documents);

					if (maxId) {
						res.sendJSON({
							success: true,
							data: db.data.books[maxId]
						});
						return;
					}
					res.sendJSON({
						success: true,
						data: null
					});
				});
			});
		},
		list: function(req, res) {
			res.sendJSON({
				success: true,
				data: db.data.books
			});
		},
		get: function(req, res) {
			var bookId = req.params.id;
			var data = (db.data.books[bookId]) ? db.data.books[bookId] : null;
			res.sendJSON({
				success: true,
				data: data
			});
		},
		add: function(req, res) {
			if (!req.files || !req.files.cover) {
				res.sendJSON({
					error: 'there is no file'
				});
				return;
			}

			var newImagePath = path.normalize(__dirname + '/../public/images/') + req.files.cover.name;

			fs.move(req.files.cover.path, newImagePath, function(err, result) {
				if (err) {
					res.sendJSON({
						error: 'file exist'
					});
					return;
				}
				var Book = {
					cover: 'images/' + req.files.cover.name,
					title: req.body.title,
					author: req.body.author,
					publisher: req.body.publisher,
					keywords: _buildKeywords(req.body.title, req.body.author, req.body.publisher, req.body.keywords)
				};

				var keywords = db.data.keywords;
				var bookIds;
				var id = db.insert("books", Book);

				var k;

				for (var i in Book.keywords) {
					k = Book.keywords[i];
					if (keywords[k]) {
						bookIds = keywords[k].books;
						bookIds.push(id);
						db.update("keywords", k, {
							count: keywords[k].count + 1,
							books: bookIds
						});
					} else {
						db.insertHash("keywords", k, {
							count: 1,
							books: [id]
						});
					}
				}

				ip.saveNewBookDescriptors(id, Book.cover, function(err, result) {
					if(err){
						fs.unlink(newImagePath);
						db.rollback();
						res.sendJSON({
							error: 'something went wrong 3'
						});
						return;
					}

					delete result.key;

					db.update("books", id, result);
					db.commit();
					res.sendJSON({
						success: true,
						data: Book
					});
				});
			});
		}
	};
})();