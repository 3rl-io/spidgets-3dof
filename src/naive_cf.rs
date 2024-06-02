//!
//! NaiveCF is a simple sensor fusion algorithm that uses a complementary filter.
//!
//! complementary filter with very simple update algorithm:
//!
//! (
//!     assuming:
//!     (S, S-) = current & previous estimated state
//!     d~S1 = rate sensor reading (e.g. gyro), high frequency, high drift, dead reckoning
//!    ~S2 = state sensor reading (e.g. grav/acc, mag), low frequency, high noise, low drift
//!    d_t1 = time elapse since last rate sensor sampling
//!)
//!
//!S = S- + ratio * d~S1 * d_t1 + (1-ratio) * (~S2 - S-)
//!  = ratio * (S- + d~S1 * d_t1) + (1-ratio) * ~S2
//!
//!this implies:
//!
//!- the algorithm natively support state sensor(s) with different sampling frequency, incomplete reading,
//!or unreliable reading, as ~S2 variable is merely an optional correction
//!- the interpolation between ~S2 and the first term doesn't need to be linear or additive,
//!e.g. 3D angular interpolation is multiplicative
//!- the ratio can be adjusted based on quality & frequency of state sensor(s)
//!
//!most glasses have acc & grav/acc readings in 1 bundle, but I prefer not using this assumption and still update them independently
//!   
//! # example:
//!  TODO: fill

use nalgebra::{UnitQuaternion, Vector3};

use crate::{ARGlasses, Error, Fusion, GlassesEvent};

#[test]
pub fn __get_correction() {
    /*
        compute:
      ┌                                     ┐
      │   3.0176868 -0.74084723     9.24847 │
      └                                     ┘

    , UnitQuaternion angle: 2.262818 − axis: (-0.0015257121, -0.92279005, -0.38530007) => UnitQuaternion angle: 0.87873745 − axis: (-0.67957145, -0.71493566, 0.16446783)
         */

    let acc = Vector3::new(3.0176868, -0.74084723, 9.24847);
    let axis = Vector3::new(-0.0015257122, -0.9227901, -0.38530007);
    let angle = 2.262818;

    let rotation = UnitQuaternion::from_axis_angle(&Unit::new_normalize(axis), angle);

    let correction = NaiveCF::get_rotation_verified(&acc, &rotation).unwrap();

    println!(
        "compute: {}, {} => {}",
        acc.transpose(),
        rotation,
        correction
    );
}

type Result<T> = std::result::Result<T, Error>;

pub struct NaiveCF {
    pub glasses: Box<dyn ARGlasses>,

    //estimation
    pub attitude: UnitQuaternion<f32>,

    //just old readings
    //prevAcc: (Vector3<f32>, u64),
    pub prev_gyro: (Vector3<f32>, u64), //FRD
    //prevMag: (Vector3<f32>, u64),
    pub inconsistency: f32, //roll, pitch. yaw
}

impl NaiveCF {
    pub fn new(glasses: Box<dyn ARGlasses>) -> Result<Self> {
        //let attitude = ;
        //let prev_gyro = ;
        let mut fusion = NaiveCF {
            glasses,
            attitude: UnitQuaternion::identity(),
            // attitude: UnitQuaternion::from_euler_angles(0.0, 0.0, std::f32::consts::PI), // seeing backwards
            prev_gyro: (Vector3::zeros(), 0),
            inconsistency: 0.0,
        };

        loop {
            //wait for the first non-zero gyro reading
            let next_event = fusion.next_event();
            match next_event {
                GlassesEvent::AccGyro {
                    accelerometer: _,
                    gyroscope,
                    timestamp,
                } => {
                    //if gyroscope != Vector3::zeros() {
                    fusion.prev_gyro = (gyroscope, timestamp);
                    return Ok(fusion);
                    //}
                }
                _ => {}
            }
        }
    }

    ///read until next valid event. Blocks.
    fn next_event(&mut self) -> GlassesEvent {
        loop {
            match self.glasses.read_event() {
                Ok(event) => return event,
                Err(e) => {
                    println!("Error reading event: {}", e);
                    std::process::exit(0);
                }
            }
        }
    }

    fn rub_to_frd(v: &Vector3<f32>) -> Vector3<f32> {
        let result = Vector3::new(-v.z, v.x, -v.y);
        result
    }

    const BASE_GRAV_RATIO: f32 = 0.005;
    //const BASE_GRAV_RATIO: f32 = 0.0; //no grav
    // const BASE_GRAV_RATIO: f32 = 1.0; //absolute correction, no gyro

    //const BASE_MAG_RATIO: f32 = 0.5;

    const GYRO_SPEED_IN_TIMESTAMP_FACTOR: f32 = 1000.0 * 1000.0; //microseconds

    const INCONSISTENCY_DECAY: f32 = 0.90;

    const UP_FRD: Vector3<f32> = Vector3::new(0.0, 0.0, -9.81);
    //const NORTH_FRD: Vector3<f32> = Vector3::new(0.0, 0.0, -1.0);

    //CAUTION: right-multiplication means rotation, unconventionally

    fn update_gyro_rub(&mut self, gyro_rub: &Vector3<f32>, t: u64) -> () {
        let gyro = Self::rub_to_frd(gyro_rub);

        let d_t1 = t - self.prev_gyro.1;
        let d_t1_f = d_t1 as f32 / Self::GYRO_SPEED_IN_TIMESTAMP_FACTOR;
        let d_s1_t1 = d_t1_f * gyro;

        let increment = UnitQuaternion::from_euler_angles(d_s1_t1.x, d_s1_t1.y, d_s1_t1.z);

        // self.attitude = (increment.inverse() * self.attitude.inverse()).inverse();
        self.attitude = self.attitude * increment;

        self.prev_gyro = (gyro, t);
    }

    fn update_acc(&mut self, acc_rub: &Vector3<f32>, _t: u64) -> () {
        let acc = Self::rub_to_frd(acc_rub);

        if acc.norm() < 1.0 {
            return; //almost in free fall, or acc disabled, do not correct
        }

        let attitude = &self.attitude;
        // let acc_inv = Vector3::new(-acc.x, -acc.y, acc.z);

        let correction_opt = Self::get_correction(&acc, &attitude.inverse(), Self::BASE_GRAV_RATIO);

        match correction_opt {
            Some(correction_inv) => {
                let correction = correction_inv.inverse();
                self.inconsistency =
                    self.inconsistency * Self::INCONSISTENCY_DECAY + correction.angle();

                // self.attitude = (correction_inv * attitude.inverse()).inverse();
                self.attitude = attitude * correction;
            }
            None => {
                //TODO: opposite direction, don't know how to correct
            }
        }
    }

    pub fn get_correction(
        acc: &Vector3<f32>,
        rotation: &UnitQuaternion<f32>,
        scale: f32,
    ) -> Option<UnitQuaternion<f32>> {
        let uncorrected = rotation * Self::UP_FRD.normalize();

        let scaled_opt =
            UnitQuaternion::scaled_rotation_between(&uncorrected, &acc.normalize(), scale);

        // let rotation_opt = Self::get_rotation(acc, rotation);

        // let scaled_opt = match rotation_opt {
        //     Some(correction) => {
        //         let scaled_axis = correction.scaled_axis();
        //         let scaled = UnitQuaternion::from_scaled_axis(scaled_axis * scale);
        //         Some(scaled)
        //     }
        //     None => None,
        // };

        // let scaled_opt = match rotation_opt {
        //     Some(correction) => {
        //         UnitQuaternion::try_slerp(&UnitQuaternion::identity(), &correction, scale, 0.0)
        //     }
        //     None => None,
        // };

        scaled_opt
    }

    pub fn get_rotation(
        acc: &Vector3<f32>,
        rotation: &UnitQuaternion<f32>,
    ) -> Option<UnitQuaternion<f32>> {
        Self::get_rotation_raw(acc, rotation)
    }

    fn get_rotation_raw(
        acc: &Vector3<f32>,
        rotation: &UnitQuaternion<f32>,
    ) -> Option<UnitQuaternion<f32>> {
        let uncorrected = rotation * Self::UP_FRD;
        let correction_opt = UnitQuaternion::scaled_rotation_between(&uncorrected, &acc, 1.0);
        correction_opt
    }

    fn get_rotation_verified(
        acc: &Vector3<f32>,
        rotation: &UnitQuaternion<f32>,
    ) -> Option<UnitQuaternion<f32>> {
        let raw = Self::get_rotation_raw(acc, rotation);
        match raw {
            Some(correction) => {
                //round-trip verification

                let corrected = correction * rotation;

                let should_be_zero = Self::get_rotation_raw(acc, &corrected).unwrap().angle();

                if should_be_zero > 0.001 {
                    println!("residual={}", should_be_zero);
                    println!(
                        "compute: {}, {} => {}",
                        acc.transpose(),
                        rotation,
                        correction
                    );

                    {
                        let norm = rotation.norm();
                        assert!(norm > 0.999 && norm < 1.001, "norm={}", norm);
                    }

                    {
                        let reconstructed = UnitQuaternion::from_axis_angle(
                            &rotation.axis().unwrap(),
                            rotation.angle(),
                        );

                        assert!((rotation * reconstructed.inverse()).angle() < 0.001);

                        assert!(
                            (rotation * Self::UP_FRD.normalize()
                                - reconstructed * Self::UP_FRD.normalize())
                            .norm()
                                < 0.01
                        )
                    }

                    {
                        let again = Self::get_rotation_raw(acc, rotation);
                        assert!(raw == again)
                    }

                    {
                        // verify rotation
                        let inv = rotation.inverse();
                        assert!((inv * rotation).angle() < 0.001);
                        assert!((rotation * inv).angle() < 0.001);
                    }

                    {
                        // verity acc
                        let q = UnitQuaternion::scaled_rotation_between(&Self::UP_FRD, acc, 1.0)
                            .unwrap();

                        let round1 = (q * Self::UP_FRD.normalize() - acc.normalize()).norm();
                        assert!(round1 < 0.001, "round1={}", round1);

                        let round2 =
                            (q.inverse() * acc.normalize() - Self::UP_FRD.normalize()).norm();
                        assert!(round2 < 0.001, "round2={}", round2);
                    }
                }

                raw
            }
            None => raw,
        }
    }
}

//unsafe impl Sync for NaiveCF {}

impl Fusion for NaiveCF {
    fn glasses(&mut self) -> &mut Box<dyn ARGlasses> {
        &mut self.glasses
    }

    fn attitude_quaternion(&self) -> UnitQuaternion<f32> {
        self.attitude
    }

    fn inconsistency_frd(&self) -> f32 {
        self.inconsistency
    }

    fn update(&mut self) -> () {
        let event = self.next_event();
        match event {
            GlassesEvent::AccGyro {
                accelerometer,
                gyroscope,
                timestamp,
            } => {
                self.update_gyro_rub(&gyroscope, timestamp);
                self.update_acc(&accelerometer, timestamp);
                self.attitude.renormalize();
                // self.attitude.renormalize_fast(); // TODO: switch to it after rigorous testing
            }
            _ => {
                //TODO: add magnetometer event etc
            }
        }
    }
}
