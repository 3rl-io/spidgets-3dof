// Copyright (C) 2023, Alex Badics
// This file is part of ar-drivers-rs
// Licensed under the MIT license. See LICENSE file in the project root for details.

use ar_drivers::any_fusion;
use std::time::{Duration, Instant};

fn main() {
    let mut fusion = any_fusion().unwrap(); // Declare conn as mutable

    let interval = Duration::from_millis(16);

    let mut last_time = Instant::now();

    loop {
        fusion.update();
        let new_time = Instant::now();
        if last_time + interval < new_time {
            let frd = fusion.attitude_frd_rad();
            println!("{:10.5}{:10.5}{:10.5}", frd[0], frd[1], frd[2]);
            last_time = new_time;
        }
    }
}
