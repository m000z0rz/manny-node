module.exports = InsteonId;

function InsteonId(highByte, midByte, lowByte) {
	this.highByte = highByte;
	this.midByte = midByte;
	this.lowByte = lowByte;
}

InsteonId.prototype.asInteger = function() {
	return this.highByte * Math.pow(256, 2) + this.midByte * 256 + this.lowByte;
};
InsteonId.prototype.toString = function() {
	function pad(num, size) {
		var s = num+"";
		while (s.length < size) s = "0" + s;
		return s;
	}
	function toHex(num) {
		return pad(num.toString(16), 2);
	}

	return toHex(this.highByte) + "." + toHex(this.midByte) + "." + toHex(this.lowByte);
};
InsteonId.fromInteger = function(integer) {


	var lowByte = integer % 256;
	var midByte = ((integer - lowByte) % Math.pow(256, 2)) / 256;
	var highByte = (integer - lowByte - midByte * 256) / Math.pow(256, 2);
	return new InsteonId(highByte, midByte, lowByte);
};
InsteonId.fromString = function(string) {
	var pieces = string.split('.');
	console.log('try parse, length ' + pieces.length);
	if(pieces.length !== 3) return;

	var highByte = parseInt(pieces[0], 16);
	var midByte = parseInt(pieces[1], 16);
	var lowByte = parseInt(pieces[2], 16);
	return new InsteonId(highByte, midByte, lowByte);
};
InsteonId.prototype.equals = function(otherId) {
	return (this.highByte === otherId.highByte && this.midByte === otherId.midByte && this.lowByte === otherId.lowByte);
}