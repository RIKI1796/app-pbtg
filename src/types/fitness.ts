export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface RunSession {
  id: string;
  date: string;
  distanceKm: number; // e.g. 5.24
  durationSeconds: number; // e.g. 1845
  avgPaceMinKm: number; // e.g. 5.5 (5 min 30 sec)
  caloriesBurned: number; // e.g. 340
  elevationGainM: number; // e.g. 35
  routePoints: LocationPoint[];
}

export interface UserHealthProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female';
  weeklyGoalKm: number;
}

export interface BMICategory {
  label: string;
  code: 'underweight' | 'normal' | 'overweight' | 'obese';
  color: string;
  minBMI: number;
  maxBMI: number;
  description: string;
  advice: string;
}
