module.exports = OnkyoService;

// setting input-selector wil take out of standby and give input-selector event
//   that's the best time to set volume, in case it was in standby and misses the volume command

var onkyo = require('../eiscp');
var Promise = require('../node_modules/es6-promise').Promise;

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
	self._timeout = config.timeout || 100;


	['volume', 'input-selector', 'system-power'].forEach(function(commandName) {
		self._awaitingCommand[commandName] = [];
		onkyo.on(commandName, function(value) {
			self._awaitingCommand[commandName].forEach(function(awaitOptions) {
				if(value instanceof Array) awaitOptions.resolve(value[0]);
				else awaitOptions.resolve(value);
			});
			self._awaitingCommand[commandName] = [];
		});
	});
	//_onkyo.connect();
	
}

OnkyoService.prototype.type = 'onkyo';

OnkyoService.prototype.initialize = function() {
	var self = this;

	onkyo.connect();

	return self._connect; // built this promise in constructor
};

OnkyoService.prototype.setVolume = function(context, callback) {
	var self = this;
	var toVolume = context.volume;

	toVolume = Math.round(toVolume * 80);
	toVolume = Math.min(Math.max(toVolume, 0), 80);

	self._connect.then(function() {
		onkyo.command('volume=' + toVolume);
	});
};

OnkyoService.prototype.getVolume = function(context, callback) {
	var self = this;

	self._connect.then(function() {
		self._awaitQuery('volume')
		.then(callback)
		.catch(function(err) {
			callback({err: err});
		});
	});
};

OnkyoService.prototype.setInputSelector = function(context, callback) {
	var self = this;
	var toInput = context.input;

	self._connect.then(function() {
		onkyo.command('input-selector=' + toInput);
	});
};

OnkyoService.prototype.getInputSelector = function(context, callback) {
	var self = this;

	self._connect.then(function() {
		self._awaitQuery('input-selector')
		.then(callback)
		.catch(function(err) {
			callback({err: err});
		});
	});
};

OnkyoService.prototype.turnOn =function(context, callabck) {
	var self = this;
	self.setPower({power: 'on'}, callback);
};

OnkyoService.prototype.turnOff = function(context, callback) {
	var self = this;
	self.setPower({power: 'off'}, callback);
};

OnkyoService.prototype.setPower = function(context, callback) {
	var self = this;
	var power = context.power;

	self._connect.then(function() {
		onkyo.command('system-power=' + power);
	});
};

OnkyoService.prototype._awaitQuery = function(commandName) {
	var self = this;

	onkyo.command(commandName + '=query');
	return makeTimeoutPromise(function(resolve, reject) {
		if(self._awaitingCommand[commandName] === undefined) self._awaitingCommand[commandName] = [];
		self._awaitingCommand[commandName].push({
			resolve: resolve,
			reject: reject
		});
		
	}, self._timeout);
};



