const degToRad = Math.PI / 180,
    socket = io();

Alpine.store('app', {
    roll: true,
    toggleRoll() {
        this.roll = !this.roll;
        if (!this.roll){
            document.getElementById('recliner').object3D.rotation.set(store.pitch ? lastX : 0, 0, 0);
            document.getElementById('room').rerender();
        }
    },
    pitch: true,
    togglePitch() {
        this.pitch = !this.pitch;
        if (!this.pitch){
            document.getElementById('recliner').object3D.rotation.set(0, 0, store.roll ? lastZ : 0);
            document.getElementById('room').rerender();
        }
    },
    center() {
        tareY = lastY;
        document.getElementById('recliner').object3D.rotation.set(store.pitch ? lastX : 0, 0, store.roll ? lastZ : 0);
        document.getElementById('room').rerender();
    }
});

const store = Alpine.store('app');

let cameraRotation,
    tareY = 0,
    lastX = 0, lastY = 0, lastZ = 0;


function initCamera(yaw, firstConnect) {
    if (!cameraRotation) {
        let camera = document.getElementById('camera');
        cameraRotation = camera && camera.object3D && camera.object3D.rotation;
        cameraRotation && (cameraRotation.order = 'YXZ');
        tareY = yaw;
        window.dispatchEvent(new Event('resize'));
    } else if (firstConnect) {
        tareY = yaw;
    }
}

function setCamera(vecArr) {
    const newY = vecArr[1];

    initCamera(newY, vecArr[3]);

    if (cameraRotation) {
        const newX = vecArr[0], newZ = vecArr[2];

        lastX = newX;
        lastY = newY;
        lastZ = newZ;
        cameraRotation.set(
            store.pitch ? newX : 0,
            newY - tareY,
            store.roll ? newZ : 0
        );
    }
}

//headset IMU data was normalized on the backend before it got here
io().on('cam', setCamera);

const isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

window.addEventListener("deviceorientation", (event) => {
    //station (e.g. android phone) IMU data is normalized here depending on the control type
    if (event.beta !== null) {
        if (isAndroid) {
            //just acts like a pointer at the moment
            setCamera([event.beta * degToRad, event.alpha * degToRad, 0]);

            //TODO: head mounted option including roll
            //setCamera([event.beta*degToRad, event.alpha*degToRad, event.gamma*-degToRad])
        } else {
            //TODO: some laptops also detect motion (usually at a low polling rate).
            // Combined with headset 3DoF, the laptop (or other computer) could be a body anchor that moves the workspace while the user is walking and turning
            // This can be a really useful feature/alternative to 6DoF that isn't currently offered by other software

            //TODO: iOS, iPadOS can go here when AirPlay is easier to use
        }
    }
});

window.headset = {};
['powersaver'].forEach(fn => {
    headset[fn] = data => {
        socket.emit(fn, data);
    }
})