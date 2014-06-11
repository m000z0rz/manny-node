module.exports = BenQProjectorService;


//var onkyo = require('eiscp');
var serialport = require('../node_modules/serialport');
var serialStream = require('../serial-stream.js');
var util = require('util');
var stream = require('stream');
var Promise = require('../node_modules/es6-promise').Promise;











function makeTimeoutPromise(promiseFunction, timeoutMs, timeoutErr) {
	//console.log('calling makeTimeoutPromise');
	return new Promise(function(resolve, reject) {

		var timeout = new Promise(function(timeoutResolve, timeoutReject) {
			//console.log('making timeout w ', timeoutMs, timeoutErr, timeoutReject);
			setTimeout(timeoutReject, timeoutMs, timeoutErr || new Error('timeout'));
		});

		Promise.race([new Promise(promiseFunction), timeout]).then(function(response) {
			//console.log('race resolve', response);
			resolve(response);
		}).catch(function(err) {
			//console.log('race err ', err);
			reject(err);
		});
	});
}












function ProjectorCommand(property, value) {
	var self = this;

	// because i don't want to deal with very careful tracking of each individual character
	//    echoed back from the projector, i'll only send commands in (which then get echoed in) lower case.
	//    the projector's responses are in upper case, so we can tell them apart
	if(property.toUpperCase() === property) self.fromProjector = true;
	else self.fromProjector = false;

	self.property = self._toHumanProperty(property);
	self.propertyValue = self._toHumanValue(self.property, value);
}

BenQProjectorService.ProjectorCommand = ProjectorCommand;

ProjectorCommand.prototype.toString = function() {
	var self = this;

	return '\r\r*' + self._toProjectorProperty(self.property) + '=' + self._toProjectorValue(self.property, self.propertyValue) + '#\r';
};

ProjectorCommand.prototype.equals = function(otherCommand) {
	var self = this;
	return (self.property === otherCommand.property && self.propertyValue === otherCommand.propertyValue);
};





ProjectorCommand.prototype._toHumanProperty = function(property) {
	var self = this;

	property = property.toLowerCase();
	if(self.humanToProjectorProperty[property]) return property;
	else if(self.projectorToHumanProperty[property]) return self.projectorToHumanProperty[property];
	else return;
};

ProjectorCommand.prototype._toProjectorProperty = function(property) {
	var self = this;

	property = property.toLowerCase();
	if(self.projectorToHumanProperty[property]) return property;
	else if(self.humanToProjectorProperty[property]) return self.humanToProjectorProperty[property];
	else return;
};

ProjectorCommand.prototype._toHumanValue = function(property, value) {
	var self = this;

	if(value === '?') return value;

	pProp = self._toProjectorProperty(property);
	hProp = self._toHumanProperty(property);

	var value = value.toLowerCase();


	var htopMap = self.humanToProjectorValue[hProp]
	var ptohMap = self.projectorToHumanValue[pProp];

	if(!htopMap) return;
	if(htopMap[value]) return value;
	else if(ptohMap[value]) return ptohMap[value];
	else return;
};

ProjectorCommand.prototype._toProjectorValue = function(property, value) {
	var self = this;

	if(value === '?') return value;

	pProp = self._toProjectorProperty(property);
	hProp = self._toHumanProperty(property);

	var value = value.toLowerCase();


	var htopMap = self.humanToProjectorValue[hProp]
	var ptohMap = self.projectorToHumanValue[pProp];

	if(!htopMap) return;
	if(htopMap[value]) return htopMap[value];
	else if(ptohMap[value]) return value;
	else return;
};

ProjectorCommand.prototype.humanToProjectorProperty = {
	'source': 'sour',
	'power': 'pow',
	'aspect': 'asp'
};

ProjectorCommand.prototype.projectorToHumanProperty = {
	'sour': 'source',
	'pow': 'power',
	'asp': 'aspect'
};

ProjectorCommand.prototype.humanToProjectorValue = {
	'source': {
		'pc': 'rgb',
		'computer': 'rgb',
		'vga': 'rgb',
		'hdmi': 'hdmi'
	},
	'power': {
		'on': 'on',
		'off': 'off'
	},
	'aspect': {
		'4:3': '4:3',
		'16:9': '16:9',
		'16:10': '16:10',
		'auto': 'auto',
		'real': 'real',
		'letterbox': 'lbox',
		'wide': 'wide'
	}
};

ProjectorCommand.prototype.projectorToHumanValue = {
	'sour': {
		'rgb': 'pc',
		'hdmi': 'hdmi'
	},
	'pow': {
		'on': 'on',
		'off': 'off'
	},
	'asp': {
		'4:3': '4:3',
		'16:9': '16:9',
		'16:10': '16:10',
		'auto': 'auto',
		'real': 'real',
		'lbox': 'letterbox',
		'wide': 'wide'
	}
};






// utility streams

// Device to bytes /////////////////////////////////
function ProjectorCommandToSerialStream() {
	//stream.Transform.call(this, { objectMode: true });
	stream.Transform.call(this);
	//this._writeableState.objectMode = true;
	this._writableState.objectMode = true;
}
util.inherits(ProjectorCommandToSerialStream, stream.Transform);

ProjectorCommandToSerialStream.prototype._transform = function(projectorCommand, encoding, callback) {
	var self = this;
	console.log('<projector tx>', {
			raw: new Buffer(projectorCommand.toString(), 'ascii'),
			string: projectorCommand.toString()
		});
	self.push(new Buffer(projectorCommand.toString(), 'ascii'));
	callback();
};





// Bytes to command ////////////////////////////
function SerialToProjectorCommandStream() {
	stream.Transform.call(this);
	this._readableState.objectMode = true;
	this.current = '';
}

util.inherits(SerialToProjectorCommandStream, stream.Transform);

SerialToProjectorCommandStream.prototype._transform = function(bytes, encoding, callback) {
	console.log("<projector rx>", {raw: bytes, string: bytes.toString('ascii')});
	var chunk = this.current + bytes.toString('ascii');
	var self = this;

	var commandRegex = /\*([^=#]+)=([^=#]*)#/;

	var regexResults;
	while(regexResults = commandRegex.exec(chunk)) {
		chunk = chunk.substr(regexResults.index + regexResults[0].length);
		var projectorProperty = regexResults[1];
		var projectorPropertyValue = regexResults[2];
		var projectorCommand = new ProjectorCommand(projectorProperty, projectorPropertyValue);
		self.push(projectorCommand);
	}
 
	this.current = chunk;

	// any data prior to the last command index has either been parsed or failed parse. dump it
	callback();
};












// Onkyo Receiver Service ///////////////////////////////
function BenQProjectorService(nodeContext, config) {
	var self = this;
 
 	self.config = config;
 	self._timeout = config.timeout || 300;
 	self._commandQueue = [];
 	self._expected = {};
}

BenQProjectorService.prototype.type = 'benqprojector';

BenQProjectorService.prototype.initialize = function() {
	var self = this;

	self._initialize = new Promise(function(resolve, reject) {
		var port = new serialport.SerialPort(self.config.port, {
			baudrate: 115200,
			dataBits: 8,
			parity: 'none',
			stopBits: 1
		}, false); // don't open immediately

		port.open(function() {
			//console.log('projector port opened');
			//console.log('insteon plm port opened');
			var portStream = new serialStream(port);

			self._rxCommands = new SerialToProjectorCommandStream();
			portStream.pipe(self._rxCommands);

			self._txCommands = new ProjectorCommandToSerialStream();
			self._txCommands.pipe(portStream);


			self._rxCommands.on('data', function(projCommand) {
				//console.log('on data command (fp? ', projCommand.fromProjector, ')', projCommand);

				if(!projCommand.fromProjector) {
					// just an echo. let's check what we last sent and see if we can resolve its promise

					var queueHead = self._commandQueue[0];
					if(queueHead && queueHead.command.equals(projCommand)) {
						queueHead.resolve();
						self._commandQueue.shift();
					}
				} else {
					// this isn't an echo, it should be a solicited response from the projector
					if(self._expected[projCommand.property]) {
						self._expected[projCommand.property].forEach(function(expectation) {
							expectation.resolve(projCommand.propertyValue);
						});
					}
				}
				// emit
			});

			resolve();
		});
	});

	return self._initialize;
};


BenQProjectorService.prototype._sendCommand = function(projCommand) {
	var self = this;
	//console.log('called to send ', projCommand);
	return self._initialize.then(function() {
		//console.log('about to send ', projCommand);
		self._txCommands.write(projCommand);

		return makeTimeoutPromise(function(sendResolve, sendReject) {
			self._commandQueue.push({
				resolve: sendResolve,
				reject: sendReject,
				command: projCommand
			});
		}, self._timeout);

	});
};

BenQProjectorService.prototype._expectResponse = function(projCommand) {
	var self = this;
	return self._initialize.then(function() {
		self._txCommands.write(projCommand);

		return makeTimeoutPromise(function(resolve, reject) {
			if(self._expected[projCommand.property] === undefined) self._expected[projCommand.property] = [];
			self._expected[projCommand.property].push({
				property: projCommand.property,
				resolve: resolve
			});
		}, self._timeout);
	});
};

BenQProjectorService.prototype.setPower = function(context, callback) {
	var self = this;
	//console.log('benq setPower ', context);
	self._sendCommand(new ProjectorCommand('power', context.power))
	.then(callback)
	.catch(function(err) { callback({err: err}); });
};

BenQProjectorService.prototype.getPower = function(context, callback) {
	var self = this;

	//self._sendCommand(new ProjectorCommand('power', '?'));
	self._expectResponse(new ProjectorCommand('power', '?'))
	.then(callback)
	.catch(function(err) { callback({err: err}); });
};

BenQProjectorService.prototype.setSource = function(context, callback) {
	var self = this;
	//console.log('benQ setSource ', context);
	self._sendCommand(new ProjectorCommand('source', context.source))
	.then(callback)
	.catch(function(err) { callback({err: err}); });
};

BenQProjectorService.prototype.getSource = function(context, callback) {
	var self = this;
	//self._sendCommand(new ProjectorCommand('source', '?'));
	self._expectResponse(new ProjectorCommand('source', '?'))
	.then(callback)
	.catch(function(err) { callback({err: err}); });
};