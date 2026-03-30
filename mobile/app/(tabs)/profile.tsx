import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import {
  User,
  LogOut,
  Shield,
  Heart,
  BookOpen,
  Phone,
  Mail,
  Edit3,
  Check,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';
import { router } from 'expo-router';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrateur', color: '#7c3aed', bg: '#ede9fe' },
  LEADER: { label: 'Leader', color: '#4f46e5', bg: '#e0e7ff' },
  INTERCESSOR: { label: 'Intercesseur', color: '#0891b2', bg: '#e0f2fe' },
  PRAYER_LEADER: { label: 'Responsable prière', color: '#db2777', bg: '#fce7f3' },
  REQUESTER: { label: 'Membre', color: '#6b7280', bg: '#f3f4f6' },
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'prayers' | 'testimonies'>('info');

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/profile?userId=${user.id}`);
      const json = await res.json();
      setData(json);
      setName(json.user?.name || '');
      setPhone(json.user?.phone || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/profile?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (res.ok) {
        setData({ ...data, user: json.user });
        setEditing(false);
        Alert.alert('Succès', 'Profil mis à jour.');
      } else {
        Alert.alert('Erreur', json.error || 'Impossible de mettre à jour.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Problème réseau.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  const profile = data?.user;
  const prayers = profile?.prayers || [];
  const testimonies = profile?.testimonies || [];
  const roleInfo = ROLE_LABELS[profile?.role] || ROLE_LABELS.REQUESTER;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{profile?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
          <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
        </View>
        {profile?.prayerFamily && (
          <View style={styles.familyBadge}>
            <Heart color="#db2777" size={12} />
            <Text style={styles.familyText}>{profile.prayerFamily.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        {(['info', 'prayers', 'testimonies'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'info' ? 'Infos' : tab === 'prayers' ? `Prières (${prayers.length})` : `Témoignages (${testimonies.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'info' && (
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Edit3 color="#4f46e5" size={16} />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <X color="#6b7280" size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                  <Check color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <User color="#4f46e5" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Nom complet</Text>
                {editing ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.fieldInput}
                    placeholder="Votre nom"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.name || '—'}</Text>
                )}
              </View>
            </View>

            <View style={[styles.fieldRow, { borderTopWidth: 1, borderTopColor: '#f3f4f6' }]}>
              <View style={styles.fieldIcon}>
                <Mail color="#6b7280" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{profile?.email || '—'}</Text>
              </View>
            </View>

            <View style={[styles.fieldRow, { borderTopWidth: 1, borderTopColor: '#f3f4f6' }]}>
              <View style={styles.fieldIcon}>
                <Phone color="#6b7280" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Téléphone</Text>
                {editing ? (
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.fieldInput}
                    placeholder="+33 6 00 00 00 00"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.phone || '—'}</Text>
                )}
              </View>
            </View>

            <View style={[styles.fieldRow, { borderTopWidth: 1, borderTopColor: '#f3f4f6' }]}>
              <View style={styles.fieldIcon}>
                <Shield color="#7c3aed" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Rôle</Text>
                <Text style={styles.fieldValue}>{roleInfo.label}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <LogOut color="#ef4444" size={18} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'prayers' && (
        <View style={styles.section}>
          {prayers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Heart color="#d1d5db" size={40} />
              <Text style={styles.emptyText}>Aucune demande de prière</Text>
            </View>
          ) : (
            prayers.map((p: any) => (
              <View key={p.id} style={styles.prayerCard}>
                <View style={styles.prayerHeader}>
                  <View style={[styles.prayerStatus, { backgroundColor: p.status === 'APPROVED' ? '#dcfce7' : p.status === 'REFUSED' ? '#fef2f2' : '#fef9c3' }]}>
                    <Text style={[styles.prayerStatusText, { color: p.status === 'APPROVED' ? '#166534' : p.status === 'REFUSED' ? '#991b1b' : '#713f12' }]}>
                      {p.status === 'APPROVED' ? 'Acceptée' : p.status === 'REFUSED' ? 'Refusée' : 'En attente'}
                    </Text>
                  </View>
                  <Text style={styles.prayerType}>{p.subjectType}</Text>
                </View>
                <Text style={styles.prayerContent} numberOfLines={3}>{p.content}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'testimonies' && (
        <View style={styles.section}>
          {testimonies.length === 0 ? (
            <View style={styles.emptyBox}>
              <BookOpen color="#d1d5db" size={40} />
              <Text style={styles.emptyText}>Aucun témoignage</Text>
            </View>
          ) : (
            testimonies.map((t: any) => (
              <View key={t.id} style={styles.testimonyCard}>
                <View style={styles.testimonyHeader}>
                  <View style={[styles.prayerStatus, { backgroundColor: t.status === 'APPROVED' ? '#dcfce7' : t.status === 'REFUSED' ? '#fef2f2' : '#fef9c3' }]}>
                    <Text style={[styles.prayerStatusText, { color: t.status === 'APPROVED' ? '#166534' : t.status === 'REFUSED' ? '#991b1b' : '#713f12' }]}>
                      {t.status === 'APPROVED' ? 'Publié' : t.status === 'REFUSED' ? 'Refusé' : 'En attente'}
                    </Text>
                  </View>
                </View>
                {t.content ? <Text style={styles.testimonyContent} numberOfLines={4}>{t.content}</Text> : null}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 56,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { height: 80, width: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '700' },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 6 },
  roleText: { fontSize: 13, fontWeight: '600' },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  familyText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#4f46e5' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e1b4b' },
  editBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  fieldIcon: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: '#1f2937', fontWeight: '500', marginTop: 2 },
  fieldInput: {
    fontSize: 14,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#4f46e5',
    paddingBottom: 2,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#9ca3af', marginTop: 8, fontSize: 14 },
  prayerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  prayerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  prayerStatus: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  prayerStatusText: { fontSize: 11, fontWeight: '600' },
  prayerType: { fontSize: 12, color: '#6b7280' },
  prayerContent: { fontSize: 13, color: '#374151', lineHeight: 20 },
  testimonyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  testimonyHeader: { marginBottom: 8 },
  testimonyContent: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
