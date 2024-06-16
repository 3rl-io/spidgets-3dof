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
        let counter = 0, frames = 0;

        setInterval(() => {
            setCamera(data[counter % count])
            counter++
            requestAnimationFrame(() => {
                frames++;
            })
        }, 16);
        setInterval(() => {
            console.log((frames/3).toFixed(0));
            frames = 0;
        }, 3000);
    });