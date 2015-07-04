NodeSocket for Browsers
==

A network protocol for an execution space amongst application instances, via a slave to master relationship.

Basic Use
--
Since this library is a working web browser version of the NodeJS version, almost all the functionality remains the same (minus the server functionality and a few key differences, which will be pointed out).

Here's a simple example:
```JavaScript
var client = nodesocket().createClient(8080, 'localhost');

var example = client.linkFunction('example');

client.connect();

client.on('verified', function() {
	example(function(res) {
		console.log('Returned!!! WOOT!! ' + res);
	}, 'Passed from the client');
});
```

NodeJS vs Browser version
==
Aside from the following differences, all functionality is the same as the NodeJS version.

* Server functionality is unavailable.
* TLS/SSL is handled by the browser, so the respective NodeJS API options will have no effect.
* Socket based options, such as keep alive and timeout, will also not be effective.