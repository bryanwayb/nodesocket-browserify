
function NodeSocketClient(port, ipaddress, options) {
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

NodeSocketClient.prototype.emit = function(eventName) { // Takes the place of the EventEmitter in the NodeJS API, keeps some code the same
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