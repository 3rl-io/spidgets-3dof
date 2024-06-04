const express = require('express'),
    http = require('http').Server(
        express().use('/', express.static(__dirname + '/public'))
    ),
    io = require('socket.io')(http);

let rawX = 0, rawY = 0, rawZ = 0,
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


function _runCmd() {
    return require('child_process').spawn('target/release/examples/euler_60', {shell: true});
}

(function _respawn(spawned) {
    spawned.on('error', (err) => {
        console.log(`Failed to start euler_60: ${err}`);
    });
    spawned.stdout.on('data', (data) => {
        const eulers = data.toString().split(/\s+/);
        rawZ = parseFloat(eulers[1]);
        if (!isNaN(rawZ)) {
            skipFrame = !skipFrame;

            if (skipFrame && powerSaver) {return}

            rawX = parseFloat(eulers[2]);
            rawY = parseFloat(eulers[3]);

            let drift = (Date.now() - tareTime)*.001*Math.PI/(5.4*180);
            //console.log(((tareY + drift - rawY)*1.2).toFixed(5), (-rawY).toFixed(5));

            io.emit('cam', [
                rawX-tareX,
                //seconds to drift 1 degree = 5.4
                tareY + drift - rawY,
                tareZ - rawZ
            ]);
        } else {
            rawX = rawY = rawZ = 0;
            io.emit('cam', [0,0,0]);
        }
    });

    spawned.on('close', () => {
        console.log('glasses not found. retrying in 3 sec')
        setTimeout(() => {
            _respawn(_runCmd());
        }, 3000);
    });
})(_runCmd());

http.listen(8000);
console.log('Listening on http://localhost:8000');