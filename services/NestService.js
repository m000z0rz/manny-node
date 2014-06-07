module.exports = NestService;

var nest = require('../node_modules/unofficial-nest-api');
var Promise = require('../node_modules/es6-promise').Promise;

// Nest Service ///////////////////////////////////////////

function NestService (nodeContext, config) {
	var self = this;
	self.config = config;


	self.cToF = nest.ctof;
	self.fToC = nest.ftoc;

	//nest.setFanModeOn();
	//nest.setFanModeAuto();
	//nest.setTemperature(ids[0], 70);
	//nest.setTemperature(70);
	//nest.setFanModeAuto();
	//subscribe();
	//nest.setAway();
	//nest.setHome();
	//nest.setTargetTemperatureType(ids[0], 'heat');
};

NestService.prototype.type = 'nest';

NestService.prototype.initialize = function() {
	var self = this;

	return new Promise(function(resolve, reject) {
		nest.login(self.config.username, self.config.password, function (err, data) {
			if (err) {
				var errMessage = 'nest login failed: ' + err.message;
				console.log(errMessage);
				reject(new Error(errMessage));
			} else {
				console.log('nest logged in');
				resolve();
			}
		});
	});
};

NestService.prototype._getDeviceIdByContextLocation = function(contextLocation) {
	var self = this;
	//right now... just assuming location of "*"
	var deviceName = self.config.locationToDeviceMap["*"];
	var deviceId = self.config.deviceIdMap[deviceName];
	return deviceId;
};



NestService.prototype.getStatus = function(context, callback) {
	var self = this;
	// match context.location against map to find specific nest?
	var deviceId = self._getDeviceIdByContextLocation('');

	nest.fetchStatus(function (data) {
		if(!data.shared || !data.shared[deviceId]) {
			// callback badstuff
			console.log('nest fetch status doesn\'t have data for device ' + deviceId);
		} else {
			var deviceData = data.shared[deviceId];

			callback({
				currentTemperature: self.cToF(deviceData.current_temperature),
				targetTemperature: self.cToF(deviceData.target_temperature),
				targetTemperatureType: deviceData.target_temperature_type,
				fanOn: deviceData.hvac_fan_state
			});
		}
	});

};

NestService.prototype.setTemperatureRelative = function(context, callback) {
	var self = this;
	var deviceId = getDeviceIdByContextLocation("");
	var relativeTargetTemperature = +context.relativeTargetTemperature;

	nest.fetchStatus(function (data) {
		if(!data.shared || !data.shared[deviceId]) {
			// callback badstuff
			console.log('nest set temperature relatie doesn\'t have data for device ' + deviceId);
		} else {
			var deviceData = data.shared[deviceId];
			//var currentTemperature = deviceData.current_temperature;
			var targetTemperatureType = deviceData.target_temperature_type;
			if(targetTemperatureType === "cool" || targetTmperatureType === "heat") {
				var currentTemperature = self.cToF(deviceData.current_temperature);
				var targetTemperature = self.cToF(deviceData.target_temperature_type) + relativeTargetTemperature;
				console.log('nest setting target temperature from ' + currentTemperature + ' to ' + targetTemperature);
				nest.setTemperature(devieId, self.fToC(targetTemperature));
			} else {
				console.log('nest setTemperatureRelative didn\'t recognize targetTemperatureType ' + targetTemperatureType);
			}
			callback();
		}
	});
};


NestService.prototype.setFanOn = function(context, callback) {
	var self = this;
	var deviceId = self._getDeviceIdByContextLocation('');
	nest.setFanModeOn(deviceId);
	callback();
};

NestService.prototype.setFanAuto = function(context, callback) {
	var self = this;
	var deviceId = self._getDeviceIdByContextLocation('');
	nest.setFanModeAuto(deviceId);
	callback();
};
