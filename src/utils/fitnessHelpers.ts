import { BMICategory, LocationPoint } from '@/types/fitness';

export const BMI_CATEGORIES: BMICategory[] = [
  {
    label: 'Kurus (Underweight)',
    code: 'underweight',
    color: '#0284C7',
    minBMI: 0,
    maxBMI: 18.49,
    description: 'Berat badan di bawah rentang sehat.',
    advice: 'Tingkatkan asupan nutrisi seimbang dan gabungkan olahraga lari ringan dengan latihan beban.'
  },
  {
    label: 'Normal (Ideal)',
    code: 'normal',
    color: '#16A34A',
    minBMI: 18.5,
    maxBMI: 24.99,
    description: 'Berat badan ideal & sangat sehat!',
    advice: 'Pertahankan pola makan dan rutin berlari untuk menjaga kebugaran stamina jantung.'
  },
  {
    label: 'Kelebihan Berat (Overweight)',
    code: 'overweight',
    color: '#F59E0B',
    minBMI: 25.0,
    maxBMI: 29.99,
    description: 'Sedikit di atas rentang ideal.',
    advice: 'Olahraga lari rutin 3-4x seminggu sangat ampuh membakar lemak berlebih secara efektif.'
  },
  {
    label: 'Obesitas (Obese)',
    code: 'obese',
    color: '#EF4444',
    minBMI: 30.0,
    maxBMI: 100,
    description: 'Risiko penyakit metabolisme tinggi.',
    advice: 'Mulai dengan jalan cepat / jogging perlahan, jaga sendi dan konsisten tingkatkan durasi.'
  }
];

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): BMICategory {
  return (
    BMI_CATEGORIES.find((c) => bmi >= c.minBMI && bmi <= c.maxBMI) ||
    BMI_CATEGORIES[1]
  );
}

export function getIdealWeightRange(heightCm: number): { minKg: number; maxKg: number } {
  const heightM = heightCm / 100;
  const minKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxKg = Math.round(24.9 * heightM * heightM * 10) / 10;
  return { minKg, maxKg };
}

export function calculateBMR(heightCm: number, weightKg: number, age: number, gender: 'male' | 'female'): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

export function calculateTDEE(bmr: number, activityLevel: 'light' | 'moderate' | 'active' = 'moderate'): number {
  const multipliers = { light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(bmr * multipliers[activityLevel]);
}

/**
 * Calculates recommended weekly running target (km) with a strict minimum age threshold of 6 years old:
 * - Age < 6: 0 km (not recommended for structured running target)
 * - Age 6-9: 3 km/week
 * - Age 10-14: 8-12 km/week
 * - Age 15-24: 18-25 km/week
 * - Age 25-45: 18-24 km/week
 * - Age 46-60: 12-16 km/week
 * - Age > 60: 6-10 km/week
 */
export function calculateRecommendedWeeklyGoal(
  heightCm: number,
  weightKg: number,
  age: number,
  gender: 'male' | 'female'
): number {
  // Minimum age boundary: 6 years old
  if (age < 6) return 0;

  const bmi = calculateBMI(heightCm, weightKg);
  if (bmi <= 0 || heightCm <= 0 || weightKg <= 0) return 0;

  const bmiDelta = Math.max(-6, bmi - 18.5);
  const baseTargetKm = 18 + Math.round(bmiDelta * 0.6);

  // Age bracket factor
  let ageFactor = 1.0;
  if (age >= 6 && age < 10) {
    ageFactor = 0.20; // Children 6-9 yrs: ~3-4 km/week
  } else if (age >= 10 && age < 15) {
    ageFactor = 0.55; // Pre-teens 10-14 yrs: ~8-11 km/week
  } else if (age >= 15 && age < 25) {
    ageFactor = 1.05; // Teens & Young adults: ~18-25 km/week
  } else if (age >= 25 && age <= 45) {
    ageFactor = 1.00; // Adults 25-45 yrs: ~18-24 km/week
  } else if (age > 45 && age <= 60) {
    ageFactor = 0.75; // Middle age 46-60 yrs: ~12-16 km/week
  } else if (age > 60) {
    ageFactor = 0.50; // Seniors > 60 yrs: ~6-10 km/week
  }

  const finalKm = Math.round(baseTargetKm * ageFactor);
  return Math.min(45, Math.max(2, finalKm));
}

export function getHaversineDistanceKm(p1: LocationPoint, p2: LocationPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p1.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatTime(secondsTotal: number): string {
  const hrs = Math.floor(secondsTotal / 3600);
  const mins = Math.floor((secondsTotal % 3600) / 60);
  const secs = secondsTotal % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatPace(avgPaceMinKm: number): string {
  if (!isFinite(avgPaceMinKm) || avgPaceMinKm <= 0 || avgPaceMinKm > 30) return `--'--"` ;
  const mins = Math.floor(avgPaceMinKm);
  const secs = Math.round((avgPaceMinKm - mins) * 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${mins}'${pad(secs)}"`;
}

export function calculateRunCalories(weightKg: number, distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0 || durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  const speedKmH = distanceKm / hours;
  let met = 8.0;
  if (speedKmH > 12) met = 11.5;
  else if (speedKmH > 10) met = 10.0;
  else if (speedKmH > 8) met = 9.0;
  
  const kcal = met * weightKg * hours;
  return Math.round(kcal);
}

export function formatRealtimeTimestamp(dateInput?: Date | number | string): string {
  if (typeof dateInput === 'string' && dateInput.includes('WIB')) {
    return dateInput;
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return typeof dateInput === 'string' && dateInput ? dateInput : 'Hari ini';
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dayName = days[d.getDay()];
  const dateNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${dayName}, ${dateNum} ${monthName} ${year} • ${hours}:${minutes} WIB`;
}
