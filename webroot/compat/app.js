Alpine.store('app', {
    fps: '&nbsp;',
    color: 'white',
    os: '&nbsp;',
    compatWith: '&nbsp;',
    compatColor: 'lime',
    stress: 0,
    open(url) {
        window.open(url, '_blank')
    }
});
const store = Alpine.store('app');

let platform = navigator.userAgentData?.platform || navigator?.platform;

if (platform.includes('Win')) {
    store.os = 'Windows'
    store.compatWith = 'Rokid';
} else if (platform.includes('Linux')) {
    store.os = 'Linux';
    store.compatWith = 'Rokid, XREAL'
} else if (platform.includes('Mac')) {
    store.os = 'MacOS'
    store.compatWith = 'Rokid, XREAL'
} else {
    store.os = 'Unsupported'
    store.compatWith = 'Unsupported';
    store.compatColor = 'red'
}

let cameraRotation;

function setCamera(data){
    if (!cameraRotation) {
        let camera = document.getElementById('camera');
        cameraRotation = camera && camera.object3D && camera.object3D.rotation;
        cameraRotation && (cameraRotation.order = 'YXZ');
    }
    if (cameraRotation) {
        cameraRotation.set(data[0], data[1], data[2]);
    }
}

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const count = data.length;
        let counter = 0;

        setInterval(() => {
            setCamera(data[counter % count])
            counter++
        }, 16);

        let frames = 0;
        requestAnimationFrame(
            function loop(){
                frames++
                requestAnimationFrame(loop);
            }
        )

        setInterval(() => {
            const fps = frames/2;
            if (fps > 50) {
                store.color = 'lime';
            } else if (fps > 30) {
                store.color = 'yellow';
            } else {
                store.color = 'red';
            }
            store.fps = fps.toFixed(0);
            frames = 0;
        }, 2000)
    });