module.exports = OnkyoService;

// setting input-selector wil take out of standby and give input-selector event
//   that's the best time to set volume, in case it was in standby and misses the volume command

var util = require('util');
var events = require('events');
var EventEmitter = events.EventEmitter;
var path = require('path');
var child_process = require('child_process');

var Promise = require('../node_modules/es6-promise').Promise;

var onkyo = require('../eiscp');
// require('child_process').exec('start chrome http://www.netflix.com/WiMovie/70242311?trkid=13462050');



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






// Onkyo Receiver Service ///////////////////////////////
function OnkyoService(nodeContext, config) {
	var self = this;

	onkyo.on('connect', function() {
		self._connectResolve();
	});

	self._connect = new Promise(function(resolve, reject) {
		self._connectResolve = resolve;
	});

	self._awaitingCommand = {};

	self.config = config;
	self._timeout = config.timeout || 2000;

	self._currentInput = "unknown";

	['volume', 'input-selector', 'system-power'].forEach(function(commandName) {
		self._awaitingCommand[commandName] = [];
		onkyo.on(commandName, function(value) {
			console.log('<onkyo> rx ' + commandName + '=' + value);
			if(commandName === 'input-selector') {
				if(value !== self._currentInput);
				if(value !== undefined && value[0] !== undefined) {
					self._inputChanged(self._currentInput, value[0]);
					self._currentInput = value[0];
				} else {
					self._inputChanged(self._currentInput, 'unknown');
					self._currentInput = 'unknown';
				}
			}
			self._awaitingCommand[commandName].forEach(function(awaitOptions) {
				if(value instanceof Array) awaitOptions.resolve(value[0]);
				else awaitOptions.resolve(value);
			});
			self._awaitingCommand[commandName] = [];
		});
	});
	//_onkyo.connect();
	
}
util.inherits(OnkyoService, EventEmitter);

OnkyoService.prototype.type = 'onkyo';

OnkyoService.prototype.initialize = function() {
	var self = this;

	onkyo.connect();

	return self._connect; // built this promise in constructor
};

OnkyoService.prototype._inputChanged = function(oldInput, newInput) {
	var self = this;

	if(oldInput === newInput) return;

	console.log('<onkyo> inputChanged from ', oldInput, ' to ', newInput);
	if(self.config.audioSwitch !== undefined) {
		var ahk = self.config.audioSwitch.autoHotkeyPath;
		var audioSwitchScript = path.resolve(__dirname, 'change_default_audio.ahk');
		var scriptConfig;
		var command;

		if(oldInput === 'video6' || oldInput === 'unknown') {
			scriptConfig = self.config.audioSwitch.offpc;
			command = 'start "' + ahk + '" "' + audioSwitchScript + '" ' + scriptConfig.numDown + ' ' + scriptConfig.numTab;
			console.log('<onkyo> switch to mini speaker, ', command);
			child_process.exec(command);
		} else if (newInput === 'video6') {
			scriptConfig = self.config.audioSwitch.onpc;
			command = 'start "' + ahk + '" "' + audioSwitchScript + '" ' + scriptConfig.numDown + ' ' + scriptConfig.numTab;
			console.log('<onkyo> switch to main audio, ', command);
			child_process.exec(command);
		}
	}
}


OnkyoService.prototype.setState = function(context) {
	var self = this;

	var power = context.power;
	var volume = context.volume;
	var input = context.input;

	if(power === 'off' || power === 'standby') {
		return self.turnOff();
	} else {
		// power should be on - check that it's ready
		//  we can still talk to it while it's off, at least to see its power status
		return self._await('system-power').then(function(actualPower) {
			//console.log('a', actualPower);
			if(actualPower === 'standby') return self.turnOn();
			else return Promise.resolve();
		}).then(function() {
			//console.log('b', input);
			//power should now be on
			if(input === undefined) return Promise.resolve();
			else return self.setInputSelector({input: input});
		}).then(function() {
			//console.log('c', volume);
			if(volume === undefined) return Promise.resolve();
			else return self.setVolume({volume: volume});
		});

	}
};

OnkyoService.prototype.setVolume = function(context) {
	var self = this;
	var toVolume = context.volume;

	//toVolume = Math.round(toVolume * 80);
	toVolume = Math.min(Math.max(toVolume, 0), 80);

	return self._connect.then(function() {
		return self._await('volume=' + toVolume);
	});
};

OnkyoService.prototype.getVolume = function(context) {
	var self = this;

	return self._connect.then(function() {
		return self._await('volume');
	});
};

OnkyoService.prototype.setInputSelector = function(context) {
	var self = this;
	var toInput = context.input;

	return self._connect.then(function() {
		return self._await('input-selector=' + toInput);
	});
};

OnkyoService.prototype.getInputSelector = function(context) {
	var self = this;

	return self._connect.then(function() {
		return self._await('input-selector');
	});
};

OnkyoService.prototype.turnOn =function(context) {
	var self = this;
	return self.setPower({power: 'on'});
};

OnkyoService.prototype.turnOff = function(context) {
	var self = this;
	return self.setPower({power: 'standby'});
};

OnkyoService.prototype.setPower = function(context) {
	var self = this;
	var power = context.power;

	var timeout;
	if(power === 'on') timeout = 2000; // need longer timeout if we're turning it on. otherwise, let it use defualt timeout
	return self._connect.then(function() {
		return self._await('system-power=' + power, timeout);
	});
};

OnkyoService.prototype._await = function(command, timeout) {
	var self = this;

	var commandName;

	timeout = timeout || self._timeout;

	if(command.indexOf('=') === -1) command += '=query';

	commandName = command.split('=')[0];
	//onkyo.command(commandName + '=query');
	onkyo.command(command);
	return makeTimeoutPromise(function(resolve, reject) {
		if(self._awaitingCommand[commandName] === undefined) self._awaitingCommand[commandName] = [];
		self._awaitingCommand[commandName].push({
			resolve: resolve,
			reject: reject
		});
		
	}, timeout);
};



