import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Moon, Clock, User, Star, CheckCircle2, CalendarRange, ChevronRight, Home, ClipboardList } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/dashboard?userId=${user.id}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  const upcomingSchedules = [
    ...(data?.daySchedules || []),
    ...(data?.nightSchedules || [])
  ].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroTop}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarBox}>
              {data?.user?.image ? (
                <Image source={{ uri: data.user.image }} style={styles.avatarImg} />
              ) : (
                <User color="white" size={28} />
              )}
            </View>
            <View>
              <Text style={styles.welcomeText}>Bienvenue</Text>
              <Text style={styles.nameText}>{data?.user?.name?.split(' ')[0]} 👋</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: data?.servicesThisMonth || 0, label: 'Services\nce mois', Icon: CheckCircle2 },
            { value: upcomingSchedules.length, label: 'Planifiés\nà venir', Icon: CalendarRange },
            { value: data?.upcomingEvents?.length || 0, label: 'Événements\nà venir', Icon: Star },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <stat.Icon color="white" size={16} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: '#4f46e5' }]} />
            <Text style={styles.sectionTitle}>Prochains services</Text>
          </View>

          {upcomingSchedules.length > 0 ? (
            upcomingSchedules.map((schedule: any, i: number) => {
              const isNight = 'startTime' in schedule && !('title' in schedule);
              return (
                <View key={i} style={styles.slotCard}>
                  <View style={[styles.slotIcon, { backgroundColor: isNight ? '#ede9fe' : '#e0e7ff' }]}>
                    {isNight ? <Moon color="#8b5cf6" size={22} /> : <Clock color="#4f46e5" size={22} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTitle}>
                      {isNight ? 'Maison de Prière' : schedule.title || 'Intercession'}
                    </Text>
                    <Text style={styles.slotDate}>
                      {format(new Date(schedule.date), 'EEEE d MMMM', { locale: fr })}
                      {isNight ? ` • ${schedule.startTime}–${schedule.endTime}` : ''}
                    </Text>
                  </View>
                  <View style={styles.slotDot} />
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Clock color="#cbd5e1" size={36} />
              <Text style={styles.emptyText}>Aucun service planifié</Text>
            </View>
          )}
        </View>

        {data?.currentNightWatch && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBar, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.sectionTitle}>Maison de garde</Text>
            </View>
            <View style={styles.watchCard}>
              <View style={styles.watchTop}>
                <View style={styles.watchIconBox}>
                  <Home color="white" size={18} />
                </View>
                <View>
                  <Text style={styles.watchWeekLabel}>Cette semaine</Text>
                  <Text style={styles.watchFamilyName}>{data.currentNightWatch.prayerFamily?.name}</Text>
                </View>
              </View>
              {data.currentNightWatch.schedules?.length > 0 ? (
                data.currentNightWatch.schedules.slice(0, 3).map((s: any) => (
                  <View key={s.id} style={styles.watchRow}>
                    <Text style={styles.watchTime}>{s.startTime}</Text>
                    <Text style={styles.watchName}>{s.user?.name || 'Non assigné'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.watchEmpty}>Aucun créneau pour aujourd'hui</Text>
              )}
            </View>
          </View>
        )}

        {data?.upcomingEvents?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBar, { backgroundColor: '#db2777' }]} />
              <Text style={styles.sectionTitle}>Événements à venir</Text>
            </View>
            {data.upcomingEvents.map((event: any) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <ClipboardList color="#db2777" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {format(new Date(event.startDate), 'EEEE d MMMM', { locale: fr })}
                  </Text>
                </View>
                <ChevronRight color="#cbd5e1" size={18} />
              </View>
            ))}
          </View>
        )}

        {data?.recentTestimonies?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBar, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.sectionTitle}>Témoignages récents</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.recentTestimonies.map((t: any) => (
                <View key={t.id} style={styles.testimonyCard}>
                  <View style={styles.testimonyHeader}>
                    <View style={styles.testimonyAvatar}>
                      {t.user?.image ? (
                        <Image source={{ uri: t.user.image }} style={styles.testimonyAvatarImg} />
                      ) : (
                        <Text style={styles.testimonyAvatarLetter}>{t.name?.slice(0, 1).toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={styles.testimonyName} numberOfLines={1}>{t.name}</Text>
                    <Text style={styles.testimonyDate}>{format(new Date(t.createdAt), 'd MMM', { locale: fr })}</Text>
                  </View>
                  <Text style={styles.testimonyContent} numberOfLines={3}>{t.content}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  heroSection: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroTop: { marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: {
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImg: { height: 52, width: 52, borderRadius: 26 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  nameText: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, textAlign: 'center', fontWeight: '600', marginTop: 2 },
  body: { paddingHorizontal: 16, marginTop: -20 },
  section: { paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  sectionBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  slotIcon: {
    height: 46,
    width: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  slotTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  slotDate: { fontSize: 12, color: '#9ca3af', marginTop: 3, textTransform: 'capitalize' },
  slotDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#34d399' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyText: { color: '#9ca3af', marginTop: 8, fontSize: 13 },
  watchCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 16,
  },
  watchTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  watchIconBox: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchWeekLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  watchFamilyName: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 6,
  },
  watchTime: { color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: 12 },
  watchName: { color: '#fff', fontSize: 13, fontWeight: '500' },
  watchEmpty: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  eventIcon: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  eventDate: { fontSize: 12, color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' },
  testimonyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    width: 240,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  testimonyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  testimonyAvatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  testimonyAvatarImg: { height: 32, width: 32 },
  testimonyAvatarLetter: { color: '#d97706', fontSize: 12, fontWeight: '700' },
  testimonyName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#1f2937' },
  testimonyDate: { fontSize: 9, color: '#9ca3af' },
  testimonyContent: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
});
