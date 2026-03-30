import React from 'react';
import { View, Text } from 'react-native';
import { LayoutDashboard } from 'lucide-react-native';

export default function LeaderScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="h-20 w-20 bg-violet-100 rounded-3xl items-center justify-center mb-6">
        <LayoutDashboard color="#8b5cf6" size={40} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">Leader</Text>
      <Text className="text-gray-500 text-center mt-2 px-6">
        Accédez aux outils de gestion et au suivi des stars.
      </Text>
    </View>
  );
}
