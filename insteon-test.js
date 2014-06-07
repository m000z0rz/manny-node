var Insteon = require('./node_modules/insteon/insteon.js'); 
var InsteonId = require('./node_modules/insteon/insteon-id.js');
var InsteonCommands = require('./node_modules/insteon/insteon-commands.js');

var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var SerialStream = require('./serial-stream.js');


// serial port: baud rate 19,200
// data bits: 8, no parity, 1 stop bit, no hardware flow control

// im echoes bytes from host
function stdCatch(err) {
	console.log('promise catch', err);
}


var plmPort = new SerialPort('COM30', {
	baudrate: 19200,
	dataBits: 8,
	parity: 'none',
	stopBits: 1
	//flowControl:  
}, false); // don't open immediately

plmPort.open(function() {


	
	console.log('port opened');
	var plmStream = new SerialStream(plmPort);

	var plm = Insteon.connect({
		serialStream: plmStream,
		defaultAllLinkGroup: 0x07,
	});

	var dimmerId = new InsteonId(0x29, 0xAD, 0xC5);


	
	/*
	plm.startAllLinking()
	.then(function() {
		console.log('all linking started');
	});
	*/

	var SendMessage = InsteonCommands.byName['SendMessage'];


	// 0x11: light on
	// 0x12: light on fast
	// 0x13: light off
	// 0x14 light on fast
	// 0x19: light status request 
	var onCommand = new SendMessage(dimmerId, undefined, 0x11, 0xFF);
	var halfCommand = new SendMessage(dimmerId, undefined, 0x11, 0x80);
	var offCommand = new SendMessage(dimmerId, undefined, 0x13, 0x00);
	var lightStatus = new SendMessage(dimmerId, undefined, 0x19, 0x00);
	var partialCommand = new SendMessage(dimmerId, undefined, 0x11, Math.round(2*255/4));



	//plm._sendCommand(halfCommand)
	//.then(function(response) {
	//	return plm._sendCommand(lightStatus);
	//})
	//.catch(stdCatch);

	//plm._sendCommand(offCommand);
	//plm._sendCommand(halfCommand);
	//plm._sendCommand(partialCommand);

	//plm.setLightLevel('29.ad.c5', 0.5)
	//.catch(stdCatch);
	//plm._sendCommand(lightStatus);
	plm.getLightLevel('29.ad.c5')
	.then(function(response) {
		console.log('light level ' + response);
	})
	.catch(stdCatch);
	


	/*
	plm.checkMonitorMode()
	.then(function(monitorMode) {
		console.log('first check: ' + monitorMode);
	})
	.catch(stdCatch);

	plm.setMonitorMode(false)
	.then(function() {
		return plm.checkMonitorMode();
	})
	.then(function(monitorMode) {
		console.log('second check: ' + monitorMode);
	})
	.catch(stdCatch);
	*/
	









	//var getCommand = new InsteonCommands.byName['GetIMConfiguration']();
	//plm._sendCommand(getCommand);

	
	//var setCommand = new InsteonCommands.byName['SetIMConfiguration'](0x00);
	//setCommand.monitorMode(true);
	//plm._sendCommand(setCommand);


	//plm._sendCommand(getCommand);
	

});