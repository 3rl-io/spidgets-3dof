# spidgets-3dof-example

Example app for displaying spatial widgets in a browser with 3 degrees of freedom. Works with Linux or Mac, and one of these glasses:

* Rokid Air, Max
* XREAL Air, Air 2, and Air 2 Pro, Light

In progress, high priority:

- Windows compatibility

## Usage

Clone this repo and run

```bin/ar-server```

... then browse to http://localhost:8000

Optional: Some third party websites (e.g. YouTube) need [this extension](https://chromewebstore.google.com/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe) in order to bypass restrictions caused by iframe headers. This may violate third party TOS or void warranties. Use at your own risk.

Soon: When stable, we can host an easier download/install process on a CDN

### How it works:

1. Rust-based executable `euler_60` reads the raw sensor data from the glasses and outputs euler anglers at 60Hz. [Source](https://github.com/3rl-io/headset-utils)

2. nodejs-based process `ar-server` manages the connection, corrects for yaw drift, and exposes the euler angles on a socket.io connection. Also exposes functions like re-centering and power save mode
3. Front-end in `public/index.html`(https://github.com/3rl-io/spidgets-3dof/blob/master/public/index.html) uses `spidgets-core` to position the widgets and convert euler angles to matrix3d calculations to simulate 3D space

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
- iframes of third party websites can be very GPU-expensive especially if they have a lot of divs. See `public/widgets` for ideas for building performant widgets. [HTML custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) are the cleanest pattern.