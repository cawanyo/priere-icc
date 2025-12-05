/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { PlaningWithIntercessor } from "@/lib/types"; // Assurez-vous que ce chemin est correct

// --- CONFIGURATION DU DESIGN ---
const NORMAL_HOUR_HEIGHT = 50; // Hauteur d'une heure occupée (en points)
const COLLAPSED_HEIGHT = 15;   // Hauteur d'une zone vide compressée
const START_HOUR_DAY = 0;      // 00:00
const END_HOUR_DAY = 24;       // 24:00

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  titleSection: { flexDirection: "column" },
  docTitle: { fontSize: 14, color: "#1e1b4b", fontWeight: "bold", textTransform: "uppercase" },
  subTitle: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  
  // Grille Semaine
  weekContainer: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  
  // Colonne Axe Temps (Gauche)
  timeAxisColumn: {
    width: 35,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 26, // S'aligne avec la hauteur du header jour
    backgroundColor: "#f9fafb",
  },
  timeLabel: {
    position: "absolute",
    right: 6,
    fontSize: 7,
    color: "#6b7280",
    transform: "translateY(-4)", // Centrage vertical sur la ligne
  },
  collapsedLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 6,
    color: "#d1d5db",
    fontStyle: "italic",
    paddingTop: 4,
  },

  // Colonnes Jours
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "column",
    position: "relative",
  },
  dayHeader: {
    height: 26,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  dayName: { fontSize: 8, color: "#4b5563", textTransform: "uppercase", fontWeight: "bold" },
  dayNumber: { fontSize: 10, color: "#1f2937", fontWeight: "bold" },

  // Grille de fond
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderStyle: "solid",
  },
  collapsedBlock: {
    backgroundColor: "#fcfcfc", // Gris très léger pour les zones vides
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderStyle: "dashed",
  },

  // --- BLOCS ÉVÉNEMENTS ---
  eventBox: {
    position: "absolute",
    left: 2,
    right: 2,
    backgroundColor: "#e0e7ff", // Indigo-100
    borderRadius: 3,
    padding: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5", // Indigo-600
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  virtualEventBox: {
    backgroundColor: "#ffffff", 
    borderLeftColor: "#9ca3af",
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.9,
  },
  
  eventTimeText: { fontSize: 6, color: "#4338ca", fontWeight: "bold", marginBottom: 1 },
  eventTitle: { fontSize: 7, color: "#1e1b4b", fontWeight: "bold", marginBottom: 1 },
  
  // Liste des personnes
  intercessorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginTop: 2,
  },
  intercessorBadge: {
    fontSize: 6,
    color: "#1e1b4b",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },

  footer: {
    marginTop: "auto",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

// Extension du type pour inclure la propriété virtuelle si besoin
type CalendarEvent = PlaningWithIntercessor & { isVirtual?: boolean };

interface PdfProps {
  title: string;
  subtitle: string;
  events: CalendarEvent[];
  startDate: Date;
  endDate: Date;
}

// Structure d'un segment de temps pour l'axe Y
type TimeSegment = {
  startHour: number;
  endHour: number;
  type: 'normal' | 'collapsed';
  height: number;
  yStart: number;
};

export function PlanningPdfCalendar({ title, subtitle, events, startDate, endDate }: PdfProps) {
  
  const weeks = [];
  let currentStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  // Découpage en semaines
  while (currentStart <= endDate || weeks.length === 0) {
    const currentEnd = endOfWeek(currentStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: currentStart, end: currentEnd });
    
    // Filtrer les événements de la semaine
    // On compare la date du jour (evt.date)
    const weekEvents = events.filter(e => {
      const d = new Date(e.date);
      return d >= currentStart && d <= currentEnd;
    });

    // --- 1. CALCUL DES HEURES OCCUPÉES (Smart Axis) ---
    // On crée une carte des 24h : true = occupée, false = vide
    const activeHours = new Array(24).fill(false);

    weekEvents.forEach(evt => {
        // Parsing des heures "HH:mm"
        const [startHStr] = evt.startTime.split(':');
        const [endHStr, endMStr] = evt.endTime.split(':');
        
        const startH = parseInt(startHStr, 10);
        let endH = parseInt(endHStr, 10);
        const endM = parseInt(endMStr, 10);

        // Si l'événement finit à 10h30, l'heure 10 est occupée jusqu'à 11h
        if (endM > 0) endH++; 

        // Marquer les heures occupées
        for (let h = startH; h < endH; h++) {
            if (h >= 0 && h < 24) activeHours[h] = true;
        }
    });

    // --- 2. CRÉATION DES SEGMENTS (Normal vs Collapsed) ---
    const segments: TimeSegment[] = [];
    let currentY = 0;
    let h = START_HOUR_DAY;

    while (h < END_HOUR_DAY) {
        if (activeHours[h]) {
            // Heure occupée -> Segment Normal (Grand)
            segments.push({
                startHour: h,
                endHour: h + 1,
                type: 'normal',
                height: NORMAL_HOUR_HEIGHT,
                yStart: currentY
            });
            currentY += NORMAL_HOUR_HEIGHT;
            h++;
        } else {
            // Heure vide -> Chercher la fin du trou
            let endEmpty = h + 1;
            while (endEmpty < END_HOUR_DAY && !activeHours[endEmpty]) {
                endEmpty++;
            }
            
            // Créer un segment compressé (Petit)
            segments.push({
                startHour: h,
                endHour: endEmpty,
                type: 'collapsed',
                height: COLLAPSED_HEIGHT,
                yStart: currentY
            });
            currentY += COLLAPSED_HEIGHT;
            h = endEmpty;
        }
    }

    weeks.push({
      start: currentStart,
      end: currentEnd,
      segments,
      totalHeight: currentY,
      days: days.map(day => ({
        date: day,
        // Associer les événements à leur jour précis
        events: weekEvents.filter(e => isSameDay(new Date(e.date), day))
      }))
    });

    if (currentStart > endDate) break;
    currentStart = addWeeks(currentStart, 1);
  }

  // --- 3. FONCTION DE POSITIONNEMENT (Y) ---
  const getYPosition = (timeStr: string, segments: TimeSegment[]) => {
    const [h, m] = timeStr.split(':').map(Number);

    // Trouver le segment correspondant à l'heure H
    const segment = segments.find(s => h >= s.startHour && h < s.endHour);
    
    if (!segment) return 0;

    if (segment.type === 'normal') {
        // Position proportionnelle aux minutes
        return segment.yStart + (m / 60) * segment.height;
    } else {
        // Position au début du bloc compressé
        return segment.yStart;
    }
  };

  const calculateHeight = (startStr: string, endStr: string, segments: TimeSegment[]) => {
      const y1 = getYPosition(startStr, segments);
      const y2 = getYPosition(endStr, segments);
      return Math.max(y2 - y1, 15); // Minimum 15px de hauteur
  };

  return (
    <Document>
      {weeks.map((week, idx) => (
        <Page key={idx} size="A4" orientation="landscape" style={styles.page}>
          
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.docTitle}>{title}</Text>
              <Text style={styles.subTitle}>
                {subtitle} • Semaine du {format(week.start, "d MMM", { locale: fr })} au {format(week.end, "d MMM yyyy", { locale: fr })}
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: "#6b7280" }}>Semaine {idx + 1}</Text>
          </View>

          {/* Grille Semaine */}
          <View style={[styles.weekContainer, { height: week.totalHeight + 26 }]}>
            
            {/* Colonne Axe Temps */}
            <View style={styles.timeAxisColumn}>
                {week.segments.map((seg, i) => (
                    <View key={i} style={{ height: seg.height, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", position: "relative" }}>
                        {seg.type === 'normal' ? (
                            <Text style={[styles.timeLabel, { top: -4 }]}>{seg.startHour}:00</Text>
                        ) : (
                            <Text style={styles.collapsedLabel}>{seg.startHour}h-{seg.endHour}h</Text>
                        )}
                        
                        {/* Afficher la dernière heure du dernier segment normal */}
                        {i === week.segments.length - 1 && seg.type === 'normal' && (
                             <Text style={[styles.timeLabel, { bottom: -4 }]}>{seg.endHour}:00</Text>
                        )}
                    </View>
                ))}
            </View>

            {/* Colonnes Jours */}
            {week.days.map((day, dayIdx) => (
              <View key={dayIdx} style={styles.dayColumn}>
                
                {/* Header Jour */}
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{format(day.date, "EEE", { locale: fr })}</Text>
                  <Text style={styles.dayNumber}>{format(day.date, "d")}</Text>
                </View>

                {/* Lignes de fond */}
                <View style={{ position: "absolute", top: 26, left: 0, right: 0 }}>
                    {week.segments.map((seg, i) => (
                        <View 
                            key={i} 
                            style={[
                                { height: seg.height },
                                seg.type === 'normal' ? styles.gridLine : styles.collapsedBlock
                            ]} 
                        />
                    ))}
                </View>

                {/* Blocs Événements */}
                <View style={{ position: "relative", top: 0, width: "100%", height: week.totalHeight }}>
                  {day.events.map((evt, evtIdx) => {
                    const startY = getYPosition(evt.startTime, week.segments);
                    const height = calculateHeight(evt.startTime, evt.endTime, week.segments);

                    // Logique d'affichage conditionnel selon la place dispo
                    const showTime = height >= 30;
                    const showIntercessors = height >= 45;

                    return (
                        <View 
                            key={evtIdx} 
                            style={[
                                styles.eventBox, 
                                evt.isVirtual ? styles.virtualEventBox : {},
                                { top: startY, height: height }
                            ]}
                        >
                            <Text style={styles.eventTitle}>
                                {evt.title}
                            </Text>

                            {showTime && (
                                <Text style={styles.eventTimeText}>
                                    {evt.startTime} - {evt.endTime}
                                </Text>
                            )}
                            
                            {showIntercessors && evt.intercessors && evt.intercessors.length > 0 && (
                                <View style={styles.intercessorsContainer}>
                                    {evt.intercessors.map((u: any, i: number) => (
                                        <Text key={i} style={styles.intercessorBadge}>
                                            {u.name.split(' ')[0]}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer} fixed>
            <Text>ICC Ministère de la Prière • Généré le {format(new Date(), "dd/MM/yyyy à HH:mm")}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}