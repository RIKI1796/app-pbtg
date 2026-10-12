import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { RunSession } from '@/types/fitness';
import { formatPace } from '@/utils/fitnessHelpers';

interface StravaStatsProps {
  sessions: RunSession[];
  weeklyGoalKm: number;
  bmi: number;
  bmr: number;
  age: number;
}

export const StravaStats: React.FC<StravaStatsProps> = ({
  sessions,
  weeklyGoalKm,
  bmi,
  bmr,
  age,
}) => {
  const totalKm = sessions.reduce((acc, s) => acc + s.distanceKm, 0);
  const totalCalories = sessions.reduce((acc, s) => acc + s.caloriesBurned, 0);
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalWorkouts = sessions.length;

  const totalHours = (totalSeconds / 3600).toFixed(1);

  // Personal Records
  const longestRunKm = sessions.length > 0 ? Math.max(...sessions.map((s) => s.distanceKm)) : 0;
  const validPaces = sessions.filter((s) => s.avgPaceMinKm > 0).map((s) => s.avgPaceMinKm);
  const fastestPace = validPaces.length > 0 ? Math.min(...validPaces) : 0;

  const progressPercent = weeklyGoalKm > 0 ? Math.min(100, Math.round((totalKm / weeklyGoalKm) * 100)) : 0;

  return (
    <View style={styles.card}>
      {/* Header (Human Athletic Design) */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Statistik & Target Mingguan</Text>
          <Text style={styles.cardSubtitle}>Ringkasan Aktivitas Minggu Ini</Text>
        </View>
      </View>

      {/* Weekly Goal Progress Card (Circular Athletic Ring Widget) */}
      <View style={styles.goalBox}>
        <View style={styles.ringAndInfoContainer}>
          {/* Circular Ring Progress */}
          <View style={styles.ringContainer}>
            <View style={[styles.ringCircle, { borderColor: progressPercent > 0 ? '#0284C7' : '#E2E8F0' }]}>
              <Text style={styles.ringPercentText}>{progressPercent}%</Text>
              <Text style={styles.ringLabelText}>TERCAPAI</Text>
            </View>
          </View>

          {/* Goal Details */}
          <View style={styles.ringDetailsBox}>
            <Text style={styles.goalTitleText}>TARGET MINGGU INI</Text>
            <Text style={styles.goalMainMetric}>
              {totalKm.toFixed(1)} <Text style={styles.goalTargetText}>/ {weeklyGoalKm} km</Text>
            </Text>
            <Text style={styles.goalSubtext}>
              {weeklyGoalKm - totalKm > 0
                ? `Sisa ${(weeklyGoalKm - totalKm).toFixed(1)} km lagi minggu ini`
                : 'Target Mingguan Terlampaui'}
            </Text>
          </View>
        </View>

        {/* Dynamic Target Explanation Callout */}
        <View style={styles.calcExplanationBox}>
          <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
          <Text style={styles.calcExplanationText}>
            Target lari mingguan disesuaikan berdasarkan usia ({age} thn) dan rekomendasi kesehatan BMI ({bmi}).
          </Text>
        </View>
      </View>

      {/* Primary Overview Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL JARAK</Text>
          <Text style={styles.statValue}>{totalKm.toFixed(1)} <Text style={styles.statUnit}>km</Text></Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL WAKTU</Text>
          <Text style={styles.statValue}>{totalHours} <Text style={styles.statUnit}>jam</Text></Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>KALORI TERBAKAR</Text>
          <Text style={styles.statValue}>{totalCalories} <Text style={styles.statUnit}>kcal</Text></Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL SESI</Text>
          <Text style={styles.statValue}>{totalWorkouts} <Text style={styles.statUnit}>sesi</Text></Text>
        </View>
      </View>

      {/* Personal Records Cards */}
      <Text style={styles.sectionSubHeader}>REKOR PRIBADI (PERSONAL BEST)</Text>
      <View style={styles.prContainer}>
        <View style={styles.prCard}>
          <View style={[styles.prBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trophy-outline" size={18} color="#D97706" />
          </View>
          <View style={styles.prInfo}>
            <Text style={styles.prTitle}>Lari Terjauh</Text>
            <Text style={styles.prValue}>
              {longestRunKm > 0 ? `${longestRunKm.toFixed(2)} km` : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.prCard}>
          <View style={[styles.prBadge, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="flash-outline" size={18} color="#0284C7" />
          </View>
          <View style={styles.prInfo}>
            <Text style={styles.prTitle}>Pace Tercepat</Text>
            <Text style={styles.prValue}>
              {fastestPace > 0 ? formatPace(fastestPace) : '-'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  goalBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ringAndInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  ringContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ringPercentText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  ringLabelText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ringDetailsBox: {
    flex: 1,
    gap: 2,
  },
  goalTitleText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  goalMainMetric: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  goalTargetText: {
    color: '#0284C7',
    fontSize: 15,
  },
  goalSubtext: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  calcExplanationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  calcExplanationText: {
    color: '#475569',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionSubHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  prContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  prCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo: {
    flex: 1,
  },
  prTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  prValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
});
