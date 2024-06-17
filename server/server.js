import websocket from "websocket";
import http from "http";
import {sha512} from "hash-wasm";
import log from "loglevel";

async function start() {
    const logger = log.getLogger("server");
    logger.setLevel("DEBUG", false);
    const WebSocketServer = websocket.server;
    //const http = require('http');
    //const sha512 = require('hash-wasm').sha512;
    const connections = new Map();
    const server = http.createServer(function (request, response) {
        logger.info((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });
    server.listen(8080, function () {
        logger.info((new Date()) + ' Server is listening on port 8080');
    });

    const wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });

    function originIsAllowed(origin) {
        return origin.indexOf('deepdiagram') > -1;
    }

    wsServer.on('request', async (request) => {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            logger.error((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
        }
        try {

            const connection = request.accept('echo-protocol', request.origin);
            const hash = await sha512(connection.socket.remoteAddress + '-' + connection.socket.remotePort);
            connections.set(hash, {connection: connection, db: null});


            logger.info((new Date()) + ' Connection accepted.', connections.length);
            connections.forEach((conn, key) => {
                if (key != hash) {
                    conn.connection.sendUTF('{ "type": "newconnect", "netAttr": "' + hash + '" }');
                }
            });


            connection.on('message', function (message) {
                logger.debug(message);
                if (message.type === 'utf8') {
                    logger.debug('Received Message: ' + message.utf8Data);
                    connections.forEach((conn, index) => {
                        const envelope = JSON.parse(message.utf8Data);
                        if (index !== hash) {
                            if (envelope.db === conn.db) {
                                envelope.netAddr = hash;
                                conn.connection.sendUTF(JSON.stringify(envelope));
                            }
                        } else {
                            if (!conn.db && envelope.db) {
                                conn.db = envelope.db;
                                logger.debug('DB set to ' + envelope.db);
                            }
                        }
                    });
                    //connection.sendUTF(message.utf8Data);
                } else if (message.type === 'binary') {
                    logger.debug('Received Binary Message of ' + message.binaryData.length + ' bytes');
                    connections.forEach((conn, index) => {
                        if (index !== hash) {
                            conn.connection.sendBytes(message.utf8Data);
                        }
                    });
                }

            });
            connection.on('close', function (reasonCode, description) {
                connections.delete(hash);
                connections.forEach((conn, index) => {
                    conn.connection.sendUTF('{ "type": "close", "netAddr": "' + hash + '" }');
                });
            });
            connection.on('error', function (reasonCode, description) {
                connections.delete(hash);
                connections.forEach((conn, index) => {
                    conn.connection.sendUTF('{ "type": "error", "netAddr": "' + hash + '" }');
                });
                logger.info((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.', connections.length);
            });
            setInterval(() => {
                const message = `{ "count": ${connections.size} }`
                logger.debug(message);
                connection.sendUTF(message);
            }, 10000);
        } catch (err) {
            console.log(err);
        }


    });
}

start();