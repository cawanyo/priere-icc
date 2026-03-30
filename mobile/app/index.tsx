import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const leftDoor = useSharedValue(0);
  const rightDoor = useSharedValue(0);
  const glow = useSharedValue(0.9);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    glow.value = withTiming(1.05, {
      duration: 900,
      easing: Easing.inOut(Easing.ease),
    });
    leftDoor.value = withDelay(
      350,
      withTiming(-width / 2, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
    rightDoor.value = withDelay(
      350,
      withTiming(width / 2, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    const timeout = setTimeout(() => {
      if (user) router.replace("/(tabs)/");
      else router.replace("/login");
    }, 1650);

    return () => clearTimeout(timeout);
  }, [loading, user]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftDoor.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightDoor.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <ShieldCheck color="#ffffff" size={44} />
        </View>
        <Text style={styles.title}>Prayer ICC</Text>
        <Text style={styles.subtitle}>
          Entrez dans votre espace de prière, de suivi et de service.
        </Text>
      </View>

      <Animated.View style={[styles.leftDoor, leftStyle]} />
      <Animated.View style={[styles.rightDoor, rightStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    height: 288,
    width: 288,
    borderRadius: 144,
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  content: {
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 32,
  },
  iconBox: {
    height: 96,
    width: 96,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  leftDoor: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    backgroundColor: "#1e1b4b",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
  },
  rightDoor: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    backgroundColor: "#2e1065",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.05)",
  },
});
