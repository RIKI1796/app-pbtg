import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  calculateBMI,
  getBMICategory,
  getIdealWeightRange,
  calculateBMR,
  calculateTDEE,
  BMI_CATEGORIES,
} from '@/utils/fitnessHelpers';

interface BMITrackerProps {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female';
  onUpdateProfile: (height: number, weight: number, age: number, gender: 'male' | 'female') => void;
}

export const BMITracker: React.FC<BMITrackerProps> = ({
  heightCm,
  weightKg,
  age,
  gender,
  onUpdateProfile,
}) => {
  const [heightStr, setHeightStr] = useState(heightCm > 0 ? heightCm.toString() : '');
  const [weightStr, setWeightStr] = useState(weightKg > 0 ? weightKg.toString() : '');
  const [ageStr, setAgeStr] = useState(age > 0 ? age.toString() : '');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(gender);

  useEffect(() => {
    setHeightStr(heightCm > 0 ? heightCm.toString() : '');
  }, [heightCm]);

  useEffect(() => {
    setWeightStr(weightKg > 0 ? weightKg.toString() : '');
  }, [weightKg]);

  useEffect(() => {
    setAgeStr(age > 0 ? age.toString() : '');
  }, [age]);

  useEffect(() => {
    setSelectedGender(gender);
  }, [gender]);

  const bmi = calculateBMI(heightCm, weightKg);
  const category = getBMICategory(bmi);
  const idealRange = getIdealWeightRange(heightCm);
  const bmr = calculateBMR(heightCm, weightKg, age, selectedGender);
  const tdee = calculateTDEE(bmr, 'moderate');

  // Position percentage on BMI gauge (range 15 to 35)
  const barPercent = Math.min(
    100,
    Math.max(0, ((bmi - 15) / (35 - 15)) * 100)
  );

  const handleCalculateBMI = () => {
    const h = parseFloat(heightStr.replace(',', '.'));
    const w = parseFloat(weightStr.replace(',', '.'));
    const a = parseInt(ageStr, 10);

    if (isNaN(h) || h <= 0 || isNaN(w) || w <= 0) {
      Alert.alert('Input Belum Valid', 'Silakan masukkan nilai tinggi dan berat badan lebih dari 0.');
      return;
    }

    const parsedAge = isNaN(a) || a < 0 ? 0 : a;
    onUpdateProfile(h, w, parsedAge, selectedGender);
  };

  return (
    <View style={styles.card}>
      {/* Header (Human Design - Clean Title & Description) */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Profil & Indeks Massa Tubuh</Text>
          <Text style={styles.cardSubtitle}>BMI & Estimasi Kalori Harian</Text>
        </View>
      </View>

      {/* Main BMI Score Display */}
      <View style={styles.bmiDisplayContainer}>
        <View style={styles.bmiCircle}>
          <Text style={styles.bmiValue}>{bmi > 0 ? bmi : '0.0'}</Text>
          <Text style={styles.bmiUnit}>SKOR BMI</Text>
        </View>

        <View style={styles.bmiStatusBox}>
          <View style={[styles.categoryBadge, { backgroundColor: bmi > 0 ? category.color : '#94A3B8' }]}>
            <Text style={styles.categoryBadgeText}>{bmi > 0 ? category.label : 'Belum Dihitung'}</Text>
          </View>
          <Text style={styles.bmiDescription}>
            {bmi > 0 ? category.description : 'Masukkan tinggi dan berat badan lalu tekan Cek BMI.'}
          </Text>
          {heightCm > 0 && (
            <Text style={styles.idealText}>
              Rentang Ideal: <Text style={styles.idealValue}>{idealRange.minKg} - {idealRange.maxKg} kg</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Visual BMI Gauge Spectrum */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeBarContainer}>
          {BMI_CATEGORIES.map((cat, idx) => (
            <View
              key={cat.code}
              style={[
                styles.gaugeSegment,
                { backgroundColor: cat.color },
                idx === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                idx === BMI_CATEGORIES.length - 1 && {
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                },
              ]}
            />
          ))}

          {/* Pointer Needle */}
          <View style={[styles.pointerNeedle, { left: `${barPercent}%` }]}>
            <View style={styles.pointerDot} />
          </View>
        </View>

        {/* Spectrum Labels */}
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabelText}>18.5 (Ideal)</Text>
          <Text style={styles.gaugeLabelText}>25.0 (Kelebihan)</Text>
          <Text style={styles.gaugeLabelText}>30.0 (Obesitas)</Text>
        </View>
      </View>

      {/* Direct Inputs Grid (Clean White Input Surfaces) */}
      <View style={styles.inputsGrid}>
        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>TINGGI (CM)</Text>
          <TextInput
            style={styles.directInput}
            keyboardType="decimal-pad"
            value={heightStr}
            onChangeText={setHeightStr}
            placeholder="Contoh: 170"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>BERAT (KG)</Text>
          <TextInput
            style={styles.directInput}
            keyboardType="decimal-pad"
            value={weightStr}
            onChangeText={setWeightStr}
            placeholder="Contoh: 65"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>USIA (THN)</Text>
          <TextInput
            style={styles.directInput}
            keyboardType="number-pad"
            value={ageStr}
            onChangeText={setAgeStr}
            placeholder="Contoh: 24"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputLabel}>JENIS KELAMIN</Text>
          <View style={styles.genderToggleRow}>
            <TouchableOpacity
              style={[styles.genderBtn, selectedGender === 'male' && styles.genderBtnActive]}
              onPress={() => setSelectedGender('male')}
            >
              <Text style={[styles.genderBtnText, selectedGender === 'male' && styles.genderBtnTextActive]}>Pria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, selectedGender === 'female' && styles.genderBtnActive]}
              onPress={() => setSelectedGender('female')}
            >
              <Text style={[styles.genderBtnText, selectedGender === 'female' && styles.genderBtnTextActive]}>Wanita</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action Button to Calculate BMI */}
      <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculateBMI}>
        <MaterialCommunityIcons name="calculator-variant" size={18} color="#FFFFFF" />
        <Text style={styles.calculateBtnText}>CEK BMI & KALORI</Text>
      </TouchableOpacity>

      {/* Metabolism & Energy Output Cards */}
      <View style={styles.energyRow}>
        <View style={styles.energyBox}>
          <Text style={styles.energyLabel}>BMR (Metabolisme Basal)</Text>
          <Text style={styles.energyValue}>{bmr} <Text style={styles.energyUnit}>kcal/hari</Text></Text>
        </View>

        <View style={styles.energyBox}>
          <Text style={styles.energyLabel}>Estimasi Kebutuhan Kalori</Text>
          <Text style={styles.energyValue}>{tdee} <Text style={styles.energyUnit}>kcal/hari</Text></Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 4,
    marginBottom: 0,
    borderWidth: 0,
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  bmiDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bmiCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bmiValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  bmiUnit: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: -2,
  },
  bmiStatusBox: {
    flex: 1,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bmiDescription: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '500',
  },
  idealText: {
    color: '#64748B',
    fontSize: 11,
  },
  idealValue: {
    color: '#16A34A',
    fontWeight: '800',
  },
  gaugeContainer: {
    marginBottom: 20,
  },
  gaugeBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  gaugeSegment: {
    flex: 1,
  },
  pointerNeedle: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -9 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pointerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  gaugeLabelText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  inputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  inputBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  directInput: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  ageWarningText: {
    color: '#F59E0B',
    fontSize: 9,
    marginTop: 3,
    fontWeight: '600',
  },
  genderToggleRow: {
    flexDirection: 'row',
    gap: 4,
    height: 38,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  genderBtnActive: {
    backgroundColor: '#0F172A',
  },
  genderBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  genderBtnTextActive: {
    color: '#FFFFFF',
  },
  energyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  energyBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  energyLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  energyValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  energyUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  calculateBtn: {
    backgroundColor: '#0284C7', // Light Blue Sky Cobalt
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  calculateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
