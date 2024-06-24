const socket = io();

Alpine.store('app', {
    roll: true,
    pitch: true,
    sphere() {
        socket.emit('sphere');
    }
});
const store = Alpine.store('app');


let cameraRotation, lastX = 0, lastY = 0, skipCount = 0, totalCount = 0;

io().on('cam', function(data){
    if (!cameraRotation) {
        let camera = document.getElementById('camera');
        cameraRotation = camera && camera.object3D && camera.object3D.rotation;
        cameraRotation && (cameraRotation.order = 'YXZ');
    }
    if (cameraRotation) {
        const newX = data[0], newY = data[1];
        totalCount++;

        if (Math.abs(newX - lastX) + Math.abs(newY - lastY) > .001) {
            lastX = newX;
            lastY = newY;
            cameraRotation.set(
                store.pitch ? newX : 0,
                newY,
                store.roll ? data[2] : 0
            );
        } else {
            skipCount++;
            if (totalCount > 180) {
                //TODO: inactivity/power save tracking
                //console.log((skipCount*100/totalCount).toFixed(0));
                totalCount = skipCount = 0;
            }

        }
    }
});

window.headset = {};
['center', 'sphere', 'powersaver'].forEach(fn => {
    headset[fn] = data => {
        socket.emit(fn, data);
    }
})