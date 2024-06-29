const args = process.argv.slice(2),
    fs = require('node:fs'),
    express = require('express'),
    http = require('http').Server(
        express().use('/', express.static('./webroot'))
    ),
    io = require('socket.io')(http),
    eio = io.sockets.server.eio;

function emit(event, data) {
    eio.clientsCount && io.emit(event, data);
}

function log(msg){
    console.log(msg);
    emit('status', msg);
}

let connected = false,
    calibrating = false,
    calStartY = 0,
    rawY = 0,
    drift = 0,
    tareTime = Date.now(),
    powerSaver = false,
    skipFrame = false,
    recordingTestData = false,
    testData = [];

io.on('connection', socket => {
    socket.on('powersaver', state => {powerSaver = !!state});
    socket.on('calibrate', calibrate);
});

function broadcastCam(x,y,z, firstConnect) {
    !calibrating && emit('cam', [x,y,z, firstConnect]);
    recordingTestData && testData.push([x,y,z])
}

function _runCmd() {
    let cmd = 'bin/euler_60';
    if (process.platform === 'darwin') {
        cmd = 'bin/euler_60_apple_silicon';
    }
    return require('child_process').spawn(cmd, {shell: process.platform !== 'win32'});
}

(function _respawn(spawned) {
    spawned.on('error', err => {
        log(`Failed to start euler_60: ${err}`);
    });
    spawned.stdout.on('data', data => {
        const eulers = data.toString().split(/\s+/);
        const rawZ = parseFloat(eulers[1]);
        if (!isNaN(rawZ)) {
            const rawX = parseFloat(eulers[2]);
            rawY = parseFloat(eulers[3]);

            let firstConnect = false;

            if (!connected) {
                log('Headset connected');
                firstConnect = true;
                connected = true;
            }

            if (calibrating && !calStartY) {
                calStartY = rawY;
            }

            skipFrame = !skipFrame;
            if (skipFrame && powerSaver) {return}

            const totalDrift = (Date.now() - tareTime) * drift;
            broadcastCam(rawX, totalDrift - rawY, -rawZ, firstConnect);
        } else {
            broadcastCam(0, 0, 0);
        }
    });

    spawned.on('close', () => {
        if (connected) {
            log('Headset disconnected');
            connected = false;
        }
        if (calibrating) {
            log('Calibration cancelled');
            calibrating = false;
        }
        if (recordingTestData) {
            log('Recording cancelled');
            recordingTestData = false;
        }

        setTimeout(() => {
            _respawn(_runCmd());
        }, 3000);
    });
})(_runCmd());

let port = 8000,
    portIndex = args.indexOf('--port');
if (portIndex !== -1) {
    const newPort = parseInt(args[portIndex+1]);

    !isNaN(newPort) && (port = newPort);
}

http.listen(port);
console.log(`Listening on http://localhost:${port}`);

function calibrate() {
    log('Calibration starts in 5 seconds. UI motion paused for 1 minute');
    calStartY = 0;
    setTimeout(() => {
        calibrating = true;
        log('Started yaw drift measurement. 55 seconds remaining');
    }, 5000);
    setTimeout(() => {
        calibrating && log('30 seconds remaining');
    }, 30000);
    setTimeout(() => {
        calibrating && log('15 seconds remaining');
    }, 45000);
    setTimeout(() => {
        if (calibrating) {
            let temp = rawY - calStartY;
            if (temp > Math.PI) { temp -= 2*Math.PI }
            else if (temp < -Math.PI) { temp += 2*Math.PI }
            drift = temp/55000;
            fs.writeFile('drift', drift.toFixed(11), err => {
                if (err) { console.error(err) } else {
                    log(`Calibration saved. Resuming UI motion`);
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
            log(`First time setup detected`);
            calibrate();
        } else {
            drift = parseFloat(data);
        }
    });
}

if (args.includes('--record')) {
    log('Recording 10 seconds of test data, starting in 10 seconds');

    setTimeout(() => {
        recordingTestData = true;
        log('Started recording');
    }, 10000);

    setTimeout(() => {
        if (recordingTestData) {
            recordingTestData = false;
            fs.writeFile('webroot/compat/data.json', JSON.stringify(testData), err => {
                if (err) { console.error(err) } else {
                    log('Recording saved to ./webroot/compat/data.json');
                }
            });
        }
    }, 20000);
}