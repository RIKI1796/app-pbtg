import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

import { BMITracker } from '@/components/BMITracker';
import { RunTracker } from '@/components/RunTracker';
import { StravaStats } from '@/components/StravaStats';
import { RunHistory } from '@/components/RunHistory';

import { UserHealthProfile, RunSession } from '@/types/fitness';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateRecommendedWeeklyGoal,
  formatRealtimeTimestamp,
} from '@/utils/fitnessHelpers';

const STORAGE_KEYS = {
  PROFILE: '@lifebit_user_profile',
  SESSIONS: '@lifebit_run_sessions',
};

const DEFAULT_PROFILE: UserHealthProfile = {
  heightCm: 0,
  weightKg: 0,
  age: 0,
  gender: 'male',
  weeklyGoalKm: 0,
};

const INITIAL_DEMO_SESSIONS: RunSession[] = [
  {
    id: 'demo-1',
    date: formatRealtimeTimestamp(Date.now() - 86400000),
    distanceKm: 5.25,
    durationSeconds: 1680,
    avgPaceMinKm: 5.33,
    caloriesBurned: 355,
    elevationGainM: 28,
    routePoints: [
      { latitude: -6.2088, longitude: 106.8456, timestamp: 1 },
      { latitude: -6.2095, longitude: 106.8470, timestamp: 2 },
      { latitude: -6.2110, longitude: 106.8485, timestamp: 3 },
      { latitude: -6.2125, longitude: 106.8460, timestamp: 4 },
      { latitude: -6.2100, longitude: 106.8445, timestamp: 5 },
      { latitude: -6.2088, longitude: 106.8456, timestamp: 6 },
    ],
  },
  {
    id: 'demo-2',
    date: formatRealtimeTimestamp(Date.now() - 2 * 86400000),
    distanceKm: 3.8,
    durationSeconds: 1260,
    avgPaceMinKm: 5.52,
    caloriesBurned: 260,
    elevationGainM: 14,
    routePoints: [
      { latitude: -6.2088, longitude: 106.8456, timestamp: 1 },
      { latitude: -6.2070, longitude: 106.8440, timestamp: 2 },
      { latitude: -6.2055, longitude: 106.8465, timestamp: 3 },
      { latitude: -6.2088, longitude: 106.8456, timestamp: 4 },
    ],
  },
];

export default function SinglePageHomeScreen() {
  const [profile, setProfile] = useState<UserHealthProfile>(DEFAULT_PROFILE);
  const [sessions, setSessions] = useState<RunSession[]>(INITIAL_DEMO_SESSIONS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load saved data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);

        if (storedProfile) {
          const parsed: UserHealthProfile = JSON.parse(storedProfile);
          const computedGoal = calculateRecommendedWeeklyGoal(
            parsed.heightCm,
            parsed.weightKg,
            parsed.age,
            parsed.gender
          );
          setProfile({ ...parsed, weeklyGoalKm: computedGoal });
        } else {
          const initGoal = calculateRecommendedWeeklyGoal(
            DEFAULT_PROFILE.heightCm,
            DEFAULT_PROFILE.weightKg,
            DEFAULT_PROFILE.age,
            DEFAULT_PROFILE.gender
          );
          setProfile({ ...DEFAULT_PROFILE, weeklyGoalKm: initGoal });
        }

        if (storedSessions && JSON.parse(storedSessions).length > 0) {
          setSessions(JSON.parse(storedSessions));
        }
      } catch (e) {
        console.warn('Failed to load storage:', e);
      } finally {
        setIsLoaded(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  const handleUpdateProfile = async (
    heightCm: number,
    weightKg: number,
    age: number,
    gender: 'male' | 'female'
  ) => {
    const dynamicGoal = calculateRecommendedWeeklyGoal(heightCm, weightKg, age, gender);
    const updated: UserHealthProfile = {
      heightCm,
      weightKg,
      age,
      gender,
      weeklyGoalKm: dynamicGoal,
    };
    setProfile(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveSession = async (newSession: RunSession) => {
    const updated = [newSession, ...sessions];
    setSessions(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClearAllSessions = async () => {
    setSessions([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
    } catch (e) {}
  };

  const bmi = calculateBMI(profile.heightCm, profile.weightKg);
  const bmr = calculateBMR(profile.heightCm, profile.weightKg, profile.age, profile.gender);
  const bmiCategory = getBMICategory(bmi);
  const totalKmThisWeek = sessions.reduce((acc, s) => acc + s.distanceKm, 0);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Memuat LifeBIT...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        {/* Header Bar: Human Athletic Style (Sky Cobalt Aesthetic) */}
        <View style={styles.topAppBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/../assets/images/app-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.appNameText}>LifeBIT</Text>
              <Text style={styles.appSubtext}>Aktivitas & Kesehatan</Text>
            </View>
          </View>

          {/* Quick Info Status Pills (Interactive Triggers for Popups) */}
          <View style={styles.quickPillGroup}>
            <TouchableOpacity
              style={[styles.quickPill, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}
              onPress={() => setShowBMIModal(true)}
            >
              <MaterialCommunityIcons name="speedometer" size={13} color={bmiCategory.color} />
              <Text style={[styles.quickPillText, { color: '#0F172A' }]}>
                BMI <Text style={{ color: bmiCategory.color, fontWeight: '800' }}>{bmi > 0 ? bmi : 'Pop-up'}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
              onPress={() => setShowHistoryModal(true)}
            >
              <FontAwesome5 name="history" size={11} color="#0284C7" />
              <Text style={[styles.quickPillText, { color: '#0284C7' }]}>
                Riwayat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Page Dashboard Scroll Container */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Main Live Run Tracker Hero Card (Enlarged 520px Map + Live Stats Below) */}
          <RunTracker
            userWeightKg={profile.weightKg}
            onSaveSession={handleSaveSession}
          />

          {/* Quick Action Pop-Up Trigger Dock */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowBMIModal(true)}>
              <View style={styles.quickIconBadge}>
                <MaterialCommunityIcons name="account-heart-outline" size={15} color="#0284C7" />
              </View>
              <Text style={styles.quickActionBtnText}>Profil & BMI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowStatsModal(true)}>
              <View style={styles.quickIconBadge}>
                <MaterialCommunityIcons name="trophy-outline" size={15} color="#0284C7" />
              </View>
              <Text style={styles.quickActionBtnText}>Target & Rekor</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowHistoryModal(true)}>
              <View style={styles.quickIconBadge}>
                <MaterialCommunityIcons name="history" size={15} color="#0284C7" />
              </View>
              <Text style={styles.quickActionBtnText}>Riwayat Sesi</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* POP-UP MODAL 1: BMI & Physical Profile Calculator */}
        <Modal
          visible={showBMIModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBMIModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBMIModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Kalkulator BMI & Profil</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBMIModal(false)}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                  <BMITracker
                    heightCm={profile.heightCm}
                    weightKg={profile.weightKg}
                    age={profile.age}
                    gender={profile.gender}
                    onUpdateProfile={(h, w, a, g) => {
                      handleUpdateProfile(h, w, a, g);
                    }}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* POP-UP MODAL 2: Weekly Target & Strava Stats */}
        <Modal
          visible={showStatsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStatsModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatsModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Target Mingguan & Rekor</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowStatsModal(false)}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                  <StravaStats
                    sessions={sessions}
                    weeklyGoalKm={profile.weeklyGoalKm}
                    bmi={bmi}
                    bmr={bmr}
                    age={profile.age}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* POP-UP MODAL 3: Workout History Feed */}
        <Modal
          visible={showHistoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowHistoryModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContentCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeaderTitle}>Riwayat Sesi Lari</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHistoryModal(false)}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                  <RunHistory
                    sessions={sessions}
                    onDeleteSession={handleDeleteSession}
                    onClearAll={handleClearAllSessions}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  background: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  appNameText: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appSubtext: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -1,
  },
  quickPillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
    paddingBottom: 40,
    maxWidth: 740,
    width: '100%',
    alignSelf: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 740,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    marginBottom: 0,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
