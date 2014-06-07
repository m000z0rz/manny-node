module.exports = SerialStream;

var util = require('util');
var stream = require('stream');

function SerialStream(serialPort) {
	stream.Duplex.call(this);
	var self = this;

	this.serialPort = serialPort;

	serialPort.on('data', function(data) {
		self.push(data); // if false, should start buffering data internally and wait until _read to dump it and continue
	});

	serialPort.on('close', function() {
		//this.end();
		self.push(null);
	});
}

util.inherits(SerialStream, stream.Duplex);

SerialStream.prototype._read = function(size) {
	// push queued info and restart sending
};

SerialStream.prototype._write = function(chunk, encoding, callback) {
	this.serialPort.write(chunk);
	callback();
};