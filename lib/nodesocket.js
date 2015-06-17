var NodeSocketClient = require('../node_modules/nodesocket/lib/client.js'),
	NodeSocketCommon = require('../node_modules/nodesocket/lib/common.js'),
	util = require('util');

NodeSocketClient.prototype._write = function(buffer) {
	this._socket.send(buffer);
};

NodeSocketClient.prototype._nodeServerVerified = function() { };

NodeSocketClient.prototype._nodeConnected = function(socket) {
	this._state = NodeSocketCommon.EnumConnectionState.Connected;
	this.emit('connect', socket);
	
	var self = this;
	
	socket.onmessage = function(event) {
		self._nodeDataReceived.call(self, new Buffer(event.data));
	};
	
	socket.onclose = function(event) {
		self._nodeClosed.call(self, socket, !event.wasClean);
	};
	
	socket.onerror = function(event) {
		self._nodeSocketError.call(self, socket, event);
	};
	
	this._write(NodeSocketCommon.nodesocketSignature);
};

NodeSocketClient.prototype.connect = function() {
	var socket = new WebSocket('ws://' + this._ipaddress + ':' + this._port, 'nodesocket');
	
	var self = this;
	socket.onopen = function() {
		self._nodeConnected.call(self, socket);
	};
	
	this._socket = socket;
};

NodeSocketClient.prototype.close = function() {
	if(this._socket) {
		this._socket.close();
	}
	else {
		this.emit('error', new Error('Unable to stop client, no client instance available'));
		return false;
	}
	
	return true;
};

global.NodeSocketClient = module.exports = NodeSocketClient;