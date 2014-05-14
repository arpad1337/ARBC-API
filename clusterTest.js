var db = require('./db').init();

var ip = require('./image-processing').init();

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

var checkVectorDistances = function(tolerance, from, to) {
	var maxDist = 0, avg = 0;
	var dist = 0,
		a = 0,
		b = 0,
		sA = 0,
		sB = 0,
		dA = 0,
		dB = 0;
	for (var i = 0; i < from.length; i++) {
		sA += from[i].a;
		dA += to[i].a;
		sB += from[i].b;
		dB += to[i].b;
		a = (from[i].a - to[i].a) * (from[i].a - to[i].a);
		b = (from[i].b - to[i].b) * (from[i].b - to[i].b);
		dist = Math.sqrt(a + b);
		avg += dist;
		if(dist > maxDist) {maxDist = dist;}
	}
	//console.log("Max:" + maxDist);
	//console.log("Avg: " + avg / 6);
	sA = sA / from.length;
	sB = sB / from.length;
	dA = dA / from.length;
	dB = dB / from.length;

	dist2 = Math.sqrt(
			(sA - dA) * (sA - dA) +
			(sB - dB) * (sB - dB)
		);

	console.log("centroid:" + dist2);
	return maxDist > tolerance;
};

var tolerance = 78;

var onResult = function(err, result) {
	var b;
	for (b in db.data.books) {
		console.log("Book: " + b);
		if (checkVectorDistances(tolerance, result.clustervector, db.data.books[b].clustervector)) {
			console.log(b + ": true");
		}
	}
};

var i = process.argv[2];

console.log(testImages[i]);
ip.clusterImage(testImages[i].path, onResult);
