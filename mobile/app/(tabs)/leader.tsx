import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  LayoutDashboard,
  Users,
  Moon,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Star,
  BookOpen,
  AlertTriangle,
} from 'lucide-react-native';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';

export default function LeaderScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/leader?userId=${user.id}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  if (data?.error === 'Forbidden') {
    return (
      <View style={styles.center}>
        <ShieldAlert color="#f97316" size={48} />
        <Text style={styles.forbiddenText}>Accès réservé aux leaders</Text>
      </View>
    );
  }

  const stats = data?.stats || {};
  const nextEvent = data?.nextEvent;
  const nightWatch = data?.nightWatch;
  const recentCheckIns = data?.recentCheckIns || [];
  const tomorrow = addDays(new Date(), 1);

  const WATCH_HOURS = ['00:00', '01:00', '02:00', '03:00'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <LayoutDashboard color="#ffffff" size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Espace Leader</Text>
          <Text style={styles.headerSub}>Vue d'ensemble du ministère</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: stats.activeIntercessors || 0, label: 'Intercesseurs', icon: Users, color: '#4f46e5', bg: '#e0e7ff' },
          { value: stats.totalFamilies || 0, label: 'Familles', icon: ShieldCheck, color: '#7c3aed', bg: '#ede9fe' },
          { value: stats.pendingRoleRequests || 0, label: 'Demandes', icon: BookOpen, color: '#db2777', bg: '#fce7f3' },
          { value: stats.pendingTestimonies || 0, label: 'Témoignages', icon: Star, color: '#d97706', bg: '#fef3c7' },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <stat.icon color={stat.color} size={18} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochain événement</Text>
        {nextEvent ? (
          <View style={styles.eventCard}>
            <View style={styles.eventLeft}>
              <View style={styles.eventIcon}>
                <Calendar color="#db2777" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{nextEvent.title}</Text>
                <Text style={styles.eventDate}>
                  {format(new Date(nextEvent.startDate), 'd MMMM yyyy', { locale: fr })}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Calendar color="#d1d5db" size={32} />
            <Text style={styles.emptyText}>Aucun événement planifié</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Nuit du {format(tomorrow, 'd MMMM', { locale: fr })}
        </Text>
        {!nightWatch ? (
          <View style={styles.alertCard}>
            <ShieldAlert color="#f97316" size={24} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertTitle}>Aucune famille assignée</Text>
              <Text style={styles.alertSub}>La nuit de garde n'est pas couverte</Text>
            </View>
          </View>
        ) : (
          <View style={styles.watchCard}>
            <View style={styles.watchHeader}>
              <Moon color="#a78bfa" size={16} />
              <Text style={styles.watchFamily}>{nightWatch.prayerFamily?.name}</Text>
            </View>
            {WATCH_HOURS.map((hour) => {
              const schedule = nightWatch.schedules?.find((s: any) => s.startTime === hour);
              return (
                <View key={hour} style={styles.watchRow}>
                  <Text style={styles.watchHour}>{hour}</Text>
                  {schedule ? (
                    <View style={styles.watchUser}>
                      {schedule.user?.image ? (
                        <Image source={{ uri: schedule.user.image }} style={styles.watchAvatar} />
                      ) : (
                        <View style={[styles.watchAvatar, styles.watchAvatarFallback]}>
                          <Text style={styles.watchAvatarLetter}>{schedule.user?.name?.[0] || '?'}</Text>
                        </View>
                      )}
                      <Text style={styles.watchUserName}>{schedule.user?.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.watchEmpty}>Non assigné</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {recentCheckIns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi des stars — alertes</Text>
          {recentCheckIns.map((c: any) => (
            <View key={c.id} style={styles.checkInCard}>
              <View style={[styles.checkInStatus, { backgroundColor: c.healthStatus === 'RED' ? '#fef2f2' : '#fff7ed' }]}>
                <AlertTriangle color={c.healthStatus === 'RED' ? '#ef4444' : '#f97316'} size={16} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.checkInName}>{c.user?.name}</Text>
                <Text style={styles.checkInScore}>Score santé : {c.healthScore}</Text>
              </View>
              <View style={[styles.checkInBadge, { backgroundColor: c.healthStatus === 'RED' ? '#fef2f2' : '#fff7ed' }]}>
                <Text style={[styles.checkInBadgeText, { color: c.healthStatus === 'RED' ? '#ef4444' : '#f97316' }]}>
                  {c.healthStatus === 'RED' ? 'Critique' : 'Attention'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  forbiddenText: { color: '#374151', fontSize: 16, fontWeight: '600', marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#5b21b6',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerIconBox: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'flex-start',
  },
  statIcon: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 12 },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderLeftWidth: 4,
    borderLeftColor: '#db2777',
  },
  eventLeft: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  eventDate: { fontSize: 12, color: '#6b7280', marginTop: 3, textTransform: 'capitalize' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#9ca3af', marginTop: 8, fontSize: 13 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#9a3412' },
  alertSub: { fontSize: 12, color: '#c2410c', marginTop: 2 },
  watchCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 16,
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  watchFamily: { color: '#a78bfa', fontWeight: '700', fontSize: 14 },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  watchHour: { color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 13, width: 50 },
  watchUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  watchUserName: { color: '#fff', fontSize: 13, fontWeight: '500' },
  watchAvatar: { height: 26, width: 26, borderRadius: 13 },
  watchAvatarFallback: { backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  watchAvatarLetter: { color: '#fff', fontSize: 10, fontWeight: '700' },
  watchEmpty: { color: '#f87171', fontSize: 12, fontStyle: 'italic' },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  checkInStatus: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  checkInScore: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkInBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  checkInBadgeText: { fontSize: 11, fontWeight: '600' },
});
