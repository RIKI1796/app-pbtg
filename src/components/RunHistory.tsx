import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { RunSession } from '@/types/fitness';
import { formatTime, formatPace, formatRealtimeTimestamp } from '@/utils/fitnessHelpers';
import { OSMMap } from './OSMMap';

interface RunHistoryProps {
  sessions: RunSession[];
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export const RunHistory: React.FC<RunHistoryProps> = ({
  sessions,
  onDeleteSession,
  onClearAll,
}) => {
  const handleConfirmClearAll = () => {
    Alert.alert(
      'Hapus Riwayat',
      'Semua data sesi lari tersimpan akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Semua', style: 'destructive', onPress: onClearAll },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="history" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Riwayat Lari</Text>
            <Text style={styles.cardSubtitle}>{sessions.length} Sesi Tersimpan</Text>
          </View>
        </View>

        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleConfirmClearAll}>
            <Ionicons name="trash-outline" size={14} color="#DC2626" />
            <Text style={styles.clearBtnText}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome5 name="running" size={24} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Sesi Lari</Text>
          <Text style={styles.emptySubtitle}>
            Tekan MULAI LARI untuk mencatat aktivitas lari pertama Anda.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {sessions.map((session) => {
            const hasRoute = session.routePoints && session.routePoints.length > 0;
            const mapCenter = hasRoute
              ? session.routePoints[Math.floor(session.routePoints.length / 2)]
              : { latitude: -6.2088, longitude: 106.8456 };

            return (
              <View key={session.id} style={styles.sessionCard}>
                {/* Session Header */}
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.sessionTitleRow}>
                    <View style={[styles.runBadge, { backgroundColor: '#F0F9FF' }]}>
                      <FontAwesome5 name="running" size={12} color="#0284C7" />
                    </View>
                    <View>
                      <Text style={styles.sessionDateText}>{formatRealtimeTimestamp(session.date)}</Text>
                      <Text style={styles.sessionSubtitleText}>Outdoor Run</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteSingleBtn}
                    onPress={() => onDeleteSession(session.id)}
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Strava Route Preview & Interactive Map */}
                <View style={styles.historyMapContainer}>
                  <OSMMap
                    currentPosition={mapCenter}
                    pathPoints={session.routePoints || []}
                    isTracking={true}
                    height={200}
                  />
                </View>

                {/* Metrics Grid */}
                <View style={styles.sessionMetricsRow}>
                  <View style={styles.sessionMetricCol}>
                    <Text style={styles.sessionMetricLabel}>JARAK</Text>
                    <Text style={styles.sessionDistValue}>
                      {session.distanceKm} <Text style={styles.unitText}>km</Text>
                    </Text>
                  </View>

                  <View style={styles.sessionMetricCol}>
                    <Text style={styles.sessionMetricLabel}>WAKTU</Text>
                    <Text style={styles.sessionMetricValue}>{formatTime(session.durationSeconds)}</Text>
                  </View>

                  <View style={styles.sessionMetricCol}>
                    <Text style={styles.sessionMetricLabel}>PACE</Text>
                    <Text style={styles.sessionMetricValue}>{formatPace(session.avgPaceMinKm)}</Text>
                  </View>

                  <View style={styles.sessionMetricCol}>
                    <Text style={styles.sessionMetricLabel}>KALORI</Text>
                    <Text style={styles.sessionMetricValue}>{session.caloriesBurned} kcal</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  listContainer: {
    gap: 16,
  },
  sessionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  runBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sessionDateText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionSubtitleText: {
    color: '#64748B',
    fontSize: 10,
  },
  deleteSingleBtn: {
    padding: 4,
  },
  historyMapContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sessionMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  sessionMetricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionDistValue: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionMetricValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
});
