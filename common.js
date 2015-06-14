
function ProcessQueue(thisArg, method, args) {
	this._thisArg = thisArg;
	this._method = method;
	this._args = args;
}

ProcessQueue.prototype.execute = function() {
	this._method.apply(this._thisArg, this._args);
};

var NodeSocketCommon = {
	nodesocketSignature: 'nsockv01',

	EnumConnectionState: {
		Disconnected:		0x0,
		Connected:			0x1,
		Verified:			0x2,
		Processing:			0x3,
		WebSocketConnected:	0x4,
		_max:				0x5
	},
	EnumExecutionCode: {
		RequestMaster:	0x0,
		RequestSlave:	0x1,
		ExecFunction:	0x2,
		_max: 			0x3
	},
	EnumDataType: {
		'byte':		0x0,
		'ubyte':	0x1,
		'short':	0x2,
		'ushort':	0x3,
		'int':		0x4,
		'uint':		0x5,
		'float':	0x6,
		'double':	0x7,
		'string':	0x8,
		'boolean':	0x9,
		_max: 		0xA
	},
	EnumNodeResponse: {
		Okay:				0x0,
		NoResult:			0x1, // Still 'ok', just don't read the result stream, there's nothing there
		InvalidFunction:	0x2,
		NodeError:			0x3,
		InvalidExecCode:	0x4,
		NotAllowed:			0x5,
		_max: 				0x6
	},
	EnumNodeResponseErrorString: {
		0x0: 'Okay',
		0x1: 'Okay',
		0x2: 'An invalid function was specified',
		0x3: 'Node reported an internal error',
		0x4: 'An invalid execution code was specified',
		0x5: 'Remote functions are not allowed from this node, remote is the current master',
	},
	ProcessQueue: ProcessQueue
};