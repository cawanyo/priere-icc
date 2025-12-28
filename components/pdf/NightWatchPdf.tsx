/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { normalizeDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", flexDirection: "column" },
  header: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#4f46e5", paddingBottom: 10 
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1e1b4b", textTransform: "uppercase" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  familyBadge: { 
    backgroundColor: "#eef2ff", padding: "4 8", borderRadius: 4, 
    fontSize: 10, color: "#4f46e5", fontWeight: "bold" 
  },
  
  table: { display: "flex", flexDirection: "column", width: "100%", borderLeftWidth: 1, borderTopWidth: 1, borderColor: "#e5e7eb" },
  row: { flexDirection: "row" },
  
  // En-têtes
  headerCell: { 
    flex: 1, backgroundColor: "#f9fafb", padding: 8, 
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb",
    alignItems: "center" 
  },
  hourHeader: { width: 60, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", padding: 8, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  
  headerTextDay: { fontSize: 10, fontWeight: "bold", color: "#374151", textTransform: "uppercase" },
  headerTextDate: { fontSize: 14, fontWeight: "bold", color: "#111827" },

  // Cellules
  cell: { 
    flex: 1, height: 60, padding: 5, 
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center"
  },
  hourCell: { width: 60, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  hourText: { fontSize: 10, fontWeight: "bold", color: "#6b7280" },

  // Contenu cellule
  userBox: { alignItems: "center", flexDirection: "column", gap: 2 },
  userName: { fontSize: 10, fontWeight: "bold", color: "#1e1b4b" },
  userPhone: { fontSize: 8, color: "#6b7280" },
  emptyText: { fontSize: 8, color: "#d1d5db", fontStyle: "italic" },

  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 8, color: "#9ca3af" }
});

interface NightWatchPdfProps {
  weekDate: Date;
  familyName: string;
  schedules: any[];
}

export function NightWatchPdf({ weekDate, familyName, schedules }: NightWatchPdfProps) {
  // On génère les 5 jours (Lundi-Vendredi)
  const weekStart = startOfWeek(normalizeDate(weekDate), { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const hours = ["00:00", "01:00", "02:00", "03:00"];

  const getSchedule = (day: Date, hour: string) => {
    return schedules.find((s) => isSameDay(normalizeDate(s.date), day) && s.startTime === hour);
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Planning des Sentinelles</Text>
                <Text style={styles.subtitle}>
                    Maison de Prière • 00h00 - 04h00
                </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.familyBadge}>Famille de garde : {familyName}</Text>
                <Text style={{ fontSize: 10, marginTop: 4, color: "#6b7280" }}>
                    Semaine du {format(weekStart, "d MMMM yyyy", { locale: fr })}
                </Text>
            </View>
        </View>

        {/* Tableau */}
        <View style={styles.table}>
            
            {/* Ligne En-tête Jours */}
            <View style={styles.row}>
                <View style={styles.hourHeader}><Text style={styles.hourText}>HEURE</Text></View>
                {days.map(day => (
                    <View key={day.toISOString()} style={styles.headerCell}>
                        <Text style={styles.headerTextDay}>{format(day, "EEEE", { locale: fr })}</Text>
                        <Text style={styles.headerTextDate}>{format(day, "d", { locale: fr })}</Text>
                    </View>
                ))}
            </View>

            {/* Lignes Heures */}
            {hours.map(hour => (
                <View key={hour} style={styles.row}>
                    <View style={styles.hourCell}>
                        <Text style={styles.hourText}>{hour}</Text>
                    </View>
                    
                    {days.map(day => {
                        const schedule = getSchedule(day, hour);
                        return (
                            <View key={day.toISOString()} style={[styles.cell, schedule ? { backgroundColor: "#eef2ff" } : {}]}>
                                {schedule ? (
                                    <View style={styles.userBox}>
                                        <Text style={styles.userName}>{schedule.user?.name || "Inconnu"}</Text>
                                        {/* {schedule.user?.phone && (
                                            <Text style={styles.userPhone}>{schedule.user.phone}</Text>
                                        )} */}
                                    </View>
                                ) : (
                                    <Text style={styles.emptyText}>- Libre -</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>

        <View style={styles.footer}>
            <Text>Généré automatiquement par ICC Prière App • {format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
        </View>
      </Page>
    </Document>
  );
}