
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
};function NodeSocketClient(port, ipaddress, options) {
	this._options = options;
	this._port = port;
	this._ipaddress = ipaddress;
	this._socket = undefined;
	this._functions = { };
	this._state = NodeSocketCommon.EnumConnectionState.Disconnected;
	this._master = false;
	
	this._processCallback = undefined;
	this._processQueue = [];
}

NodeSocketClient.prototype.emit = function(eventName) {
	var onName = 'on' + eventName;
	if(onName in this) {
		this[onName].apply(this, Array.prototype.slice.call(arguments, 1));
	}
	else if(eventName === 'error' && arguments[1] instanceof Error) {
		throw arguments[1];
	}
};

NodeSocketClient.prototype.requestMaster = function() {
	if(this._state === NodeSocketCommon.EnumConnectionState.Verified) {
		this._socket.send(String.fromCharCode(NodeSocketCommon.EnumExecutionCode.RequestMaster));
		this._master = true;
	}
	else {
		this.emit('error', new Error('A master request must be done over an idle connection'), this._socket);
		return false;
	}
	
	return true;
};

NodeSocketClient.prototype.requestSlave = function() {
	if(!this._options.denyMasterRequests) {
		if(this._state === NodeSocketCommon.EnumConnectionState.Verified) {
			this._master = false;
			this._socket.send(String.fromCharCode(NodeSocketCommon.EnumExecutionCode.RequestSlave));
		}
		else {
			this.emit('error', new Error('A slave request must be done over an idle connection'), this._socket);
			return false;
		}
	}
	else {
		self.emit('error', new Error('Unable to request as a slave when the current connection denies a remote master'), this._socket);
		return false;
	}
	
	return true;
};

NodeSocketClient.prototype._nodeDataReceived = function(buffer) {
	this.emit('data', this._socket, buffer);
	
	var bufferPosition = buffer.length;
	if(this._state === NodeSocketCommon.EnumConnectionState.Connected) {
		if(NodeSocketCommon.nodesocketSignature === buffer) {
			this._state = NodeSocketCommon.EnumConnectionState.Verified;
			bufferPosition = NodeSocketCommon.nodesocketSignature.length;
			
			this.requestMaster();
			
			this.emit('verified', this._socket);
		}
	}
};

NodeSocketClient.prototype._nodeSocketError = function(event) {
	console.log(event);
};

NodeSocketClient.prototype._nodeClosed = function(event) {
	console.log(event);
};

NodeSocketClient.prototype._nodeConnected = function() {
	this._state = NodeSocketCommon.EnumConnectionState.Connected;
	
	var self = this;
	this._socket.onmessage = function(event) {
		self._nodeDataReceived.call(self, event.data);
	};
	
	this._socket.onerror = function(event) {
		self._nodeSocketError.call(self, event);
	};
	
	this._socket.onclose = function(event) {
		self._nodeClosed.call(self, event);
	};
	
	this._socket.send(NodeSocketCommon.nodesocketSignature);
};

NodeSocketClient.prototype.connect = function() {
	this._socket = new WebSocket('ws://' + this._ipaddress + ':' + this._port, 'nodesocket');
	
	var self = this;
	this._socket.onopen = function() {
		self._nodeConnected.call(self);
	};
};