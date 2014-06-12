
var fs = require('fs');
var http = require('http');
var Promise = require('es6-promise').Promise;

// polyfills
require('array.from');
require('array.prototype.find');

//var socketIO = require('socket.io');




// require('child_process').exec('start chrome http://www.netflix.com/WiMovie/70242311?trkid=13462050');

var config = JSON.parse(fs.readFileSync('config.json'));


//.createServer(app) where app = express();
//var httpServer = http.createServer();
//var socketIOServer = socketIO.listen(httpServer);

//socketIOServer.set('log level', 1);
//socketIOServer.sockets.on('connection', function(socket) {
//	// probably not so much ehre for the node
//
//});


function tryCall() {
	arguments = Array.from(arguments);
	if(arguments[0] && typeof arguments[0] === 'function') {
		arguments[0].apply(this, arguments.slice(1));
	}
}

console.log("Connectiong to hub @ " + config.hub.address);
var hubSocket = require('socket.io-client').connect(config.hub.address);
hubSocket.on('connect',
 function() {
	console.log('Connected to hub @ ' + config.hub.address);
	console.log('\n\n');

	hubSocket.on('handleCommand', function(data, clientCallback) {
		console.log('handleCommand', data);
		var service = services[data.type];
		//var context = data.context;
		var functionName = data.functionName;

		/*
		var ifClientCallback = function() {
			if(clientCallback && typeof clientCallback === 'function') clientCallback.apply(this, arguments);
		};
		*/

		if(!service) {
			//ifClientCallback({err: 'no service found for ' + data.type});
			tryCall(clientCallback, {err: 'no service found for ' + data.type});
			return;
		} else if(!service[functionName] || (typeof (service[functionName]) !== 'function')) {
			tryCall(clientCallback, {err: 'no function name ' + functionName + ' on service'});
			//ifClientCallback({err: 'no function named ' + functionName + ' on service'});
			return;
		}

		service[functionName](data).then(function(returnData) {
			console.log('<handleCommand> for ' + data.type + '.' + data.functionName + ' returning ', returnData);
			tryCall(clientCallback, returnData);
		}).catch(function(returnErr) {
			console.log('<handleCommand> ERROR for ' + data.type + '.' + data.functionName + ' returning err ', returnErr);
			tryCall(clientCallback, {err: returnErr});
		});

		/*
		service[functionName](data, function(data) {
			//ifClientCallback(data);
			tryCall(clientCallback, data);
		});
		*/


	});

	servicesJSON = [];
	for(var serviceName in services) {
		if(services.hasOwnProperty(serviceName)) {
			console.log('build servicesJSON pushing ' + serviceName);
			servicesJSON.push(serviceName);
		}
	}
	hubSocket.emit('announceNode', {
		context: config.context,
		services: servicesJSON
		//services: services
	});

	//hubSocket.emit('messageType', {data: "data"});

});




/*
function getServiceConfig(serviceType) {
	return config.services.find(
		function(service) {
			return service.type === serviceType;
		}
	);
}
*/






































var ServiceConstructors = [
	require('./services/NestService.js'),
	require('./services/InsteonService.js'),
	require('./services/OnkyoService.js'),
	require('./services/BenQProjectorService.js')
	];





var services = {};
console.log('services declared');
config.services.forEach(function(serviceConfig) {
	var serviceType = serviceConfig.type;

	ServiceConstructors.forEach(function(serviceConstructor) {
		if(serviceConstructor.prototype.type === serviceType) {
			console.log('initializing service ', serviceType);
			var newService = new serviceConstructor(config.nodeContext, serviceConfig);
			services[serviceType] = newService;
			newService.initialize()
			.then(function() {
				console.log(serviceType + ' initialized');
			})
			.catch(function(err) {
				console.log('ERROR initializing ', serviceType, err);
			});
		}
	});

	/*
	if(serviceType === 'nest') {
		console.log('building nest service');
		var nestService = new NestService(config.nodeContext, serviceConfig);
		services[serviceType] = nestService;
		nestService.initialize();

	} else if(serviceType === 'devices-insteon') {
		console.log('building insteon service');
		var insteonService = new InsteonService(config.nodeContext, serviceConfig);
		services[serviceType] = insteonService;
		insteonService.initialize();
	} else if(serviceType === 'onkyo') {
		console.log('building onkyo service');
		var onkyoService = new OnkyoService(config.nodeContext, serviceConfig);
		services[serviceType] = onkyoService;
		onkyoService.initialize();
	}
	*/
});


process.on('exit', function() {
	hubSocket.close();
});