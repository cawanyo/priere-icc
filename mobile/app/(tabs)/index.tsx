import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Moon, Clock, User, Star, CheckCircle2, CalendarRange, ChevronRight, Home, ClipboardList } from 'lucide-react-native';

const API_URL = "http://localhost:3000/api/mobile/dashboard"; // A changer pour l'IP du serveur en dev

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mocked userId for now - normally should be from auth context
  const userId = "cmiouuh4j0000l204uewb80vy"; // A changer dynamiquement

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}?userId=${userId}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-background"><Text>Chargement...</Text></View>;

  const upcomingSchedules = [
    ...(data?.daySchedules || []),
    ...(data?.nightSchedules || [])
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Section with Gradient-like BG */}
      <View className="bg-indigo-600 px-5 pt-12 pb-16 rounded-b-[40px] shadow-lg">
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 rounded-full bg-white/20 items-center justify-center border-2 border-white/30 overflow-hidden">
              {data?.user?.image ? (
                <Image source={{ uri: data.user.image }} className="h-full w-full" />
              ) : (
                <User color="white" size={28} />
              )}
            </View>
            <View>
              <Text className="text-white/70 text-xs font-medium">Bienvenue</Text>
              <Text className="text-xl font-bold text-white">{data?.user?.name?.split(" ")[0]} 👋</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between">
          {[
            { value: data?.servicesThisMonth || 0, label: "Services\nce mois", icon: CheckCircle2 },
            { value: upcomingSchedules.length, label: "Planifiés\nà venir", icon: CalendarRange },
            { value: data?.upcomingEvents?.length || 0, label: "Événements\nà venir", icon: Star },
          ].map((stat, i) => (
            <View key={i} className="bg-white/10 p-3 rounded-2xl items-center flex-1 mx-1 border border-white/10">
              <stat.icon color="white" size={16} opacity={0.7} />
              <Text className="text-white text-xl font-extrabold mt-1">{stat.value}</Text>
              <Text className="text-white/60 text-[8px] text-center font-medium mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="px-5 -mt-8 space-y-6">
        {/* Prochains services */}
        <View>
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-5 bg-indigo-500 rounded-full" />
              <Text className="text-base font-bold text-gray-800">Prochains services</Text>
            </View>
          </View>
          
          {upcomingSchedules.length > 0 ? (
            upcomingSchedules.map((schedule, i) => {
              const isNight = "startTime" in schedule;
              return (
                <TouchableOpacity key={i} className="bg-white rounded-3xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100">
                  <View className={`h-12 w-12 rounded-2xl items-center justify-center mr-4 ${isNight ? 'bg-violet-100' : 'bg-indigo-100'}`}>
                    {isNight ? <Moon color="#8b5cf6" size={24} /> : <Clock color="#4f46e5" size={24} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-800">
                      {isNight ? "Maison de Prière" : schedule.title || "Intercession"}
                    </Text>
                    <Text className="text-xs text-gray-400 capitalize mt-0.5">
                      {format(new Date(schedule.date), "EEEE d MMMM", { locale: fr })}
                      {isNight && ` • ${schedule.startTime}–${schedule.endTime}`}
                    </Text>
                  </View>
                  <View className="h-2 w-2 rounded-full bg-emerald-400" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="bg-white rounded-3xl p-8 items-center justify-center border border-gray-100">
              <Clock color="#cbd5e1" size={40} />
              <Text className="text-gray-400 mt-2 text-sm">Aucun service planifié</Text>
            </View>
          )}
        </View>

        {/* Maison de garde */}
        {data?.currentNightWatch && (
          <View>
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-5 bg-violet-500 rounded-full" />
                <Text className="text-base font-bold text-gray-800">Maison de garde</Text>
              </View>
            </View>
            <TouchableOpacity className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-5 shadow-lg overflow-hidden">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="h-10 w-10 bg-white/20 rounded-2xl items-center justify-center">
                  <Home color="white" size={20} />
                </View>
                <View>
                  <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Cette semaine</Text>
                  <Text className="text-white text-base font-bold">{data.currentNightWatch.prayerFamily?.name}</Text>
                </View>
              </View>
              
              {data.currentNightWatch.schedules?.length > 0 ? (
                <View className="space-y-2">
                  {data.currentNightWatch.schedules.slice(0, 3).map((s: any) => (
                    <View key={s.id} className="flex-row items-center justify-between bg-white/10 py-2 px-4 rounded-xl">
                      <Text className="text-white/80 font-mono text-xs">{s.startTime}</Text>
                      <Text className="text-white font-medium text-xs">{s.user?.name || "Non assigné"}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-white/60 text-xs italic">Aucun créneau pour aujourd'hui</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Événements à venir */}
        {data?.upcomingEvents?.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-5 bg-pink-500 rounded-full" />
                <Text className="text-base font-bold text-gray-800">Événements à venir</Text>
              </View>
            </View>
            <View className="space-y-3">
              {data.upcomingEvents.map((event: any) => (
                <TouchableOpacity key={event.id} className="bg-white rounded-3xl p-4 flex-row items-center shadow-sm border border-gray-100">
                  <View className="h-10 w-10 bg-pink-100 rounded-2xl items-center justify-center mr-4">
                    <ClipboardList color="#db2777" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-800 line-clamp-1">{event.title}</Text>
                    <Text className="text-[10px] text-gray-400 mt-0.5 capitalize">
                      {format(new Date(event.startDate), "EEEE d MMMM", { locale: fr })}
                    </Text>
                  </View>
                  <ChevronRight color="#cbd5e1" size={20} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Témoignages */}
        {data?.recentTestimonies?.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <View className="w-1.5 h-5 bg-amber-400 rounded-full" />
                <Text className="text-base font-bold text-gray-800">Témoignages récents</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-1">
              {data.recentTestimonies.map((t: any) => (
                <TouchableOpacity key={t.id} className="bg-white rounded-3xl p-4 mr-3 w-64 shadow-sm border border-gray-100">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="h-8 w-8 rounded-full bg-amber-100 items-center justify-center overflow-hidden">
                      {t.user?.image ? (
                        <Image source={{ uri: t.user.image }} className="h-full w-full" />
                      ) : (
                        <Text className="text-amber-600 text-[10px] font-bold">{t.name?.slice(0, 1).toUpperCase()}</Text>
                      )}
                    </View>
                    <Text className="text-xs font-bold text-gray-800 truncate flex-1">{t.name}</Text>
                    <Text className="text-[8px] text-gray-400">{format(new Date(t.createdAt), "d MMM", { locale: fr })}</Text>
                  </View>
                  <Text className="text-[11px] text-gray-500 leading-relaxed" numberOfLines={3}>
                    {t.content}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
