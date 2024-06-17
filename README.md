# spidgets-3dof

Example app and hardware drivers for AR in a browser with 3 degrees of freedom and/or SBS depth. Build next-gen HUDs using 3RL's HTML library

<img src="https://github.com/3rl-io/spidgets-3dof/blob/master/docs/readme-assets/3dof.gif?raw=true" alt="spidgets-3dof gif" width="700"/>

[Watch on Youtube](https://youtu.be/97UgPYMgx9E) (standard 1080)

[Watch SBS example](https://youtu.be/97UgPYMgx9E) (3840x1080)

---
## System requirements

[Check your FPS and compatibility here](https://3rl.io/compat/) before proceeding.

### Compatibility
|                                        | Windows | MacOS | Linux |
|----------------------------------------|---------|-------|-------|
| Rokid Air, Max                         | ✅     | ✅   | ✅   |
| XREAL Light, Air, Air 2, and Air 2 Pro | ❌      | ✅   | ✅   |

- A modern laptop CPU (< 5 years old) can do 30+ FPS. It's even confirmed working on Raspberry Pi and Intel N100

---
## Installation

Some Windows and Linux can use the included binaries as shown in this section. **MacOS should skip to the manual build**

### Linux

1. Clone this repo and open it in a terminal

2. Run `chmod u+x ./bin/ar-server`

3. Place the headset upright on a flat surface

4. Run `sudo ./bin/ar-server` and wait for [calibration](#calibration)

Optional: Follow the udev step [here](https://github.com/3rl-io/headset-utils?tab=readme-ov-file#build-and-run) for non-su

### Windows

1. Clone this repo and open it in a terminal

2. Place the headset upright on a flat surface

3. Run `bin/ar-server` and wait for [calibration](#calibration) (first time setup)

---
Optional: Some third party websites (e.g. YouTube) need [this extension](https://chromewebstore.google.com/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe) in order to bypass restrictions caused by iframe headers. This may violate third party TOS or void warranties. Use at your own risk.

Soon: When stable, we can host an easier download/install process on a CDN + option to run in background on startup

---

## Usage

Run `bin/ar-server` in a terminal

Browse to http://localhost:8000

Experiment with simple HUDs by editing [webroot/index.html](https://github.com/3rl-io/spidgets-3dof/blob/master/webroot/index.html). Stay tuned for more interactive examples and docs.

Options:
- Change port with the `--port` flag e.g. `bin/ar-server --port 3000`
- Pre-record 10 seconds of motion data to allow testing without a headset using the `--record` flag. See `webroot/compat` for mock data example.
- Calibrate for drift with the `--cal` flag. Refer to the [calibration section.](#calibration)


---

## How it works

1. Rust-based executable `euler_60` reads the raw sensor data from the glasses and outputs euler angles (i.e. roll, pitch, and yaw) at 60Hz. [Source](https://github.com/3rl-io/headset-utils)

2. nodejs-based process `ar-server` manages the connection, corrects for yaw drift, and exposes the euler angles on a socket.io connection. Also exposes functions like re-centering and power save mode

3. Front-end in [webroot/index.html](https://github.com/3rl-io/spidgets-3dof/blob/master/webroot/index.html) uses `spidgets-core` to position the widgets and convert euler angles to matrix3d calculations to simulate 3D space

---
## Calibration

Calibration is a one-minute process that measures yaw drift rate and saves it for later. This process will run automatically during first time setup. It can also be run manually like so:

`bin/ar-server --cal`

The headset should be placed upright on a flat stable surface for the full 60 seconds. Console messages will indicate when the process is complete and the UI is ready.

At this time we don't store config profiles per-headset, so calibration will need to be re-run if multiple headsets are used

Optional: If the headset is usually used at a different angle than upright (e.g. in a recliner), it would be more accurate to wear it during calibration. Measurement starts 5 seconds after the command to allow time to adjust. The user can move freely during the test but should be in roughly the same orientation at T+5 and T+60.

---
## Build and run manually

See if the euler angles from your glasses are printing to the console by running the below command. If not, build [headset-utils](https://github.com/3rl-io/headset-utils) and copy the new euler_60 binary to the same location.

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
---
### Performance tips

- With Rokid glasses, use a 120Hz display mode (either 1920x1080 or x1200 is okay). 60Hz creates input lag
- iframes of third party websites can be very GPU-intensive especially if they have a lot of divs. See `webroot/widgets` for ideas for building performant widgets. [HTML custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) are the cleanest pattern.
- If you have a discrete GPU, you may want to change your OS settings to use it for the browser. Most browsers will use the iGPU by default


<img src="https://github.com/3rl-io/spidgets-3dof/blob/master/docs/readme-assets/banner.png?raw=true" alt="spidgets-3dof promo banner" width="900"/>
