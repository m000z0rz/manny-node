var BenQProjectorService = require('./BenQProjectorService');
var Promise = require('../node_modules/es6-promise').Promise;

var ProjectorCommand = BenQProjectorService.ProjectorCommand;

var stdErr = function(err) {
	console.log('err: ', err);
};

var benq = new BenQProjectorService({}, {port: 'COM28'});
benq.initialize();


/*
benq._expectResponse(new ProjectorCommand('asp', '?'))
.then(function(val) { console.log('got proper response of ', val); })
.catch(stdErr);
*/

benq._sendCommand(new ProjectorCommand('power', 'off'))
.then(function() {
	console.log('power off');
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve();
		}, 20000);
	});
}).then(function() {
	return benq._sendCommand(new ProjectorCommand('power', 'on'));
}).then(function() {
	console.log('power on');
})
.catch(stdErr);



/*
benq._sendCommand(new ProjectorCommand('power', '?'))
.then(function(val) { console.log('sent resolved'); })
.catch(stdErr);

*/