const platform = navigator.userAgentData?.platform || navigator?.platform;

Alpine.store('app', {
    fps: '&nbsp;',
    color: 'white',
    os: '&nbsp;',
    compatWith: '&nbsp;',
    compatColor: 'lime',
    stressLoaded: false,
    stress: 0,
    playing: true,
    android: (navigator.userAgent.toLowerCase().indexOf("android") > -1) || (platform.includes('Linux a')),
    open(url) {
        window.open(url, '_blank')
    },
    center() {
        tareAlpha = lastAlpha;
        tareBeta = lastBeta;
    }
});
const store = Alpine.store('app');

if (store.android) {
    store.os = 'Android'
    store.compatWith = 'All headsets';
} else if (platform.includes('Win')) {
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
        window.dispatchEvent(new Event('resize'));
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
            if (store.playing && !store.android) {
                setCamera(data[counter % count])
                counter++
            }
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

const degToRad = Math.PI / 180;
let tareAlpha = 0, lastAlpha = 0,
    tareBeta = 0, lastBeta = 0;

window.addEventListener("deviceorientation", (event) => {
    //station (e.g. android phone) IMU data is normalized here depending on the control type
    if (event.beta !== null) {
        if (store.android) {
            lastAlpha = event.alpha;
            lastBeta = event.beta;
            //just acts like a pointer at the moment
            if (!tareAlpha) {
                tareAlpha = lastAlpha;
            }
            if (!tareBeta) {
                tareBeta = lastBeta;
            }

            setCamera([(lastBeta - tareBeta) * degToRad, (lastAlpha - tareAlpha) * degToRad, 0]);

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