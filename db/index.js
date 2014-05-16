var fs = require('fs');

module.exports = (function() {
	//_file = __dirname + "/data.json";
	_file = __dirname + "/data.json";
	_data = [];
	_lastChanges = [];
	return {
		init: function() {
			if (_data.length) return this;

			_data = JSON.parse(fs.readFileSync(_file, {
				encoding: 'utf8'
			}));
			this.__defineGetter__('data', function() {
				return _data.data;
			});
			return this;
		},
		insert: function(dataSet, object) {
			var id = this.nextId(dataSet);
			var key = String(id);
			_data.sequences[dataSet + '_seq'] = id + 1;
			_data.data[dataSet][key] = object;
			_lastChanges.push(_data.data[dataSet][key]);
			return key;
		},
		insertHash: function(dataSet, key, object) {
			_data.data[dataSet][key] = object;
			_lastChanges.push(_data.data[dataSet][key]);
			return key;
		},
		update: function(dataSet, key, fields) {
			if (typeof(fields) == "object") {
				for (var k in fields) {
					_data.data[dataSet][key][k] = fields[k];
					_lastChanges.push(_data.data[dataSet][key][k]);
				}
			} else {
				_data.data[dataSet][key] = fields;
				_lastChanges.push(_data.data[dataSet][key]);
			}
		},
		nextId: function(dataSet) {
			return _data.sequences[dataSet + '_seq'];
		},
		commit: function() {
			fs.writeFile(_file, JSON.stringify(_data), 'utf8');
			_lastChanges = [];
		},
		rollback: function() {
			for (var e in _lastChanges) {
				delete _lastChanges[e];
			}
		}
	};
})();