# spidgets-3dof

Spatial widgets in a browser with 3 degrees of freedom. Works with Linux or Mac, and one of these glasses:

Confirmed:
* Rokid Air, Max
* XREAL Air, Air 2, and Air 2 Pro, Light

Pending testing:
* Grawoow G530 (a.k.a. Metavision M53)
* Mad Gaze Glow

This is a proof of concept and isn't very smooth to use yet. The content is all hardcoded. In progress, high priority:

- Windows compatibility
- UX features like re-centering

## Usage

In some Linux environments you may be able to just run

```./ar-server```

... then browse to http://localhost:8000

Some third party websites (e.g. YouTube) need [this extension](https://chromewebstore.google.com/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe) in order to bypass restrictions caused by iframe headers

### How it works:

1. Rust-based executable `euler_60` reads the raw sensor data from the glasses and outputs euler anglers at 60Hz

2. nodejs-based process `ar-server` manages the connection, corrects for yaw drift, and exposes the euler angles on a socket.io connection. Also exposes functions like re-centering and TODO: inactivity/power save tracking
3. Front-end in `public` directory uses `spidgets-core` to position the widgets and convert euler angles to matrix3d calculations to simulate 3D space

### Build and run manually

Install dependencies rust and libudev.

```
sudo apt install cargo libudev-dev libstdc++-12-dev
cargo update
```

You will also need nodejs or Bun ([bun](https://bun.sh/docs/installation) is newer and faster)

Optional: add the udev scripts to your udev config, so the glasses are available to regular
users:

```
sudo cp udev/* /etc/udev/rules.d/
sudo udevadm control --reload
```

Make sure that euler angles are printing to console:

```
cargo build --release --example euler_60
target/release/examples/euler_60
```

Start ar-server.js with bun or node. You may need `sudo` for the second step

```
bun install
bun ar-server.js
```

then browse to http://localhost:8000

### Deployment
Create the main executable for end users:

```
bun build ./ar-server.js --compile --outfile ar-server
```

### Long-term plans

Customization and other UI features

We would like to switch to using Monado's drivers since they work with many more glasses.

### Credits

This is heavily dependent on open source drivers made by Alex Badics and enhanced by U of Toronto team: https://github.com/hpvdt/ar-drivers-rs. See MIT License
