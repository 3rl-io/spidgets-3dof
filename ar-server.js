const express = require('express'),
    http = require('http').Server(
        express().use('/', express.static('./webroot'))
    ),
    io = require('socket.io')(http);

let connected = false,
    rawX = 0, rawY = 0, rawZ = 0,
    tareX = 0, tareY = 0, tareZ = 0,
    tareTime = Date.now(),
    powerSaver = false,
    skipFrame = false;

function center(type) {
    if (type === 'sphere') {
        tareX = rawX;
        tareZ = rawZ;
    } else {
        tareX = tareZ = 0;
    }
    tareY = rawY;
    tareTime = Date.now();
}

io.on('connection', socket => {
    center();
    socket.on('center', center);
    socket.on('sphere', () => center('sphere'));
    socket.on('powersaver', state => {powerSaver = !!state});
});

const eio = io.sockets.server.eio;
function broadcastCam(x,y,z) {
    if (eio.clientsCount) {
        io.emit('cam', [x,y,z]);
    }
}

function _runCmd() {
    return require('child_process').spawn('bin/euler_60', {shell: process.platform !== 'win32'});
}

(function _respawn(spawned) {
    spawned.on('error', err => {
        console.log(`Failed to start euler_60: ${err}`);
    });
    spawned.stdout.on('data', data => {
        const eulers = data.toString().split(/\s+/);
        rawZ = parseFloat(eulers[1]);
        if (!isNaN(rawZ)) {
            if (!connected) {
                console.log('Headset connected');
                connected = true;
            }

            skipFrame = !skipFrame;
            if (skipFrame && powerSaver) {return}

            rawX = parseFloat(eulers[2]);
            rawY = parseFloat(eulers[3]);

            //seconds to drift 1 degree = 5.4
            const drift = (Date.now() - tareTime)*.001*Math.PI/(5.4*180);

            broadcastCam(rawX-tareX, tareY + drift - rawY, tareZ - rawZ);
        } else {
            rawX = rawY = rawZ = 0;
            broadcastCam(0, 0, 0);
        }
    });

    spawned.on('close', () => {
        console.log('Headset disconnected');
        setTimeout(() => {
            _respawn(_runCmd());
        }, 3000);
    });
})(_runCmd());

http.listen(8000);
console.log('Listening on http://localhost:8000');