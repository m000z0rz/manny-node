var onkyo = require('eiscp');


onkyo.on('debug', function(data) {
	console.log('debug ', data);
});

onkyo.on('volume', function(vol) {
	console.log('on volume ', vol);
});

onkyo.on('input-selector', function(val) {
	console.log('on input-selector ', val);
});

oknyo.on('system-power', function(val) {
	console.log('on power ', val);
});

onkyo.on('connect', function() {
	console.log('connected');

	onkyo.command('volume=query');
	onkyo.command('input-selector=query');
	onkyo.command('system-power=query');
});

/*
onkyo.discover({}, function(err, devices) {
	console.log('discover ', err, devices);
});
*/

onkyo.connect();