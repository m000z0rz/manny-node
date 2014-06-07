var util = require('util');
var InsteonId = require('./insteon-id.js');
var InsteonConstants = require('./insteon-constants.js');

var InsteonCommands = module.exports = {};

InsteonCommands.byByte = {};
InsteonCommands.byName = {};

//http://stackoverflow.com/questions/1646698/what-is-the-new-keyword-in-javascript
function New(func) {
    var res = {};
    if (func.prototype !== null) {
        res.__proto__ = func.prototype;
    }
    var ret = func.apply(res, Array.prototype.slice.call(arguments, 1));
    if (typeof ret === "object" && ret !== null) {
        return ret;
    }
    return res;
}


function bitValue(ofValue, bitNumber, newValue) {
	if(newValue === undefined) return !!(ofValue & (1 << bitNumber));
	newValue = !!newValue;
	if(newValue) {
		return ofValue | (1 << bitNumber);
	} else {
		return ofValue & ~(1 << bitNumber);
	}
}

function bitValuePropertyFunction(property, bitNumber) {
	return (function(_value) {
		if(_value === undefined) return bitValue(this[property], bitNumber);
		else this[property] = bitValue(this[property], bitNumber, _value);
	});
}









/*
function addCommandType(insteonCommandType) {
	InsteonCommands.byByte[insteonCommandType.commandByte] = insteonCommandType;
	InsteonCommands.byName[insteonCommandType.commandName] = insteonCommandType;
}*/

function makeCommandType(definition) {
	var commandType = function () {
		InsteonCommand.call(this);
		//if(definition._constructor) definition._constructorFunction.apply(this, Array.prototype.slice.call(arguments, 1));
		if(definition._constructorFunction) definition._constructorFunction.apply(this, Array.prototype.slice.call(arguments));
	};
	util.inherits(commandType, InsteonCommand);

	commandType.commandName = definition.name;
	commandType.commandByte = definition.commandByte;
	commandType.prototype.name = definition.name;
	commandType.prototype.commandByte = definition.commandByte;
	commandType.prototype._length = definition._length || 0;
	if(definition._getByteBuffer) commandType.prototype.getByteBuffer = definition._getByteBuffer;
	commandType.tryParse = function(buffer) {
		var expectedLength = commandType.findLength(buffer);
		if(buffer.length < expectedLength) return; // <0x02> <commandByte> [this.length bytes ...] <ack>
		if(buffer[0] !== InsteonConstants.START_COMMAND) return;
		if(buffer[1] !== definition.commandByte) return;

		var command;
		if(definition._tryParse) command = definition._tryParse(buffer.slice(2), commandType);
		else command = new commandType();

		if(command === undefined) return;

		if(!commandType.isReceiveType()) {
			var ackByte = buffer[expectedLength - 1];
			if(ackByte !== InsteonConstants.RX_ACK && ackByte !== InsteonConstants.RX_NAK) return;
			command.acknowledged = (ackByte === InsteonConstants.RX_ACK);
		}
		return command;
	};
	commandType.isReceiveType = function() {
		return (definition.commandByte < 0x60); // receive types start with 0x5-
	};
	//
	// returns undefined if can't tell what length should be from buffer
	// otherwise, returns what the length of the command is expected to be
	commandType.findLength = function(buffer) {
		if(buffer.length < 2) return;
		var ackLength = commandType.isReceiveType() ? 0 : 1;
		if(typeof definition._length === 'function') {
			return definition._length(buffer.slice(2)) + 2 + ackLength; // +3 is for <0x02> <commandByte> at start and <ack> at end
		} else {
			return definition._length + 2 + ackLength; // +3 is for <0x02> <commandByte> at start and <ack> at end
		}
	};

	for(var functionName in definition.functions) {
		if(definition.functions.hasOwnProperty(functionName)) {
			commandType.prototype[functionName] = definition.functions[functionName];
		}
	}

	InsteonCommands.byName[definition.name] = commandType;
	InsteonCommands.byByte[definition.commandByte] = commandType;
}

function InsteonCommand() {

}
InsteonCommand.prototype.getPreamble = function() {
	return [InsteonConstants.START_COMMAND, this.commandByte];
};
InsteonCommand.prototype.getByteBuffer = function() {
	if(this._getByteBuffer) return this._getByteBuffer;
	else {
		return new Buffer(this.getPreamble());
	}
	return this._getByteBuffer;
};






























//_constructorFunction: function(_fromId, _toId, _messageFlags, _command1, _command2) {
// to high, to middle, to low, message flags, command1, command2
// if extended, then 14 user data bytes follow


// message flags //////////////////
// bit 7 - broadcast /NAK
// bit 6 - group
// bit 5 - acknowledge
// bit 4 - extended ?
// bit 3 & 2 - hops left
// bit 1 & 0 - max hops
makeCommandType({
	name: 'SendMessage',
	commandByte: 0x62,
	_length: function(buffer) {
		if(buffer.length < 4) return;
		var messageFlags = buffer[3];
		if(bitValue(messageFlags, 4)) return 20;
		else return 6;
	},
	_constructorFunction: function(_toID, _messageFlags, _command1, _command2, _extendedData) {
		this.toID = _toID;
		this.messageFlags = _messageFlags | parseInt('00001111', 2);
		if(_extendedData) {
			this.extendedData = _extendedData;
			this.isExtended(true);
		} else {
			this.isExtended(false);
		}
		this.command1 = _command1;
		this.command2 = _command2;
	},
	_getByteBuffer: function() {
		var bytes = this.getPreamble();
		var startBytes = [this.toID.highByte, this.toID.midByte, this.toID.lowByte, this.messageFlags, this.command1, this.command2];
		if(this.isExtended()) {
			return new Buffer(bytes.concat(startBytes).concat(this.extendedData));
		} else {
			return new Buffer(bytes.concat(startBytes));
		}
	},
	_tryParse: function(buffer, constructor) {
		var id = new InsteonId(buffer[0], buffer[1], buffer[2]);
		var messageFlags = buffer[3];
		var command1 = buffer[4];
		var command2 = buffer[5];
		var extendedData;

		if(bitValue(messageFlags, 4) === true) { 
			// extended
			extendedData = [];
			for(var i = 6; i < 6 + 14; i++) {
				extendedData.push(buffer[i]);
			}
		}
		return New(constructor, id, messageFlags, command1, command2, extendedData);
	},
	functions: {
		isExtended: bitValuePropertyFunction('messageFlags', 4)
	}

});








linkTypeMap = {
	toByte: {
		'responder': 0x00,
		'slave': 0x00,
		'controller': 0x01,
		'master': 0x01,
		'either': 0x03,
		'both': 0x03,
		'delete': 0xFF
	},
	fromByte: {
		0x00: 'responder',
		0x01: 'controller',
		0x03: 'either',
		0xFF: 'delete'
	}
};
makeCommandType({
	name: 'StartAllLinking',
	commandByte: 0x64,
	_length: 2,
	_constructorFunction: function(_linkType, _allLinkGroup) {
		if(_linkType === undefined) this.linkType = 'controller';
		else this.linkType = _linkType;

		this.allLinkGroup = _allLinkGroup;
	},
	_getByteBuffer: function() {
		var bytes = this.getPreamble();
		bytes.push(linkTypeMap.toByte[this.linkType] || linkType);
		bytes.push(this.allLinkGroup);
		return new Buffer(bytes);
	},
	_tryParse: function(buffer, constructor) {
		var linkType = linkTypeMap.fromByte[buffer[0]];
		if(linkType === undefined) return;
		var allLinkGroup = buffer[1];
		return New(constructor, linkType, allLinkGroup);
	}
});


makeCommandType({
	name: 'CancelAllLinking',
	commandByte: 0x65,
});





// configuration flags:
// bit 7 set to 1 disables automatic linking when the user pushes and holds the SET button
// bit 6 set to 1 puts the IM into Monitor Mode
// bit 5 set to 1 disables automatic LED operation by the IM
// bit 4 set to 1 disables host communication Deadman feature
// bits 3-0 reserved for use; must be set to 0 when setting IM configuration
makeCommandType({
	name: 'GetIMConfiguration',
	commandByte: 0x73,
	_length: 3,
	_constructorFunction: function(_configurationFlags, _spare1, _spare2) {
		this.configurationFlags = _configurationFlags;
		this.spare1 = _spare1;
		this.spare2 = _spare2;
	},
	_tryParse: function(buffer, constructor) {
		var configurationFlags = buffer[0];
		var spare1 = buffer[1];
        var spare2 = buffer[2];
        return New(constructor, configurationFlags, spare1, spare2);
	},
	functions: {
		automaticLinkingDisable: bitValuePropertyFunction('configurationFlags', 7),
		monitorMode: bitValuePropertyFunction('configurationFlags', 6),
		automaticLedDisable: bitValuePropertyFunction('configurationFlags', 5),
		deadmanDisable: bitValuePropertyFunction('configurationFlags', 4)
	}
});



makeCommandType({
	name: 'SetIMConfiguration',
	commandByte: 0x6B,
	_length: 1,
	_constructorFunction: function(_configurationFlags) {
		_configurationFlags = _configurationFlags || 0;
		this.configurationFlags = _configurationFlags;
	},
	_getByteBuffer: function() {
		var bytes = this.getPreamble();
		bytes.push(this.configurationFlags);
		return new Buffer(bytes);
	},
	_tryParse: function(buffer, constructor) {
		var configurationFlags = buffer[0];
		return New(constructor, configurationFlags);
	},
	functions: {
		automaticLinkingDisable: bitValuePropertyFunction('configurationFlags', 7),
		monitorMode: bitValuePropertyFunction('configurationFlags', 6),
		automaticLedDisable: bitValuePropertyFunction('configurationFlags', 5),
		deadmanDisable: bitValuePropertyFunction('configurationFlags', 4)
	}
	
});





makeCommandType({
	name: 'FactoryReset',
	commandByte: 0x67,
});







// Receive ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getDeviceCategory(deviceCategoryId) {
	var category = InsteonConstants.deviceCategory[deviceCategoryId];
	if(!category) return;
	return category['category'];
}
function getDeviceSubcategory(deviceCategoryId, deviceSubcategoryId) {
	var category = InsteonConstants.deviceCategory[deviceCategoryId];
	if(!category) return;
	return category[deviceSubcategoryId];
}

makeCommandType({
	name: 'AllLinkingCompleted',
	commandByte: 0x53,
	_length: 8,
	_constructorFunction: function(_linkType, _allLinkGroup, _id, _deviceCategoryId, _deviceSubcategoryId, _firmwareVersion) {
		this.linkType = _linkType;
		this.allLinkGroup = _allLinkGroup;
		this.id = _id;
		this.deviceCategoryId = _deviceCategoryId;
		this.deviceCategory = getDeviceCategory(_deviceCategoryId);
		this.deviceSubcategoryId = _deviceSubcategoryId;
		this.deviceSubcategory = getDeviceSubcategory(_deviceCategoryId, _deviceSubcategoryId);
		this.firmwareVersion = _firmwareVersion;
	},
	/*_getByteBuffer: function() {
		var bytes = this.getPreamble();
		bytes.push(linkTypeMap.toByte[this.linkType] || linkType);
		bytes.push(this.allLinkGroup);
		return new Buffer(bytes);
	},*/
	_tryParse: function(buffer, constructor) {
		var linkType = linkTypeMap.fromByte[buffer[0]];
		if(linkType === undefined) return;
		if(linkType === 0x03) return; // can't be either/both: if completed, it must have picked one!
		var allLinkGroup = buffer[1];
		var id = new InsteonId(buffer[2], buffer[3], buffer[4]);
		var deviceCategory = buffer[5];
		var deviceSubcategory = buffer[6];
		var firmwareVersion = buffer[7]; // 0xFF for newer devices
		return New(constructor, linkType, allLinkGroup, id, deviceCategory, deviceSubcategory, firmwareVersion);
	}
});


// bit flags //////////////////
// bit 7 - broadcast /NAK
// bit 6 - group
// bit 5 - acknowledge
// bit 4 - extended ?
// bit 3 & 2 - hops left
// bit 1 & 0 - max hops

// bits 7-5:
// 100 = Broadcast Message
// 
// 000 = Direct Message
// 001 = ACK of Direct Message
// 101 = NAK of Direct Message
//
// 110 = Group Broadcast Message
// 010 = Group Cleanup Direct Message
// 011 = ACK of Group Cleanup Direct Message
// 111 = NAK of Group Cleanup Direct Message

makeCommandType({
	name: 'StandardMessageReceived',
	commandByte: 0x50,
	_length: 9,
	_constructorFunction: function(_fromId, _toId, _messageFlags, _command1, _command2) {
		this.fromId = _fromId;
		this.toId = _toId;
		this.messageFlags = _messageFlags;
		this.command1 = _command1;
		this.command2 = _command2;
	},
	/*_getByteBuffer: function() {
		var bytes = this.getPreamble();
		bytes.push(linkTypeMap.toByte[this.linkType] || linkType);
		bytes.push(this.allLinkGroup);
		return new Buffer(bytes);
	},*/
	_tryParse: function(buffer, constructor) {
		var fromId = new InsteonId(buffer[0], buffer[1], buffer[2]);
		var toId = new InsteonId(buffer[3], buffer[4], buffer[5]);
		var messageFlags = buffer[6];
		var command1 = buffer[7];
		var command2 = buffer[8];

		return New(constructor, fromId, toId, messageFlags, command1, command2);
	},
	functions: {
		isAcknowledgement: bitValuePropertyFunction('messageFlags', 5),
		isExtended: bitValuePropertyFunction('messageFlags', 4)
	}
});