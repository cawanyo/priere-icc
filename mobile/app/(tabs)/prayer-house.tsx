import React from 'react';
import { View, Text } from 'react-native';
import { Church } from 'lucide-react-native';

export default function PrayerHouseScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="h-20 w-20 bg-pink-100 rounded-3xl items-center justify-center mb-6">
        <Church color="#db2777" size={40} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">Maison de prière</Text>
      <Text className="text-gray-500 text-center mt-2 px-6">
        Gérez les familles et le planning des sentinelles (00h-04h).
      </Text>
    </View>
  );
}
