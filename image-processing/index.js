var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');


module.exports = (function() {
	_modulePath = __dirname + '../../../image-processing/arbc/';
	_moduleBinary = 'main';
	_swtBinary = 'swt/DetectText';
	_parseClustervector = function(data) {
		var vector = [];
		data = data.replace(/(\n|\[|\]|\ )/gm, "");
		data = data.split(";");
		data.forEach(function(val) {
			var r = val.split(",");
			vector.push({
				a: Number(r[0]),
				b: Number(r[1])
			});
		});
		return vector;
	};
	_performSWT = function(filename, cb) {
		var result = {};
		var command = path.normalize(_modulePath) + _swtBinary + ' ' + filename + ' ' + filename;
		
		console.log(command);

		exec(command, function(error, stdout, stderr) {
			if (error) {
				cb(error);
				return;
			}

			console.log('SWT extraction finished');

			command = path.normalize(_modulePath) + _moduleBinary + ' -ocr ' + filename;
			
			console.log(command);

			exec(command, function(error, stdout, stderr) {
				if (error) {
					cb(error);
					return;
				}

				console.log("Process finished...");

				//fs.unlink(filename);

				var word = "";
				var slices = stdout.split('#BEGIN-KEYWORDS');
				var keywords = (slices[1].split('#END-KEYWORDS'))[0];
				keywords = keywords.replace(/(\r\n|\n|\r|:|,|-)/gm, " ").split(" ");
				result.keywords = [];
				keywords.forEach(function(val) {
					if (val.length >= 3) {
						word = val.toLowerCase();
						if(result.keywords.indexOf(word) == -1) {
							result.keywords.push(word);
						}
					}
				});
				cb(false, result);
			});
		});
	};
	return {
		init: function() {
			return this;
		},
		clusterImage: function(imagePath, cb) {
			var result = {};
			var command = path.normalize(_modulePath) + _moduleBinary + ' -cluster ' + imagePath;
			exec(command, function(error, stdout, stderr) {
				if (error) {
					cb(error);
					return;
				}

				console.log("Process finished...");

				console.log(stdout);

				if(stdout.indexOf('#WARP-UNSUCCESSFUL') == -1) {
					slices = (stdout.split("#BEGIN-CLUSTERVECTOR"))[1];
					var clusterVector = (slices.split("#END-CLUSTERVECTOR"))[0];

					result.clustervector = _parseClustervector(clusterVector);

					slices = (stdout.split("#BEGIN-TO-SWT"))[1];
					var swtfilename = (slices.split("#END-TO-SWT"))[0];

					swtfilename = swtfilename.replace(/(\n|\[|\]|\ )/gm, "");

					_performSWT(swtfilename, function(err, res) {
						if (error) {
							cb(error);
							return;
						}
						result.keywords = res.keywords;
						cb(false, result);
					});
				} else {
					cb(false, result);
				}
			});
		},
		recognize: function(imagePath, ids, cb) {
			var result = {};
			var command = path.normalize(_modulePath) + _moduleBinary + ' -recognize ' + imagePath + ' ' + ids.join(" ");
			
			console.log(command);

			exec(command, function(error, stdout, stderr) {
				if (error) {
					cb(error);
					return;
				}

				console.log("Process finished...");

				console.log(stdout);

				var slices = (stdout.split('#BEGIN-RESULT'))[1];
				var result = (slices.split('#END-RESULT'))[0].trim();
				cb(false, result);
			});
		},
		saveNewBookDescriptors: function(newId, imagePath, cb) {
			var result = {
				key: newId
			};

			imagePath = path.normalize(__dirname + '/../public/') + imagePath;

			var command = path.normalize(_modulePath) + _moduleBinary + ' -store ' + imagePath + " " + newId;

			console.log(command);

			exec(command, function(error, stdout, stderr) {
				if (error) {
					cb(error);
					return;
				}

				console.log("Process finished...");

				console.log(arguments);

				var slices = (stdout.split('#BEGIN-CLUSTERVECTOR'))[1];
				var clusterVector = (slices.split("#END-CLUSTERVECTOR"))[0];
				result.clustervector = _parseClustervector(clusterVector);
				cb(false, result);
			});
		}
	};
})();