let cameraRotation;

io().on('cam', function(data){
    if (!cameraRotation) {
        let camera = document.getElementById('camera');
        cameraRotation = camera && camera.object3D && camera.object3D.rotation;
        cameraRotation && (cameraRotation.order = 'YXZ');
    }
    if (cameraRotation) {
        cameraRotation.set(data[0], data[1], data[2]);
    }
});


const socket = io();
window.headset = {};

['center', 'sphere', 'powersaver'].forEach(fn => {
    headset[fn] = data => {
        socket.emit(fn, data);
    }
})