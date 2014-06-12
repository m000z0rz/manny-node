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
			self._plm.on('command:AllLinkingCompleted', function(command) {
				// command should have:
				// linkType
				// allLinkGroup (7)
				// id
				// deviceCategory(Id) (Dimmable Lighting Control)
				// deviceSubactegory(Id) (SwitchLinc Dimmer)
				// firwmareVersion

			});

			resolve();
		});
	});
};

InsteonService.prototype.toggle = function(context) {
	var self = this;

	return self._plm.getLightLevel(context.insteonAddress).then(function(lightLevel) {
		return self._plm.setLightLevel(context.insteonAddress, !lightLevel);
	});
};

InsteonService.prototype.turnOn = function(context) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	return self._plm.setLightLevel(insteonAddress, 0xFF);
};

InsteonService.prototype.turnOff = function(context) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	return self._plm.setLightLevel(insteonAddress, 0x00);
};

InsteonService.prototype.setDimmer = function(context) {
	var self = this;
	var insteonAddress = context.insteonAddress;

	return self._plm.setLightLevel(insteonAddress, context.lightLevel);
};

InsteonService.prototype.startAllLinking = function(context) {
	var self = this;
	
	return self._plm.startAllLinking();
};

InsteonService.prototype.cancelAllLinking = function(context) {
	console.log('in service cancel function');
	var self = this;

	return self._plm.cancelAllLinking();
};


