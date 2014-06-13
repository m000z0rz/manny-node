Insteon = module.exports = {};

// insteon 
var util = require('util');
var stream = require('stream');
var InsteonConstants = require('./insteon-constants.js');
var events = require('events');
var EventEmitter = events.EventEmitter;
var Promise = require('es6-promise').Promise;
var InsteonCommands = require('./insteon-commands.js');
var InsteonId = require('./insteon-id.js');



var InsteonSendMessage = InsteonCommands.byName['SendMessage'];






// TimeoutPromise ///////////////////////////////////

/*
function TimeoutPromise(promiseFunction, timeoutMs, timeoutError) {
	console.log('make timeoutpromise');
	
	Promise.call(this, function(thisResolve, thisReject) {
		console.log('about to make timeout w ms ', timeoutMs);
		var timeout = new Promise(function(timeoutResolve, timeoutReject) { setTimeout(timeoutReject, timeoutMs, timeoutError || new Error("timeout")); });
		console.log('made timeout');
		Promise.race([new Promise(promiseFunction), timeout]).then(function(response) {
			console.log('race resolve', response);
			thisResolve(response);
		}).catch(function(err) {
			console.log('race err ', err);
			thisReject(err);
		});
	});
	
}
util.inherits(TimeoutPromise, Promise);

Insteon.TimeoutPromise = TimeoutPromise;
*/

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
Insteon.makeTimeoutPromise = makeTimeoutPromise;







// Device to bytes /////////////////////////////////
function InsteonCommandToSerialStream() {
	//stream.Transform.call(this, { objectMode: true });
	stream.Transform.call(this);
	//this._writeableState.objectMode = true;
	this._writableState.objectMode = true;
}
util.inherits(InsteonCommandToSerialStream, stream.Transform);
Insteon.InsteonCommandToSerialStream = InsteonCommandToSerialStream;
InsteonCommandToSerialStream.prototype._transform = function(insteonCommand, encoding, callback) {
	var self = this;

	self.push(insteonCommand.getByteBuffer());
	callback();
};





// Bytes to command ////////////////////////////
function SerialToInsteonCommandStream() {
	stream.Transform.call(this);
	this._readableState.objectMode = true;
	this.current = new Buffer([]);
}

util.inherits(SerialToInsteonCommandStream, stream.Transform);

SerialToInsteonCommandStream.prototype._transform = function(bytes, encoding, callback) {
	var chunk = Buffer.concat([this.current, bytes]);
	//console.log('<insteon> rx bytes ', bytes);
	var self = this;

	var lastStartCommandIndex = -1;

	var i = 0;
	while(i < chunk.length - 1) {
		if(chunk[i] === InsteonConstants.START_COMMAND) {
			var commandByte = chunk[i+1];
			var insteonCommandType = InsteonCommands.byByte[commandByte];
			if(insteonCommandType === undefined) {
				chunk = chunk.slice(i+1); // clip out the chunk up to (and including) now
				i = 0;
			} else {
				var expectedLength = insteonCommandType.findLength(chunk.slice(i));
				if(chunk.length - i >= expectedLength) {
					var insteonCommand = insteonCommandType.tryParse(chunk.slice(i));
					if(insteonCommand !== undefined) self.push(insteonCommand);
					chunk = chunk.slice(i + expectedLength);
					i = 0;
				} else {
					i += expectedLength; // should put it past the end of the chunk and quit the loop
				}
			}
		} else {
			i += 1;
		}
	}
 
	this.current = chunk;

	// any data prior to the last command index has either been parsed or failed parse. dump it
	//if(lastStartCommandIndex !== -1) {
	//	this.current = chunk.slice(lastStartCommandIndex);
	//}
	callback();
};
















// PLM ////////////////////////////////////////////

/*
function Insteon() {
	var insteon = {};

	insteon.connect = function(options) {
		var plm = new PowerLineModem(options);

		return plm;
	};

	return insteon;
}
*/
Insteon.connect = function(options) {
	var plm = new PowerLineModem(options);
	return plm;
};


var PowerLineModem = function(options) {
	EventEmitter.call(this);

	var self = this;

	self._commandQueue = [];
	self._expectedResponses = [];
	self._serialStream = options.serialStream;
	self._maxRetries = options.maxRetries || 3;
	self._commandTimeout = options.commandTimeout || 1000;
	self._interCommandDelay = options.interCommandDelay || 40; // 30 ms didn't seem to work, 33 seemed to work reliably

	self._rxCommands = new SerialToInsteonCommandStream();
	self._serialStream.pipe(self._rxCommands);

	self._txCommands = new InsteonCommandToSerialStream();
	self._txCommands.pipe(self._serialStream);

	self._rxCommands.on('data', function(insteonCommand) {
		//console.log('<insteon> rx ', insteonCommand.name, insteonCommand);

		//console.log('rx insteon command queue', self._commandQueue);

		var queueHead = self._commandQueue[0];

		if(queueHead) {
			var headCommand = queueHead.command;
			if(insteonCommand.commandByte === headCommand.commandByte && queueHead.sent === true) {
				if(insteonCommand.acknowledged === false && queueHead.retries > 0) {
					queueHead.retries -= 1;
					console.log('<insteon> retry tx insteon command ', headCommand);
					self._txCommands.write(headCommand);
				} else if(insteonCommand.acknowledged === false) {
					// out of retries; reject it
					console.log('<insteon> out of retries');
					queueHead.timeoutReject(new Error('out of retries'));
				} else {
					// it was acknowledged!
					console.log('<insteon> rx acknowledgement ', insteonCommand.name, insteonCommand);
					queueHead.timeoutResolve(insteonCommand);
				}
				
			} else {
				// didn't match commandByte or head isn't sent
				console.log('<insteon> rx ', insteonCommand.name);
			}
		} else { // queueHead === undefined
			console.log('<insteon> rx ', insteonCommand.name);

			if(insteonCommand.commandByte === InsteonCommands.byName['StandardMessageReceived'].commandByte &&
					insteonCommand.isAcknowledgement()) {
				//search for anyone expecting a response from this dude
				self._expectedResponses.forEach(function(request) {
					if(request.fromId.equals(insteonCommand.fromId)) {
						request.resolve(insteonCommand);
					}
				});
			}
		}

		self.emit('command:' + insteonCommand.name, insteonCommand);
		self.emit('command', insteonCommand);
	});


	self._defaultAllLinkGroup = options.defaultAllLinkGroup | 0x07;

};
util.inherits(PowerLineModem, EventEmitter);
//PowerLineModem.prototype = new EventEmitter();


PowerLineModem.prototype._sendCommand = function(insteonCommand) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self._commandQueue.push({
			command: insteonCommand,
			retries: self._maxRetries,
			senderResolve: resolve,
			senderReject: reject,
			sent: false
		});
		if(self._commandQueue.length === 1) {
			// it was empty, so we should get our command going immediately
			var sendDelay;
			if(self._lastTransmit === undefined) sendDelay = 0;
			else {
				var timeSinceLast = Date.now() - self._lastTransmit;
				if(timeSinceLast > self._interCommandDelay) sendDelay = self._interCommandDelay;
				else sendDelay = self._interCommandDelay - timeSinceLast;
				//var sendDelay = Math.min(self._interCommandDelay - (Date.now() - self._lastTransmit), self._interCommandDelay);
				
			}
			setTimeout(function () { self._transmitCommand(); }, sendDelay); // why wrap in function? so this isn't set to window
		}
	});

	/*
	console.log('tx insteon command ', insteonCommand);
	this._txCommands.write(insteonCommand);
	*/
};

PowerLineModem.prototype._expectResponse = function(fromId) {
	var self = this;
	return new Promise(function(resolve, reject) {
		var expectedResponseRequest = {
			fromId: fromId
		};

		makeTimeoutPromise(function(timeoutResolve, timeoutReject) {
			expectedResponseRequest.resolve = timeoutResolve;
			expectedResponseRequest.reject = timeoutReject;
			self._expectedResponses.push(expectedResponseRequest);
		}, 500)
		.then(function(response) {
			self._expectedResponses = self._expectedResponses.filter(function(request) { return request !== expectedResponseRequest; });
			resolve(response);
		}).catch(function(err) {
			self._expectedResponses = self._expectedResponses.filter(function(request) { return request !== expectedResponseRequest; });
			reject(err);
		});
	});
};

PowerLineModem.prototype._transmitCommand = function() {
	var self = this;

	if(self._commandQueue.length < 1) return;
	if(self._commandQueue[0].sent === true) return;

	var queueHead = self._commandQueue[0];
	var insteonCommand = queueHead.command;

	console.log('<insteon> tx ', insteonCommand.name, insteonCommand, insteonCommand.getByteBuffer());
	self._lastTransmit = Date.now();
	self._txCommands.write(insteonCommand);
	queueHead.sent = true;
	
	var timeoutPromise = makeTimeoutPromise(function(resolve, reject) {
		queueHead.timeoutResolve = resolve;
		queueHead.timeoutReject = reject;
	}, self._commandTimeout, new Error("command timeout"));




	timeoutPromise.then(function(response) {
		self._commandQueue.shift(); // actualy dequeue the head command
		setTimeout(function() { self._transmitCommand(); }, self._interCommandDelay); // why wrap in function? so this isn't set to window
		//self._transmitCommand(); // send the next command if it exists

		queueHead.senderResolve(response);
	}).catch(function(err) {
		self._commandQueue.shift(); // actually dequeue the head command
		setTimeout(function() { self._transmitCommand(); }, self._interCommandDelay); // why wrap in function? so this isn't set to window
		//self._transmitCommand(); // send the next command if it exists

		queueHead.senderReject(err);
	});
};























PowerLineModem.prototype.checkMonitorMode = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		var getCommand = new InsteonCommands.byName['GetIMConfiguration']();
		self._sendCommand(getCommand).then(function(response) {
			resolve(response.monitorMode());
		}).catch(function(err) {
			reject(err);
		});
	});
};


PowerLineModem.prototype.setMonitorMode = function(newValue) {
	var self = this;

	return new Promise(function(resolve, reject) {
		// set monitor mode
		var getCommand = new InsteonCommands.byName['GetIMConfiguration']();
		self._sendCommand(getCommand).then(function(response) {
			var setCommand = new InsteonCommands.byName['SetIMConfiguration'](response.configurationFlags);
			setCommand.monitorMode(newValue);
			return self._sendCommand(setCommand);
		}).then(function(response) {
			resolve();
		}).catch(function(err) {
			reject(err);
		});
	});
};

PowerLineModem.prototype.factoryReset = function() {
	var self = this;

	return self._sendCommand(new InsteonCommands.byName['FactoryReset']());
	/*
	return new Promise(function(resolve, reject) {
		var resetCommand = new InsteonCommands.byName['FactoryReset']();
		self._sendCommand(resetCommand).then(function(response) {
			resolve();
		}).catch(function(err) {
			reject(err);
		});
	});
	*/
};

PowerLineModem.prototype.startAllLinking = function(linkAs, group) {
	var self = this;

	// linkAs can be raw byte value, or string: controller/responder/either/delete. default is controller
	linkAs = linkAs || 'controller';
	group = group || self._defaultAllLinkGroup;

	return self._sendCommand(new InsteonCommands.byName['StartAllLinking'](linkAs, group));
	/*
	return new Promise(function(resolve, reject) {
		var startLinkingCommand = new InsteonCommands.byName['StartAllLinking'](linkAs, group);
		self._sendCommand(startLinkingCommand).then(function(response) {
			resolve();
		}).catch(function(err) {
			reject(err);
		});
	});
	*/
};

PowerLineModem.prototype.cancelAllLinking = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		var cancelLinkingCommand = new InsteonCommands.byName['CancelAllLinking']();
		self._sendCommand(cancelLinkingCommand)
		.then(function(response) {
			resolve();
		})
		.catch(function(err) {
			reject(err);
		});
	});
};

PowerLineModem.prototype.setLightLevel = function(deviceId, lightLevel) {
	var self = this;

	return new Promise(function(resolve, reject) {
		if(typeof deviceId === 'string') {
			deviceId = InsteonId.fromString(deviceId);
			if(deviceId === undefined) {
				reject('Bad device ID');
				return;
			}

			// clamp lightLevel to 0-1, then scale to -255
			lightLevel = Math.min(Math.max(lightLevel, 0), 1);
			lightLevel = Math.round(lightLevel * 255);

			
			var command1 = 0x11; // set light level
			if(lightLevel === 0) command1 = 0x13; //off

			var setLightCommand = new InsteonSendMessage(deviceId, undefined, command1, lightLevel);

			self._sendCommand(setLightCommand)
			.then(function(response) {
				resolve();
			})
			.catch(function(err) {
				reject(err);
			});



			/*
			var onCommand = new SendMessage(dimmerId, undefined, 0x11, 0xFF);
			var halfCommand = new SendMessage(dimmerId, undefined, 0x11, 0x80);
			var offCommand = new SendMessage(dimmerId, undefined, 0x13, 0x00);
			var lightStatus = new SendMessage(dimmerId, undefined, 0x19, 0x00);
			*/



		}
	});
};

PowerLineModem.prototype.getLightLevel = function(deviceId) {
	var self = this;

	//throw new Error('getLightLevel not fully implemented');

	return new Promise(function(resolve, reject) {
		deviceId = InsteonId.fromString(deviceId);
		if(deviceId === undefined) {
			reject('Bad device ID');
			return;
		}

		var getLightStatusCommand = new InsteonSendMessage(deviceId, undefined, 0x19, 0x00);

		self._sendCommand(getLightStatusCommand)
		.catch(function(err) {
			reject(err);
		});

		self._expectResponse(deviceId)
		.then(function(response) {
			var lightLevel = response.command2;
			lightLevel = Math.min(Math.max(lightLevel, 0), 255);
			lightLevel = lightLevel/255;
			resolve(lightLevel);
		})
		.catch(function(err) {
			reject(err);
		});


	});
};