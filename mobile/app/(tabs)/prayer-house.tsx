import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Church, Moon, Users, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';

export default function PrayerHouseScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/prayer-house?userId=${user.id}`);
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
        <ActivityIndicator color="#8b5cf6" size="large" />
      </View>
    );
  }

  const families = data?.families || [];
  const currentAssignment = data?.currentAssignment;
  const myNightSchedules = data?.myNightSchedules || [];
  const assignments = data?.assignments || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Church color="#ffffff" size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Maison de Prière</Text>
          <Text style={styles.headerSub}>Familles & Sentinelles (00h–04h)</Text>
        </View>
      </View>

      {currentAssignment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cette semaine</Text>
          <View style={styles.watchCard}>
            <View style={styles.watchCardHeader}>
              <Moon color="#a78bfa" size={18} />
              <Text style={styles.watchCardFamily}>{currentAssignment.prayerFamily?.name}</Text>
            </View>
            {currentAssignment.schedules?.length > 0 ? (
              currentAssignment.schedules.map((s: any) => (
                <View key={s.id} style={styles.watchRow}>
                  <Text style={styles.watchTime}>{s.startTime}–{s.endTime}</Text>
                  <View style={styles.watchUser}>
                    {s.user?.image ? (
                      <Image source={{ uri: s.user.image }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarLetter}>{s.user?.name?.[0] || '?'}</Text>
                      </View>
                    )}
                    <Text style={styles.watchUserName}>{s.user?.name || 'Non assigné'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucun créneau ce soir</Text>
            )}
          </View>
        </View>
      )}

      {myNightSchedules.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes prochains créneaux</Text>
          {myNightSchedules.map((s: any) => (
            <View key={s.id} style={styles.scheduleCard}>
              <View style={styles.scheduleIconBox}>
                <Moon color="#8b5cf6" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTitle}>{s.assignment?.prayerFamily?.name || 'Maison de Prière'}</Text>
                <Text style={styles.scheduleDate}>
                  {format(new Date(s.date), 'EEEE d MMMM', { locale: fr })} • {s.startTime}–{s.endTime}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Les Familles ({families.length})</Text>
        {families.map((family: any) => (
          <View key={family.id} style={styles.familyCard}>
            <View style={[styles.familyColorBar, { backgroundColor: family.color || '#4f46e5' }]} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={styles.familyName}>{family.name}</Text>
              {family.description ? (
                <Text style={styles.familyDesc}>{family.description}</Text>
              ) : null}
              <View style={styles.familyMembers}>
                <Users color="#9ca3af" size={13} />
                <Text style={styles.familyMembersText}>{family._count?.users || 0} membre{family._count?.users !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.familyAvatars}>
              {(family.users || []).slice(0, 4).map((m: any, i: number) => (
                m.image ? (
                  <Image key={i} source={{ uri: m.image }} style={[styles.familyAvatar, { marginLeft: i > 0 ? -8 : 0 }]} />
                ) : (
                  <View key={i} style={[styles.familyAvatar, styles.avatarFallback, { marginLeft: i > 0 ? -8 : 0 }]}>
                    <Text style={styles.familyAvatarLetter}>{m.name?.[0] || '?'}</Text>
                  </View>
                )
              ))}
            </View>
          </View>
        ))}
        {families.length === 0 && (
          <View style={styles.emptyBox}>
            <Church color="#d1d5db" size={40} />
            <Text style={styles.emptyBoxText}>Aucune famille créée</Text>
          </View>
        )}
      </View>

      {assignments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plannings à venir</Text>
          {assignments.map((a: any) => (
            <View key={a.id} style={styles.assignCard}>
              <View style={styles.assignHeader}>
                <Calendar color="#8b5cf6" size={16} />
                <Text style={styles.assignWeek}>
                  Sem. du {format(new Date(a.weekStart), 'd MMM', { locale: fr })}
                </Text>
                <View style={styles.assignFamilyBadge}>
                  <Text style={styles.assignFamilyText}>{a.prayerFamily?.name}</Text>
                </View>
              </View>
              <Text style={styles.assignSlots}>{a.schedules?.length || 0} créneaux planifiés</Text>
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
    backgroundColor: '#7c3aed',
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
  watchCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 16,
  },
  watchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  watchCardFamily: { color: '#a78bfa', fontWeight: '700', fontSize: 15 },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  watchTime: { color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 13 },
  watchUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  watchUserName: { color: '#fff', fontSize: 13, fontWeight: '500' },
  avatar: { height: 28, width: 28, borderRadius: 14 },
  avatarFallback: { backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  scheduleIconBox: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  scheduleDate: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  familyColorBar: { width: 4, height: '100%', borderRadius: 2, minHeight: 40 },
  familyName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  familyDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  familyMembers: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  familyMembersText: { fontSize: 11, color: '#9ca3af' },
  familyAvatars: { flexDirection: 'row', alignItems: 'center' },
  familyAvatar: { height: 28, width: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  familyAvatarLetter: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyBoxText: { color: '#9ca3af', marginTop: 8, fontSize: 14 },
  assignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  assignHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  assignWeek: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  assignFamilyBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  assignFamilyText: { color: '#6d28d9', fontSize: 11, fontWeight: '600' },
  assignSlots: { fontSize: 12, color: '#9ca3af' },
});
