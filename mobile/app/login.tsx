import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { API_BASE_URL } from '@/lib/config';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function LoginScreen() {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { signIn, user } = useAuth();

  React.useEffect(() => {
    if (user) router.replace('/(tabs)/');
  }, [user]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const json = await response.json();

      if (!response.ok || !json.user) {
        Alert.alert('Connexion impossible', json.message || 'Identifiants invalides.');
        return;
      }

      await signIn(json.user);
      await registerForPushNotificationsAsync();
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#eef2ff', '#ffffff', '#fdf2f8']} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.logoBox}>
              <ShieldCheck color="white" size={38} />
            </View>
            <View style={styles.badgeRow}>
              <Sparkles color="#db2777" size={16} />
              <Text style={styles.badgeText}>Prayer ICC</Text>
            </View>
            <Text style={styles.headline}>Bon retour</Text>
            <Text style={styles.subheadline}>
              Connectez-vous pour accéder à votre espace de prière sur mobile.
            </Text>
          </View>

          <View style={styles.fields}>
            <View>
              <Text style={styles.label}>Email ou Téléphone</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="votre@email.com"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  decorCircle1: {
    position: 'absolute',
    top: 112,
    right: 32,
    height: 112,
    width: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(165,180,252,0.4)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 96,
    left: 24,
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251,207,232,0.4)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    height: 80,
    width: 80,
    backgroundColor: '#4f46e5',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  badgeText: {
    color: '#db2777',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  subheadline: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  fields: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    color: '#111827',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
