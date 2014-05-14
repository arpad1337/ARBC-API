var db = require('./db').init();

var ip = require('./image-processing').init();
var levenshtein = require('levenshtein');

var testImages = [{
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1132.JPG",
	validId: 2
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1133.JPG",
	validId: 3
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1134.JPG",
	validId: 1
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1135.JPG",
	validId: 8
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1136.JPG",
	validId: 4
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1137.JPG",
	validId: 7
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/test-images/IMG_1168.jpg",
	validId: 6
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1140.JPG",
	validId: 5
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1213.jpg",
	validId: 11
}, {
	path: "/var/www/arbc.arpi.im/image-processing/arbc/old_test-images/IMG_1220.jpg",
	validId: 14
}];

var tolerance = 3;

checkKeywords = function(keywords, corpus, books) {
	var documents = {};
	var bookCount = Object.keys(books).length;
	var length, idf, tf, i, k, c, d, stopWord = [];
	for (i in keywords) {
		k = keywords[i];
		for (c in corpus) {
			if (new levenshtein(c, k).distance < tolerance && stopWord.indexOf(c) == -1) {
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

var onResult = function(err, result) {
	var documents = checkKeywords(result.keywords, db.data.keywords, db.data.books);

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
		console.log("ID: " + maxId);
		console.log(documents[maxId]);
		console.log(db.data.books[maxId]);
	} else {
		console.error("not found.");
	}
};

var i = process.argv[2];

console.log(testImages[i]);
ip.clusterImage(testImages[i].path, onResult);