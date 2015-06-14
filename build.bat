@echo off

mkdir .\build
type common.js > .\build\nodesocket.js
type client.js >> .\build\nodesocket.js

java -jar bin/yuicompressor.jar .\build\nodesocket.js > .\build\nodesocket.min.js

@echo on