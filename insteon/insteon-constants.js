var InsteonConstants = module.exports = {

// http://www.insteon.com/pdf/insteon_devcats_and_product_keys_20081008.pdf
	deviceCategory: {
		0x00: {
			category: 'Generalized Controller',
			0x04: 'ControLinc',
			0x05: 'RemoteLinc',
			0x06: 'Icon Tabletop Controller',
			0x08: 'EZBridge/EZServer',
			0x09: 'SignaLinc RF Signal Enhancer',
			0x0A: 'Balboa Instrument\'s Poolux LCD Controller',
			0x0B: 'Access Point',
			0x0C: 'IES Color Touchscreen',
			0x0D: 'SmartLabs Key FOB'
		},
		0x01: {
			category: 'Dimmable Lighting Control',
			0x00: 'LampLinc V2',
			0x01: 'SwitchLinc V2 Dimmer 600 watt',
			0x02: 'In-LineLinc Dimmer',
			0x03: 'Icon Switch Dimmer',
			0x04: 'SwitchLinc V2 Dimmer 1000 watt',
			0x05: 'KeyPadLinc Dimmer Countdown Timer',
			0x06: 'LampLinc 2-Pin',
			0x07: 'IconLampLinc V2 2-Pin',
			0x08: 'SwitchLinc Dimmer Count-down Timer',
			0x09: 'KeypadLinc Dimmer',
			0x0A: 'Icon In-Wall Controller',
			0x0B: 'Access Point LampLinc',
			0x0C: 'KeypadLinc Dimmer - 8-Buttont defaulted mode',
			0x0D: 'SocketLinc',
			0x0E: 'LampLinc Dimmer, Dual-Band',
			0x13: 'ICON SwitchLinc Dimmer for Lixar/Bell Canada',
			0x17: 'ToggleLinc Dimmer',
			0x18: 'Icon SL Dimmer Inline Companion',
			0x19: 'SwitchLinc 800 watt',
			0x1A: 'In-LineLinc Dimmer with Sense',
			0x1B: 'KeypadLinc 6-button Dimmer',
			0x1C: 'KeypadLinc 8-button Dimmer',
			0x1D: 'SwitchLinc Dimmer 1200 watt',
			0x20: 'SwitchLinc Dimmer'
		},
		0x02: {
			category: 'Switched Lighting Control',
			0x05: 'KeypadLinc Relay - 8-Button defaulted mode',
			0x06: 'Outdoor ApplianceLinc',
			0x07: 'TimerLinc',
			0x08: 'OutletLinc',
			0x09: 'ApplianceLinc',
			0x0A: 'SwitchLinc Relay',
			0x0B: 'Icon On Off Switch',
			0x0C: 'Icon Appliance Adapter',
			0x0D: 'ToggleLinc Relay',
			0x0E: 'SwitchLinc Relay Countdown Timer',
			0x0F: 'KeypadLinc On/Off Switch',
			0x10: 'In-LineLine Relay',
			0x11: 'EZSwitch30 (240V, 30A load controller)',
			0x12: 'Icon SL Relay Inline Companion',
			0x13: 'ICON SwitchLinc Relay for Lixar/Bell Canada',
			0x14: 'In-Line Relay with Sense',
			0x15: 'SwitchLinc Relay with Sense'
		},
		0x03: {
			category: 'Network Bridge',
			0x01: 'PowerLinc Serial',
			0x02: 'PowerLinc USB',
			0x03: 'Icon PowerLinc Serial',
			0x04: 'Icon PowerLinc USB',
			0x05: 'SmartLabs PowerLinc Modem Serial',
			0x06: 'SmartLabs IR to Insteon Interface',
			0x07: 'SmartLabs IRLinc - IR Transmitter Interface',
			0x08: 'SmartLabs Bi-Directional IR-Insteon Interface',
			0x09: 'SmartLabs RF Developer\'s Board',
			0x0A: 'SmartLabs PowerLinc Modem Ethernet',
			0x0B: 'SmartLabs PowerLinc Modem USB',
			0x0C: 'SmartLabs PLM Alert Serial',
			0x0D: 'SimpleHomeNet EZX10RF',
			0x0E: 'X10 TW-523/PSC05 Translator',
			0x0F: 'EZX10IR (X10 IR receiver, Insteon controller and IR distribution hub)',
			0x10: 'SmartLinc 2412N INSTEON Central Controller',
			0x11: 'PowerLinc - Serial (Dual Band',
			0x12: 'RF Modem Card',
			0x13: 'PowerLinc USB - HouseLinc 2 enabled',
			0x14: 'PowerLinc Serial - HouseLinc 2 enabled'
		},
		0x04: {
			category: 'Irrigation Control',
			0x00: 'Compacta EZRain Sprinkler Controller'
		},
		0x05: {
			category: 'Climate Control',
			0x00: 'Broan SMSC080 Exhaust Fan',
			0x01: 'Compacta EZTherm',
			0x02: 'Broan SMSC110 Exhaust Fan',
			0x03: 'INSTEON Thermostat Adapter',
			0x04: 'Compacta EZThermx Thermostat',
			0x05: 'Broan, Venmar, BEST Rangehoods',
			0x06: 'Broan SmartSense Make-up Damper'
		},
		0x06: {
			category: 'Pool and Spa Control',
			0x00: 'Compacta EZPool',
			0x01: 'Low-end pool controller (Temp. Eng. Project name)',
			0x02: 'Mid-Range pool controller (Temp. Eng. Project name)',
			0x03: 'Next Generation pool controller (Temp. Eng. Project name)',
		},
		0x07: {
			category: 'Sensors and Actuators',
			0x00: 'IOLinc',
			0x01: 'Compacta EZSns1W Sensor Interface Module',
			0x02: 'Compacta EZIO8T I/O Module',
			0x03: 'Compacta EZIO2X4 #5010D INSTEON / X10 Input/Output Module',
			0x04: 'Compacta EZIO8SA I/O Module',
			0x05: 'Compacta EZSnsRF $5010E RF Receiver Interface Module for Dakota Alerts Products',
			0x06: 'Compacta EZISnsRf Sensor Interface Module',
			0x07: 'EZIO6I (6 inputs)',
			0x08: 'EZIO4O (4 relay outputs)'
		},
		0x08: {
			category: 'Home Entertainment'
		},
		0x09: {
			category: 'Energy Management',
			0x00: 'Compacta EZEnergy',
			0x01: 'OnSitePro Leak Detector',
			0x02: 'OnSitePro Control Valve',
			0x03: 'Energy Inc. TED 5000 Single Phase Measuring Transmitting Unit (MTU)',
			0x04: 'Energy Inc. TED 5000 Gateway - USB',
			0x05: 'Energy Inc. TED 5000 Gateway - Ethernet',
			0x06: 'Energy Inc. TED 3000 Three Phase Measuring Transmitting Unit (MTU)'
		},
		0x0A: {
			category: 'Built-In Appliance Control'
		},
		0x0B: {
			category: 'Plumbing'
		},
		0x0C: {
			category: 'Communications'
		},
		0x0D: {
			category: 'Computer Control'
		},
		0x0E: {
			category: 'Window Coverings',
			0x00: 'Somfy Drape Controller RF Bridge'
		},
		0x0F: {
			category: 'Access Control',
			0x00: 'Weiland Doors\' Central Drive and Controller',
			0x01: 'Weiland Doors\' Secondary Central Drive',
			0x02: 'Weiland Doors\' Assist Drive',
			0x03: 'Weiland Doors\' Elevation Drive'
		},
		0x10: {
			category: 'Security, Health, Safety',
			0x00: 'First Alert ONELink RF to Insteon Bridge',
			0x01: 'Motion Sensor',
			0x02: 'TriggerLinc - INSTEON Open / Close Sensor'
		},
		0x11: {
			category: 'Surveillance'
		},
		0x12: {
			category: 'Automotive'
		},
		0x13: {
			category: 'Pet Care'
		},
		0x14: {
			category: 'Toys'
		},
		0x15: {
			category: 'Timekeeping'
		},
		0x16: {
			category: 'Holiday'
		},
	},


// message flags: bits 7 and 6 control broadcast, 4 is extended message,
// IM Configuration Flags: bit 7 = 1 disables automatic linking when the user pushes and holds the SET Button
//                         bit 6 = 1 puts the IM into monitor mode
//                         bit 5 = 1 disables automatic LED operation by the IM, can now set via LED on and led off commands
//                         bit 4 = 1 disable host communications deadman feature; allow host to delay more than 240 ms between sending bytes
//                         bits 3-0 reserved fo rinternal use. SET TO 0
	START_COMMAND: 0x02,
	RX_ACK: 0x06,
	RX_NAK: 0x15
};

var COMMAND_RX_STANDARD = 0x50;
var COMMAND_RX_EXTENDED = 0x51;
var COMMAND_RX_X10 = 0x52;
var COMMAND_RX_ALLLINK_COMPLETE = 0x53;
var COMMAND_RX_BUTTON_EVENT = 0x54;

COMMAND_RX_BUTTON_EVENT.SET_TAPPED = 0x02;
COMMAND_RX_BUTTON_EVENT.SET_HELD = 0x03;
COMMAND_RX_BUTTON_EVENT.BUTTON2_TAPPED = 0x12;
COMMAND_RX_BUTTON_EVENT.BUTTON2_HELD = 0x13;
COMMAND_RX_BUTTON_EVENT.BUTTON2_RELEASED_AFTER_HOLD = 0x14;
COMMAND_RX_BUTTON_EVENT.BUTTON3_TAPPED = 0x22;
COMMAND_RX_BUTTON_EVENT.BUTTON3_HELD = 0x54;
COMMAND_RX_BUTTON_EVENT.BUTTON3_RELEASED_AFTER_HOLD = 0x24;

var COMMAND_RX_USER_RESET = 0x55; // User pushed and held IM's SET Button on power up. this is a FACTORY RESET
var COMMAND_RX_ALLLINK_CLEANUP_FAILURE_REPORT = 0x56; // 0x02 0x56 <0x01> <ALL-Link Group> <ID high byte> <ID middle byte> <ID low byte>
var COMMAND_RX_ALLLINK_RECORD_RESPONSE = 0x57; // 0x02 0x57 <ALL-Link Record Flags> <ALL-Link Group> <ID high byte> <ID middle byte> <ID low byte> <Link Data 1> <Link Data 2> <Link Data 3>
var COMMAND_RX_ALLLINK_CLEANUP_STATUS_REPORT = 0x58;
COMMAND_RX_ALLLINK_CLEANUP_STATUS_REPORT.COMPLETED = 0x06;
COMMAND_RX_ALLLINK_CLEANUP_STATUS_REPORT.ABORTED = 0x15; // aborted due to INSTEON traffic



var COMMAND_TX_GET_IM_INFO = 0x60;
var COMMAND_TX_SEND_ALLLINK_COMMAND = 0x61; // 0x02 0x61 <ALL-Link Group> <ALL-Link Command> <0xFF | 0x00>
var COMMAND_TX_MESSAGE = 0x62;  // standard: 0x02 0x62 <6 bytes standard message, excluding From Address>
                                //    0x02 0x62 <to address high> <to address middle> <to address low> <message flags, w bit 4 0> <command 1> <command 2>
								// extended: <0x02 0x62 <20 bytes, exclude From Address>
								//    0x02 0x62 <to address high> <to address middle> <to address low> <message flags, w bit 4 1> <command 1> <command 2> <14 bytes user data>
var COMMAND_TX_X10 = 0x63; // <0x02 0x63 <Raw X10> <X10 Flag>
var COMMAND_TX_START_ALLLINKING = 0x64; // 0x02 0x64 <0x00 (IM is Responder) | 0x01 (IM is Controller) | 0x03 (IM is either) | 0xFF (Link Deleted)> <ALL-Link Group>
COMMAND_TX_START_ALLLINKING.IM_IS_RESPONDER = 0x00;
COMMAND_TX_START_ALLLINKING.IM_IS_CONTROLLER = 0x01;
COMMAND_TX_START_ALLLINKING.IM_IS_EITHER = 0x03;
COMMAND_TX_START_ALLLINKING.DELETE_LINK = 0xFF;
var COMMAND_TX_CANCEL_ALLLINKING = 0x65;
var COMMAND_TX_SET_HOST_DEVICE_CATEGORY = 0x66; // 0x02 0x66 <Device Category> <Device Subcategory> <oxFF | Firmware Revision>
var COMMAND_TX_RESET = 0x67;
var COMMAND_TX_SET_ACK = 0x68; // 0x02 0x68 <Command 2 Data>
var COMMAND_TX_GET_FIRST_ALLLINK_RECORD = 0x69;
var COMMAND_TX_GET_NEXT_ALLLINK_RECORD = 0x6A;
var COMMAND_TX_SET_IM_CONFIGURATION = 0x6B; //0x02 0x6B <IM Configuration Flags>
var COMMAND_TX_GET_ALLLINK_RECORD_FOR_SENDER = 0x6C;
var COMMAND_TX_LED_ON = 0x6D;
var COMMAND_TX_LED_OFF = 0x6E;
var COMMAND_TX_MANAGE_ALLLINK_RECORD = 0x6F; // 0x02 0x6F <Control Flags> <ALL-Link Record Flags> <ALL-Link Group> <ID high byte> <ID middle> <ID low> <Link data 1> <link data 2> <link data 3>
var COMMAND_TX_SET_NAK = 0x70; // 0x02 0x70 <command 2 data>
var COMMAND_TX_SET_ACK_TWO_BYTE = 0x71; // 0x02 0x71 <Command 1 Data> <Command 2 Data>
var COMMAND_TX_RF_SLEEP = 0x72;
var COMMAND_TX_GET_IM_CONFIGURATION = 0x73; // 0 RESPONSE: x02 0x73 <IM Configuration Flags> <Spare 1> <Spare 2> <0x06: