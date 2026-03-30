import React from 'react';
import { View, Text } from 'react-native';
import { CalendarRange } from 'lucide-react-native';

export default function PlanningScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="h-20 w-20 bg-indigo-100 rounded-3xl items-center justify-center mb-6">
        <CalendarRange color="#4f46e5" size={40} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">Planning</Text>
      <Text className="text-gray-500 text-center mt-2 px-6">
        Gérez la planification et les créneaux récurrents.
      </Text>
    </View>
  );
}
