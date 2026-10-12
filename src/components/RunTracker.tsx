import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { OSMMap } from './OSMMap';
import { LocationPoint, RunSession } from '@/types/fitness';
import {
  formatTime,
  formatPace,
  calculateRunCalories,
  getHaversineDistanceKm,
  formatRealtimeTimestamp,
} from '@/utils/fitnessHelpers';

interface RunTrackerProps {
  userWeightKg: number;
  onSaveSession: (session: RunSession) => void;
}

export const RunTracker: React.FC<RunTrackerProps> = ({
  userWeightKg,
  onSaveSession,
}) => {

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Run Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pathPoints, setPathPoints] = useState<LocationPoint[]>([]);

  // Subscriptions & Sensor Refs
  const expoLocationSubRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const accelSubRef = useRef<any>(null);
  const gyroSubRef = useRef<any>(null);
  const isGyroPeakRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecordedPtRef = useRef<LocationPoint | null>(null);
  const isMovingRef = useRef<boolean>(false);
  const lastMotionTimeRef = useRef<number>(0);

  // Helper to trigger motion state
  const markMotionDetected = useCallback(() => {
    lastMotionTimeRef.current = Date.now();
    if (!isMovingRef.current) {
      isMovingRef.current = true;
      setIsMoving(true);
    }
  }, []);

  // Fetch initial position on mount
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCurrentPosition({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            () => {
              setCurrentPosition({ latitude: -6.2088, longitude: 106.8456 });
            },
            { enableHighAccuracy: true }
          );
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            setCurrentPosition({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          } else {
            setCurrentPosition({ latitude: -6.2088, longitude: 106.8456 });
          }
        }
      } catch (e) {
        setCurrentPosition({ latitude: -6.2088, longitude: 106.8456 });
      }
    })();
  }, []);

  // Motion Expiration Checker: If no physical motion for > 1.8 seconds, auto-pause motion state
  useEffect(() => {
    if (!isTracking || isPaused) return;

    const interval = setInterval(() => {
      if (Date.now() - lastMotionTimeRef.current > 1800) {
        if (isMovingRef.current) {
          isMovingRef.current = false;
          setIsMoving(false);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  // Timer Effect: Counts duration ONLY when tracking is active, not paused, AND user is physically moving (gerak)
  useEffect(() => {
    if (isTracking && !isPaused && isMoving) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTracking, isPaused, isMoving]);

  // Motion Sensor Gate (Accelerometer & Gyroscope): Detects physical movement
  useEffect(() => {
    if (!isTracking || isPaused) {
      if (accelSubRef.current) {
        accelSubRef.current.remove();
        accelSubRef.current = null;
      }
      if (gyroSubRef.current) {
        gyroSubRef.current.remove();
        gyroSubRef.current = null;
      }
      setIsMoving(false);
      isMovingRef.current = false;
      return;
    }

    // Accelerometer listener for motion detection
    try {
      Accelerometer.setUpdateInterval(200);
      const sub = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        const mag = Math.sqrt(x * x + y * y + z * z);
        // Acceleration outside normal resting 0.86 - 1.14 G range indicates physical body motion
        if (mag > 1.14 || mag < 0.86) {
          markMotionDetected();
        }
      });
      accelSubRef.current = sub;
    } catch (e) {
      // Fallback for Web/desktops without accelerometer hardware: motion driven by GPS speed & displacement
    }

    // Gyroscope step counting & motion detection
    try {
      Gyroscope.setUpdateInterval(150);
      const gyroSub = Gyroscope.addListener((data) => {
        const { x, y, z } = data;
        const angularVelocity = Math.sqrt(x * x + y * y + z * z);

        if (angularVelocity > 1.0) {
          markMotionDetected();
          if (!isGyroPeakRef.current) {
            isGyroPeakRef.current = true;
            setStepCount((prev) => prev + 1);
          }
        } else if (angularVelocity < 0.5) {
          isGyroPeakRef.current = false;
        }
      });
      gyroSubRef.current = gyroSub;
    } catch (e) {}

    return () => {
      if (accelSubRef.current) {
        accelSubRef.current.remove();
        accelSubRef.current = null;
      }
      if (gyroSubRef.current) {
        gyroSubRef.current.remove();
        gyroSubRef.current = null;
      }
    };
  }, [isTracking, isPaused, markMotionDetected]);

  // GPS Location Handler with Motion Gate
  useEffect(() => {
    if (!isTracking || isPaused) {
      if (expoLocationSubRef.current) {
        expoLocationSubRef.current.remove();
        expoLocationSubRef.current = null;
      }
      if (webWatchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(webWatchIdRef.current);
        webWatchIdRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const handlePosUpdate = (
      lat: number,
      lng: number,
      alt?: number | null,
      speed?: number | null,
      accuracy?: number | null
    ) => {
      if (!isSubscribed) return;

      // 1. Accuracy Gate Filter: Skip noisy location updates with poor GPS accuracy (> 18m)
      if (accuracy != null && accuracy > 18) {
        return;
      }

      // 2. Exponential Moving Average (EMA) Coordinate Smoothing
      // Eliminates horizontal jitter ("belok-belok") when walking or running straight
      let smoothLat = lat;
      let smoothLng = lng;
      if (lastRecordedPtRef.current) {
        const alpha = 0.45; // 45% new position, 55% previous smooth position
        smoothLat = alpha * lat + (1 - alpha) * lastRecordedPtRef.current.latitude;
        smoothLng = alpha * lng + (1 - alpha) * lastRecordedPtRef.current.longitude;
      }

      const newPt: LocationPoint = {
        latitude: smoothLat,
        longitude: smoothLng,
        altitude: alt,
        timestamp: Date.now(),
      };

      if (!lastRecordedPtRef.current) {
        lastRecordedPtRef.current = newPt;
        setCurrentPosition({ latitude: smoothLat, longitude: smoothLng });
        setPathPoints([newPt]);
        return;
      }

      const distKm = getHaversineDistanceKm(lastRecordedPtRef.current, newPt);
      const distMeters = distKm * 1000;
      const timeDeltaSec = Math.max(0.5, (newPt.timestamp - lastRecordedPtRef.current.timestamp) / 1000);
      const calcSpeedMs = distMeters / timeDeltaSec;

      // If GPS speed or calculated displacement speed >= 0.4 m/s (~1.4 km/h), mark motion detected
      if ((speed != null && speed >= 0.4) || calcSpeedMs >= 0.5) {
        markMotionDetected();
      }

      // 3. MOTION GATE & DISPLACEMENT CHECK:
      // Only record route point & accumulate distance if user is physically moving AND displacement >= 2.5 meters
      if (isMovingRef.current && distMeters >= 2.5 && distMeters < 150) {
        lastRecordedPtRef.current = newPt;
        setCurrentPosition({ latitude: smoothLat, longitude: smoothLng });
        setPathPoints((prev) => {
          const updated = [...prev, newPt];
          let newTotalKm = 0;
          for (let i = 1; i < updated.length; i++) {
            newTotalKm += getHaversineDistanceKm(updated[i - 1], updated[i]);
          }
          setTotalDistanceKm(Math.round(newTotalKm * 100) / 100);
          return updated;
        });
      } else if (!isMovingRef.current) {
        // When stationary, update position marker for map view but freeze path points & distance
        setCurrentPosition({ latitude: smoothLat, longitude: smoothLng });
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
      webWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          handlePosUpdate(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.altitude,
            pos.coords.speed,
            pos.coords.accuracy
          );
        },
        (err) => {},
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } else {
      (async () => {
        try {
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 2,
            },
            (loc) => {
              handlePosUpdate(
                loc.coords.latitude,
                loc.coords.longitude,
                loc.coords.altitude,
                loc.coords.speed,
                loc.coords.accuracy
              );
            }
          );
          expoLocationSubRef.current = sub;
        } catch (e) {}
      })();
    }

    return () => {
      isSubscribed = false;
      if (expoLocationSubRef.current) {
        expoLocationSubRef.current.remove();
        expoLocationSubRef.current = null;
      }
      if (webWatchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(webWatchIdRef.current);
        webWatchIdRef.current = null;
      }
    };
  }, [isTracking, isPaused, markMotionDetected]);

  // Callback to receive distance calculated directly by Map engine
  const handleMapMetricsUpdate = useCallback(
    (metrics: { totalDistanceKm: number; totalDistanceMeters: number }) => {
      if (isTracking && !isPaused && isMovingRef.current) {
        // Backup metrics update if needed
      }
    },
    [isTracking, isPaused]
  );

  const handleStartRun = () => {
    setIsTracking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setTotalDistanceKm(0);
    setElevationGain(0);
    setStepCount(0);
    setPathPoints([]);
    lastRecordedPtRef.current = null;
    isGyroPeakRef.current = false;
    lastMotionTimeRef.current = Date.now();
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleFinishRun = () => {
    if (totalDistanceKm < 0.005 && elapsedSeconds < 5) {
      Alert.alert(
        'Sesi Lari Terlalu Pendek',
        'Durasi lari terlalu singkat untuk disimpan.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hentikan',
            style: 'destructive',
            onPress: () => {
              setIsTracking(false);
              setIsPaused(false);
              setPathPoints([]);
              lastRecordedPtRef.current = null;
            },
          },
        ]
      );
      return;
    }

    const avgPaceMinKm = totalDistanceKm > 0 ? (elapsedSeconds / 60) / totalDistanceKm : 0;
    const caloriesBurned = calculateRunCalories(userWeightKg, totalDistanceKm, elapsedSeconds);

    const session: RunSession = {
      id: Date.now().toString(),
      date: formatRealtimeTimestamp(new Date()),
      distanceKm: Math.round(totalDistanceKm * 100) / 100,
      durationSeconds: elapsedSeconds,
      avgPaceMinKm: Math.round(avgPaceMinKm * 100) / 100,
      caloriesBurned,
      elevationGainM: elevationGain,
      routePoints: pathPoints,
    };

    onSaveSession(session);

    setIsTracking(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setTotalDistanceKm(0);
    setStepCount(0);
    setPathPoints([]);
    lastRecordedPtRef.current = null;

    Alert.alert('Sesi Disimpan', `Jarak: ${session.distanceKm} km | Kalori: ${session.caloriesBurned} kcal`);
  };

  // Pace calculated ONLY when user is physically moving
  const currentPaceMinKm = (isMoving && totalDistanceKm > 0)
    ? (elapsedSeconds / 60) / totalDistanceKm
    : 0;

  const caloriesBurnedLive = calculateRunCalories(userWeightKg, totalDistanceKm, elapsedSeconds);

  return (
    <View style={styles.trackerContainer}>
      {/* Map Display Container (Full Edge-to-Edge Map Canvas) */}
      <View style={styles.mapContainer}>
        <OSMMap
          currentPosition={currentPosition}
          pathPoints={pathPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
          isTracking={isTracking}
          isMoving={isMoving}
          onMapMetricsUpdate={handleMapMetricsUpdate}
          height={620}
        />

        {/* Floating Motion Status Overlay Badge on Map */}
        {isTracking && (
          <View style={[styles.floatingMotionBadge, isMoving ? styles.movingBadge : styles.stillBadge]}>
            <Ionicons
              name={isMoving ? 'walk-outline' : 'hand-right-outline'}
              size={13}
              color={isMoving ? '#16A34A' : '#B45309'}
            />
            <Text style={[styles.motionStatusText, { color: isMoving ? '#16A34A' : '#B45309' }]}>
              {isMoving ? 'Berjalan / Berlari' : 'Diam (Jeda Otomatis)'}
            </Text>
          </View>
        )}
      </View>

      {/* Main Live Metrics Dashboard Below Map */}
      <View style={styles.contentPaddingContainer}>
        <View style={styles.metricsHeroCard}>
          {/* Primary Distance Indicator */}
          <View style={styles.mainDistContainer}>
            <Text style={styles.distLabel}>TOTAL JARAK TEMPUH</Text>
            <View style={styles.distValueRow}>
              <Text style={styles.distValue}>{totalDistanceKm.toFixed(2)}</Text>
              <Text style={styles.distUnit}>KM</Text>
            </View>
          </View>

          {/* Secondary Metrics Bar */}
          <View style={styles.subMetricsGrid}>
            <View style={styles.subMetricBox}>
              <Text style={styles.subMetricLabel}>DURASI</Text>
              <Text style={styles.subMetricValue}>{formatTime(elapsedSeconds)}</Text>
            </View>

            <View style={styles.subMetricBox}>
              <Text style={styles.subMetricLabel}>PACE (MIN/KM)</Text>
              <Text style={styles.subMetricValue}>{formatPace(currentPaceMinKm)}</Text>
            </View>

            <View style={styles.subMetricBox}>
              <Text style={styles.subMetricLabel}>KALORI</Text>
              <Text style={styles.subMetricValue}>{caloriesBurnedLive} <Text style={styles.unitSmall}>kcal</Text></Text>
            </View>

            <View style={styles.subMetricBox}>
              <Text style={styles.subMetricLabel}>LANGKAH</Text>
              <Text style={styles.subMetricValue}>{stepCount}</Text>
            </View>
          </View>
        </View>

        {/* Athletic Action Button Controls */}
        <View style={styles.controlsContainer}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startBtn} onPress={handleStartRun}>
              <FontAwesome5 name="play" size={16} color="#FFFFFF" />
              <Text style={styles.startBtnText}>MULAI LARI</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControlsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                onPress={handlePauseResume}
              >
                <Ionicons name={isPaused ? 'play-sharp' : 'pause-sharp'} size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{isPaused ? 'LANJUT' : 'JEDA'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishBtn} onPress={handleFinishRun}>
                <Ionicons name="square-sharp" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>SIMPAN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  trackerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  mapContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 0,
  },
  floatingMotionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movingBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  stillBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  motionStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentPaddingContainer: {
    width: '100%',
  },
  metricsHeroCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 0,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  mainDistContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  distLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  distValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  distValue: {
    color: '#0F172A',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  distUnit: {
    color: '#0284C7', // Light Blue Sky Cobalt
    fontSize: 22,
    fontWeight: '900',
  },
  subMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subMetricBox: {
    alignItems: 'center',
    flex: 1,
  },
  subMetricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  subMetricValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  unitSmall: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  controlsContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  startBtn: {
    backgroundColor: '#0284C7', // Light Blue Sky Cobalt
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  resumeBtn: {
    backgroundColor: '#16A34A',
  },
  finishBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
