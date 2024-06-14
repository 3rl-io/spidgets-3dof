const args = process.argv.slice(2),
    fs = require('node:fs'),
    express = require('express'),
    http = require('http').Server(
        express().use('/', express.static('./webroot'))
    ),
    io = require('socket.io')(http);

let connected = false,
    calibrating = false,
    calStartY = 0,
    drift = 0,
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
    if (eio.clientsCount && !calibrating) {
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
            rawX = parseFloat(eulers[2]);
            rawY = parseFloat(eulers[3]);

            if (!connected) {
                console.log('Headset connected');
                connected = true;
            }

            if (calibrating && !calStartY) {
                calStartY = rawY;
            }

            skipFrame = !skipFrame;
            if (skipFrame && powerSaver) {return}

            const totalDrift = (Date.now() - tareTime) * drift;
            broadcastCam(rawX-tareX, tareY + totalDrift - rawY, tareZ - rawZ);
        } else {
            rawX = rawY = rawZ = 0;
            broadcastCam(0, 0, 0);
        }
    });

    spawned.on('close', () => {
        console.log('Headset disconnected');
        connected = false;
        calibrating = false;
        setTimeout(() => {
            _respawn(_runCmd());
        }, 3000);
    });
})(_runCmd());

http.listen(8000);
console.log('Listening on http://localhost:8000');

function calibrate() {
    console.log('Place the headset upright on a flat surface. Calibration starts in 5 seconds. UI motion paused for 1 minute...');
    setTimeout(() => {
        calibrating = true;
        console.log('Started yaw drift measurement. 55 seconds remaining.');
    }, 5000);
    setTimeout(() => {
        calibrating && console.log('30 seconds remaining.');
    }, 30000);
    setTimeout(() => {
        if (calibrating) {
            let temp = rawY - calStartY;
            if (temp > Math.PI) { temp -= 2*Math.PI }
            else if (temp < -Math.PI) { temp += 2*Math.PI }
            drift = temp/55000;
            fs.writeFile('drift', drift.toFixed(11), err => {
                if (err) { console.error(err) } else {
                    console.log(`Calibration saved. Resuming UI motion`);
                }
                calibrating = false;
            });
        }
    }, 60000);
}


if (args.includes('--cal')) {
    calibrate();
} else {
    fs.readFile('drift', 'utf8', (err, data) => {
        if (err || !data) {
            console.log(`First time setup detected...`);
            calibrate();
        } else {
            drift = parseFloat(data);
        }
    });
}