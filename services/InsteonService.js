module.exports = InsteonService;

var insteon = require('../insteon');
var serialport = require('../node_modules/serialport');
var serialStream = require('../serial-stream.js');

var Promise = require('../node_modules/es6-promise').Promise;

// Insteon Service ///////////////////////////////
//var nestConfig = config.services.find(function(service) { return service.type === "nest"; });
function InsteonService (nodeContext, config) {
	//var _serialport = require('serialport');
	//var _serialStream = require('./serial-stream.js');

	var self = this;

	//self._insteon = _insteon;
	//self._serialport = _serialport;
	//self._serialStream = _serialStream;

	self.config = config;

};

InsteonService.prototype.type = 'devices-insteon';

InsteonService.prototype.initialize = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		var plmPort = new serialport.SerialPort(self.config.port, {
			baudrate: 19200,
			dataBits: 8,
			parity: 'none',
			stopBits: 1
		}, false); // don't open immediately

		plmPort.open(function() {
			//console.log('insteon plm port opened');
			var plmStream = new serialStream(plmPort);

			var connectOptions = self.config.connectOptions;
			connectOptions.serialStream = plmStream;

			self._plm = insteon.connect(connectOptions);

			resolve();
		});
	});
};

InsteonService.prototype.toggle = function(context, callback) {
	var self = this;

	self._plm.getLightLevel(context.insteonAddress)
	.then(function(lightLevel) {
		return self._plm.setLightLevel(context.insteonAddress, !lightLevel);
	})
	.then(callback)
	.catch(callback);
};

InsteonService.prototype.turnOn = function(context, callback) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	self._plm.setLightLevel(insteonAddress, 0xFF)
	.then(callback)
	.catch(callback);
};

InsteonService.prototype.turnOff = function(context, callback) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	self._plm.setLightLevel(insteonAddress, 0x00)
	.then(callback)
	.catch(callback);
};

InsteonService.prototype.setDimmer = function(context, callback) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	self._plm.setLightLevel(insteonAddress, context.lightLevel)
	.then(callback)
	.catch(callback);
};

InsteonService.prototype.startAllLinking = function(context, callback) {
	var self = this;
	self._plm.startAllLinking()
	.then(callback)
	.catch(callback);
};

InsteonService.prototype.cancelAllLinking = function(context, callback) {
	console.log('in service cancel function');
	var self = this;
	self._plm.cancelAllLinking()
	.then(callback)
	.catch(function(err) {
		console.log('cancelALlLinking err: ', err);
		callback(err);
	});
};


