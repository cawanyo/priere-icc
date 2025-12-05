/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PlaningWithIntercessor } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#312e81", // Indigo-900
    paddingBottom: 10,
  },
  titleSection: {
    flexDirection: "column",
  },
  appTitle: {
    fontSize: 10,
    color: "#db2777", // Pink-600
    textTransform: "uppercase",
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 20,
    color: "#312e81", // Indigo-900
    fontWeight: "bold",
  },
  subTitle: {
    fontSize: 10,
    color: "#6b7280", // Gray-500
    marginTop: 4,
  },
  // Tableau par jour
  dayContainer: {
    marginBottom: 12,
    border: "1pt solid #e5e7eb",
    borderRadius: 4,
  },
  dayHeader: {
    backgroundColor: "#f3f4f6", // Gray-100
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dayTitle: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  eventRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  lastEventRow: {
    borderBottomWidth: 0,
  },
  timeCol: {
    width: "15%",
    fontSize: 10,
    color: "#db2777", // Pink-600
    fontWeight: "bold",
  },
  infoCol: {
    width: "50%",
    paddingRight: 10,
  },
  eventTitle: {
    fontSize: 11,
    color: "#1f2937",
    fontWeight: "bold",
  },
  eventDesc: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  peopleCol: {
    width: "35%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  personBadge: {
    backgroundColor: "#e0e7ff", // Indigo-50
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  personText: {
    fontSize: 8,
    color: "#3730a3", // Indigo-800
  },
  emptyText: {
    fontSize: 9,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
});

interface PdfProps {
  title: string;
  subtitle: string;
  // On utilise le type générique combiné à 'any' pour les propriétés virtuelles (isVirtual)
  events: (PlaningWithIntercessor & { isVirtual?: boolean })[];
  startDate: Date;
  endDate: Date;
}

export function PlanningPdfDocument({ title, subtitle, events, startDate, endDate }: PdfProps) {
  
  // Organiser les données par jour
  const days = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Filtrer les événements pour ce jour
    const dayEvents = events
      .filter((e) => {
        // On utilise e.date (qui est un objet Date) au lieu de e.startTime
        const evtDate = new Date(e.date);
        return (
          evtDate.getDate() === current.getDate() &&
          evtDate.getMonth() === current.getMonth() &&
          evtDate.getFullYear() === current.getFullYear()
        );
      })
      // Tri par chaîne de caractères "HH:mm" (ex: "08:00" < "09:30")
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    days.push({
      date: new Date(current),
      events: dayEvents,
    });
    
    current.setDate(current.getDate() + 1);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.appTitle}>ICC • Ministère de la Prière</Text>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.subTitle}>{subtitle}</Text>
          </View>
        </View>

        {/* Contenu par jour */}
        {days.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayContainer} wrap={false}> 
            {/* Header du jour */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {format(day.date, "EEEE d MMMM", { locale: fr })}
              </Text>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>
                {day.events.length} créneaux
              </Text>
            </View>

            <View>
              <Text>Test</Text>
            </View>
            {/* Liste des événements */}
            {day.events.length > 0 ? (
              day.events.map((evt, idx) => (
                <View 
                    key={idx} 
                    style={[styles.eventRow, idx === day.events.length - 1 ? styles.lastEventRow : {}]}
                >
                  {/* Colonne Heure (Directement la string HH:mm) */}
                  <Text style={styles.timeCol}>
                    {evt.startTime}
                    {"\n"}-{"\n"}
                    {evt.endTime}
                  </Text>
                  
                  {/* Colonne Infos */}
                  <View style={styles.infoCol}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    {evt.description && (
                      <Text style={styles.eventDesc}>{evt.description}</Text>
                    )}
                    {evt.isVirtual && (
                      <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 2 }}>* Récurrent</Text>
                    )}
                  </View>

                  {/* Colonne Intercesseurs */}
                  <View style={styles.peopleCol}>
                    {evt.intercessors && evt.intercessors.length > 0 ? (
                      evt.intercessors.map((u: any, i: number) => (
                        <View key={i} style={styles.personBadge}>
                          <Text style={styles.personText}>{u.name}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>À pourvoir</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: 10 }}>
                <Text style={styles.emptyText}>Aucun programme</Text>
              </View>
            )}
          </View>
        ))}

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text>Document généré le {format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}</Text>
        </View>
      </Page>
    </Document>
  );
}