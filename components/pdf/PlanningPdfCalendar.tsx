/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";

// --- CONFIGURATION ---
const NORMAL_HOUR_HEIGHT = 40; // Hauteur d'une heure "active" (visible)
const COLLAPSED_HEIGHT = 15;   // Hauteur d'un bloc d'heures vides
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
  
  // Grille
  weekContainer: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  
  // Axe Temps
  timeAxisColumn: {
    width: 35,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 26, 
    backgroundColor: "#f9fafb",
  },
  timeLabel: {
    position: "absolute",
    right: 6,
    fontSize: 7,
    color: "#9ca3af",
    transform: "translateY(-4)", // Centrer sur la ligne
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
  dayName: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" },
  dayNumber: { fontSize: 10, color: "#1f2937", fontWeight: "bold" },

  // Grille de fond
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderStyle: "solid",
  },
  collapsedBlock: {
    backgroundColor: "#fcfcfc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderStyle: "dashed",
  },

  // Événements
  eventBox: {
    position: "absolute",
    left: 2,
    right: 2,
    backgroundColor: "#eef2ff",
    borderRadius: 3,
    padding: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
    overflow: "hidden",
  },
  virtualEventBox: {
    backgroundColor: "#fafafa", 
    borderLeftColor: "#9ca3af",
    borderLeftWidth: 2,
    borderStyle: "dashed",
    opacity: 0.9,
  },
  eventTimeText: { fontSize: 6, color: "#4338ca", fontWeight: "bold", marginBottom: 1 },
  eventTitle: { fontSize: 7, color: "#1e1b4b", fontWeight: "bold", marginBottom: 1 },
  intercessorsText: { fontSize: 5, color: "#4b5563" },

  footer: {
    marginTop: "auto",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface PdfProps {
  title: string;
  subtitle: string;
  events: any[];
  startDate: Date;
  endDate: Date;
}

type TimeSegment = {
  startHour: number;
  endHour: number;
  type: 'normal' | 'collapsed';
  height: number;
  yStart: number; // Position Y accumulée depuis le haut
};

export function PlanningPdfCalendar({ title, subtitle, events, startDate, endDate }: PdfProps) {
  
  const weeks = [];
  let currentStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  while (currentStart <= endDate || weeks.length === 0) {
    const currentEnd = endOfWeek(currentStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: currentStart, end: currentEnd });
    
    // Filtrer les événements de la semaine
    const weekEvents = events.filter(e => 
      new Date(e.startTime) >= currentStart && new Date(e.endTime) <= currentEnd
    );

    // --- 1. CALCUL DES HEURES OCCUPÉES ---
    // On crée un tableau de 24 booléens (true = occupé)
    const activeHours = new Array(24).fill(false);

    weekEvents.forEach(evt => {
        const start = new Date(evt.startTime);
        const end = new Date(evt.endTime);
        
        let startH = start.getHours();
        let endH = end.getHours();
        if (end.getMinutes() > 0) endH++; // Si ça finit à 10h30, on inclut l'heure 10

        // On marque les heures occupées
        for (let h = startH; h < endH; h++) {
            if (h >= 0 && h < 24) activeHours[h] = true;
        }
    });

    // Optionnel : Ajouter un "padding" (si 10h est occupé, afficher 9h et 11h aussi pour aérer ?)
    // Pour l'instant, on reste strict sur la demande : "keep only plage that contains program"

    // --- 2. CONSTRUCTION DES SEGMENTS ---
    const segments: TimeSegment[] = [];
    let currentY = 0;
    let h = 0;

    while (h < 24) {
        if (activeHours[h]) {
            // C'est une heure active -> Segment Normal
            // On regroupe les heures actives consécutives pour simplifier la grille ?
            // Non, on crée un segment par heure pour avoir les lignes de grille
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
            // C'est une heure vide -> Segment Collapsed
            // On cherche la fin du bloc vide
            let endEmpty = h + 1;
            while (endEmpty < 24 && !activeHours[endEmpty]) {
                endEmpty++;
            }
            
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
        events: events.filter(e => isSameDay(new Date(e.startTime), day))
      }))
    });

    if (currentStart > endDate) break;
    currentStart = addWeeks(currentStart, 1);
  }

  // --- 3. FONCTION DE POSITIONNEMENT (Projection Temps -> Pixels) ---
  const getYPosition = (date: Date, segments: TimeSegment[]) => {
    const h = date.getHours();
    const m = date.getMinutes();

    // Trouver le segment qui contient cette heure
    const segment = segments.find(s => h >= s.startHour && h < s.endHour);
    
    if (!segment) return 0; // Sécurité

    if (segment.type === 'normal') {
        // Dans une heure normale (hauteur 40), on place proportionnellement aux minutes
        // Note: Si le segment fait plusieurs heures (ex: aggrégation), il faudrait ajuster
        // Ici on a fait des segments de 1h pour les normaux, donc c'est simple :
        return segment.yStart + (m / 60) * segment.height;
    } else {
        // Dans un segment compressé, on place au début (ou milieu)
        // Les événements ne devraient pas être ici théoriquement
        return segment.yStart;
    }
  };

  return (
    <Document>
      {weeks.map((week, idx) => (
        <Page key={idx} size="A4" orientation="landscape" style={styles.page}>
          
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.docTitle}>{title}</Text>
              <Text style={styles.subTitle}>
                {subtitle} • Semaine du {format(week.start, "d MMM", { locale: fr })} au {format(week.end, "d MMM yyyy", { locale: fr })}
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: "#6b7280" }}>Semaine {idx + 1}/{weeks.length}</Text>
          </View>

          <View style={[styles.weekContainer, { height: week.totalHeight + 26 }]}>
            
            {/* Axe des Heures */}
            <View style={styles.timeAxisColumn}>
                {week.segments.map((seg, i) => (
                    <View key={i} style={{ height: seg.height, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", position: "relative" }}>
                        {seg.type === 'normal' ? (
                            // Label en haut de la ligne
                            <Text style={[styles.timeLabel, { top: -4 }]}>{seg.startHour}:00</Text>
                        ) : (
                            <Text style={styles.collapsedLabel}>{seg.startHour}h - {seg.endHour}h</Text>
                        )}
                        
                        {/* Afficher l'heure de fin du dernier segment normal si c'est la fin de journée */}
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

                {/* Fond de grille */}
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

                {/* Événements */}
                <View style={{ position: "relative", top: 0, width: "100%", height: week.totalHeight }}>
                  {day.events.map((evt, evtIdx) => {
                    const startY = getYPosition(new Date(evt.startTime), week.segments);
                    const endY = getYPosition(new Date(evt.endTime), week.segments);
                    const height = Math.max(endY - startY, 15); // Min 15px pour visibilité

                    return (
                        <View 
                            key={evtIdx} 
                            style={[
                                styles.eventBox, 
                                evt.isVirtual ? styles.virtualEventBox : {},
                                { top: startY, height: height }
                            ]}
                        >
                            <Text style={styles.eventTimeText}>
                                {format(new Date(evt.startTime), "HH:mm")} - {format(new Date(evt.endTime), "HH:mm")}
                            </Text>
                            <Text style={styles.eventTitle}>
                                {evt.title}
                            </Text>
                            {evt.intercessors && evt.intercessors.length > 0 && (
                                <Text style={styles.intercessorsText}>
                                    {evt.intercessors.map((u: any) => u.name.split(' ')[0]).join(', ')}
                                </Text>
                            )}
                        </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer} fixed>
            <Text>ICC Ministère de la Prière • {format(new Date(), "dd/MM/yyyy")}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}