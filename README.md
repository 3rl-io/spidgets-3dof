# spidgets-3dof

Example app for creating and displaying spatial widgets in a browser with 3 degrees of freedom

## System requirements

- Linux or MacOS
- One of these display glasses:
  * Rokid Air, Max
  * XREAL Air, Air 2, and Air 2 Pro, Light
- A modern laptop CPU (< 5 years old) can do 30+ FPS. It's even confirmed working on Raspberry Pi and Intel N100
- Note: FPS is capped to 60 until the settings menu UX is figured out

Soon: Windows compatibility and ease-of-use. Rokid Max is confirmed working on windows 11 x86. Waiting for confirmation on other hardware.

## Usage

### Linux/Mac

1. Clone this repo and open it in a terminal

2. Run `chmod u+x ./bin/ar-server`

3. Run `sudo ./bin/ar-server`

4. Browse to http://localhost:8000

Optional: Follow the udev step [here](https://github.com/3rl-io/headset-utils?tab=readme-ov-file#build-and-run) for non-su

### Windows

1. Clone this repo and open it in a terminal

2. Run `bin/ar-server`

3. Browse to http://localhost:8000

-----

Optional: Some third party websites (e.g. YouTube) need [this extension](https://chromewebstore.google.com/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe) in order to bypass restrictions caused by iframe headers. This may violate third party TOS or void warranties. Use at your own risk.

Soon: When stable, we can host an easier download/install process on a CDN + option to run in background on startup

### How it works:

1. Rust-based executable `euler_60` reads the raw sensor data from the glasses and outputs euler anglers (i.e. roll, pitch, and yaw) at 60Hz. [Source](https://github.com/3rl-io/headset-utils)

2. nodejs-based process `ar-server` manages the connection, corrects for yaw drift, and exposes the euler angles on a socket.io connection. Also exposes functions like re-centering and power save mode
3. Front-end in [webroot/index.html](https://github.com/3rl-io/spidgets-3dof/blob/master/webroot/index.html) uses `spidgets-core` to position the widgets and convert euler angles to matrix3d calculations to simulate 3D space

### Build and run manually

First make sure that euler angles from your glasses are printing to the console:

```
bin/euler_60
```

Then get the webserver ready. Requires [nodejs](https://nodejs.org/en/download/package-manager) or [Bun](https://bun.sh/docs/installation) (Bun is newer and faster)

Start ar-server.js. You may need `sudo` for the second step:

```
bun install
bun ar-server.js
```

or (if using nodejs)

```
npm install
node ar-server.js
```

then browse to http://localhost:8000

### Deployment
Create the main executable for end users:

```
bun build ./ar-server.js --compile --outfile bin/ar-server

```

### Performance tips

- With Rokid glasses, use a 120Hz display mode (either 1920x1080 or x1200 is okay). 60Hz creates input lag
- iframes of third party websites can be very GPU-intensive especially if they have a lot of divs. See `webroot/widgets` for ideas for building performant widgets. [HTML custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) are the cleanest pattern.
- If you have a discrete GPU, you may want to change your OS settings to use it for the browser. Most browsers will use the iGPU by default
