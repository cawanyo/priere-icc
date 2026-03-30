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
import { CalendarRange, Clock, Moon, Star, ChevronRight } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PlanningScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/planning?userId=${user.id}`);
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
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  const mySchedules: any[] = data?.mySchedules || [];
  const thisWeekSchedules: any[] = data?.thisWeekSchedules || [];
  const myNightSchedules: any[] = data?.myNightSchedules || [];
  const upcomingEvents: any[] = data?.upcomingEvents || [];

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });

  const schedulesForDay = thisWeekSchedules.filter((s) =>
    isSameDay(new Date(s.date), selectedDay)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <CalendarRange color="#ffffff" size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Planning</Text>
          <Text style={styles.headerSub}>Vos créneaux & événements</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cette semaine</Text>
        <View style={styles.weekRow}>
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, today);
            const hasSlot = thisWeekSchedules.some((s) => isSameDay(new Date(s.date), day));
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDay(day)}
                style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{DAYS[i]}</Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive, isToday && !isSelected && styles.dayNumToday]}>
                  {day.getDate()}
                </Text>
                {hasSlot && <View style={[styles.dayDot, isSelected && styles.dayDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.daySchedules}>
          {schedulesForDay.length > 0 ? (
            schedulesForDay.map((s: any) => (
              <View key={s.id} style={styles.slotCard}>
                <View style={styles.slotTime}>
                  <Text style={styles.slotTimeText}>{s.startTime}</Text>
                  <Text style={styles.slotTimeDash}>–</Text>
                  <Text style={styles.slotTimeText}>{s.endTime}</Text>
                </View>
                <View style={styles.slotDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotTitle}>{s.title}</Text>
                  {s.description ? <Text style={styles.slotDesc}>{s.description}</Text> : null}
                  <View style={styles.slotUsers}>
                    {(s.users || []).slice(0, 5).map((u: any, i: number) => (
                      u.image ? (
                        <Image key={i} source={{ uri: u.image }} style={[styles.slotAvatar, { marginLeft: i > 0 ? -6 : 0 }]} />
                      ) : (
                        <View key={i} style={[styles.slotAvatar, styles.slotAvatarFallback, { marginLeft: i > 0 ? -6 : 0 }]}>
                          <Text style={styles.slotAvatarLetter}>{u.name?.[0] || '?'}</Text>
                        </View>
                      )
                    ))}
                    {s.users?.length > 5 && (
                      <View style={[styles.slotAvatar, styles.slotAvatarMore, { marginLeft: -6 }]}>
                        <Text style={styles.slotAvatarMoreText}>+{s.users.length - 5}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDay}>
              <Clock color="#d1d5db" size={32} />
              <Text style={styles.emptyDayText}>Aucun créneau ce jour</Text>
            </View>
          )}
        </View>
      </View>

      {mySchedules.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes prochains services</Text>
          {mySchedules.map((s: any) => (
            <View key={s.id} style={styles.mySlotCard}>
              <View style={styles.mySlotIcon}>
                <Clock color="#4f46e5" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mySlotTitle}>{s.title}</Text>
                <Text style={styles.mySlotDate}>
                  {format(new Date(s.date), 'EEEE d MMMM', { locale: fr })} • {s.startTime}–{s.endTime}
                </Text>
              </View>
              <View style={styles.mySlotBadge}>
                <Text style={styles.mySlotBadgeText}>Assigné</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {myNightSchedules.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes créneaux de nuit</Text>
          {myNightSchedules.map((s: any) => (
            <View key={s.id} style={styles.mySlotCard}>
              <View style={[styles.mySlotIcon, { backgroundColor: '#ede9fe' }]}>
                <Moon color="#8b5cf6" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mySlotTitle}>{s.assignment?.prayerFamily?.name || 'Sentinelle'}</Text>
                <Text style={styles.mySlotDate}>
                  {format(new Date(s.date), 'EEEE d MMMM', { locale: fr })} • {s.startTime}–{s.endTime}
                </Text>
              </View>
              <View style={[styles.mySlotBadge, { backgroundColor: '#ede9fe' }]}>
                <Text style={[styles.mySlotBadgeText, { color: '#6d28d9' }]}>Nuit</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Événements spéciaux</Text>
          {upcomingEvents.map((e: any) => (
            <View key={e.id} style={styles.eventCard}>
              <View style={styles.eventIcon}>
                <Star color="#db2777" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventDate}>
                  {format(new Date(e.startDate), 'd MMMM yyyy', { locale: fr })}
                  {e.endDate && !isSameDay(new Date(e.startDate), new Date(e.endDate))
                    ? ` → ${format(new Date(e.endDate), 'd MMMM', { locale: fr })}`
                    : ''}
                </Text>
                {e.eventTemplates?.length > 0 && (
                  <Text style={styles.eventSlots}>{e.eventTemplates.length} créneau{e.eventTemplates.length > 1 ? 'x' : ''}</Text>
                )}
              </View>
              <ChevronRight color="#d1d5db" size={18} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4f46e5',
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
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b4b', marginBottom: 12 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 12,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayBtnActive: { backgroundColor: '#4f46e5' },
  dayLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  dayLabelActive: { color: 'rgba(255,255,255,0.8)' },
  dayNum: { fontSize: 15, fontWeight: '700', color: '#374151' },
  dayNumActive: { color: '#fff' },
  dayNumToday: { color: '#4f46e5' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4f46e5', marginTop: 3 },
  dayDotActive: { backgroundColor: '#fff' },
  daySchedules: { minHeight: 60 },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  slotTime: { alignItems: 'center', minWidth: 44 },
  slotTimeText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  slotTimeDash: { fontSize: 10, color: '#9ca3af' },
  slotDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 12, alignSelf: 'stretch' },
  slotTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  slotDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  slotUsers: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  slotAvatar: { height: 22, width: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#fff' },
  slotAvatarFallback: { backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  slotAvatarLetter: { color: '#fff', fontSize: 8, fontWeight: '700' },
  slotAvatarMore: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  slotAvatarMoreText: { color: '#6b7280', fontSize: 8, fontWeight: '700' },
  emptyDay: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyDayText: { color: '#9ca3af', marginTop: 8, fontSize: 13 },
  mySlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  mySlotIcon: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mySlotTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  mySlotDate: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  mySlotBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mySlotBadgeText: { color: '#4338ca', fontSize: 11, fontWeight: '600' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
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
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  eventDate: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  eventSlots: { fontSize: 11, color: '#db2777', marginTop: 3, fontWeight: '600' },
});
