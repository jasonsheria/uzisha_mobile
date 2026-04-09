import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 64) / 7; // Calcul précis pour l'alignement

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Ajustement pour commencer par Lundi
};

export default function CalendarScreen() {
  const isDark = useColorScheme() === 'dark';
  const { setCalendarAvailability } = useAdmin();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<{ date: string; isAvailable: boolean }[]>([]);
  const [indispoMessage, setIndispoMessage] = useState('');
  const { user } = useAuth();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });

  // Couleurs dynamiques
  const Colors = {
    primary: '#06B6D4',
    success: '#10B981',
    danger: '#EF4444',
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#64748B',
  };

  const handleToggleDay = async (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = calendar.find(c => c.date === dateStr);
    
    let newCalendar = [...calendar];

    if (existing) {
      // Si existe déjà (indisponible), on le rend disponible (suppression)
      newCalendar = newCalendar.filter(c => c.date !== dateStr);
      setIndispoMessage(`Journée du ${day} ${monthName} marquée comme disponible.`);
      if (user?.id) {
        await supabase.from('admin_availability').delete().eq('admin_id', user.id).eq('date', dateStr);
      }
    } else {
      // On ajoute une indisponibilité
      newCalendar.push({ date: dateStr, isAvailable: false });
      setCalendarAvailability(dateStr, false);
      setIndispoMessage(`Journée du ${day} ${monthName} marquée comme indisponible.`);
    }
    setCalendar(newCalendar);
    
    // Auto-hide message
    setTimeout(() => setIndispoMessage(''), 3000);
  };

  const isDateAvailable = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return !calendar.find(c => c.date === dateStr);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  useEffect(() => {
    async function fetchIndispo() {
      if (!user?.id) return;
      const { data } = await supabase.from('admin_availability').select('date, is_available').eq('admin_id', user.id);
      if (data) setCalendar(data.map(item => ({ date: item.date, isAvailable: item.is_available })));
    }
    fetchIndispo();
  }, [user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Header avec Navigation */}
        <View style={[styles.headerCard, { backgroundColor: Colors.card }]}>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1))} style={styles.navCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.monthLabel, { color: Colors.text }]}>{monthName}</Text>
            <Text style={[styles.yearLabel, { color: Colors.primary }]}>{year}</Text>
          </View>

          <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1))} style={styles.navCircle}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Grille Calendrier */}
        <View style={[styles.calendarCard, { backgroundColor: Colors.card }]}>
          <View style={styles.weekHeader}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <Text key={d} style={[styles.weekDayText, { color: Colors.subtext }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day ? (
                  <TouchableOpacity
                    onPress={() => handleToggleDay(day)}
                    style={[
                      styles.dayButton,
                      { backgroundColor: isDateAvailable(day) ? Colors.success : Colors.danger }
                    ]}
                  >
                    <Text style={styles.dayText}>{day}</Text>
                    <MaterialCommunityIcons 
                      name={isDateAvailable(day) ? "check" : "close"} 
                      size={10} 
                      color="#FFF" 
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Légende Interactive */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.legendLabel, { color: Colors.text }]}>Libre</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
            <Text style={[styles.legendLabel, { color: Colors.text }]}>Indisponible</Text>
          </View>
        </View>

        {/* Notification Toast Intégrée */}
        {indispoMessage !== '' && (
          <View style={[styles.toast, { backgroundColor: Colors.primary }]}>
            <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#FFF" />
            <Text style={styles.toastText}>{indispoMessage}</Text>
          </View>
        )}

        {/* Conseil */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#EEF2FF' }]}>
          <MaterialCommunityIcons name="lightbulb-on" size={22} color={Colors.primary} />
          <Text style={[styles.infoText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
            Appuyez sur une date pour basculer sa visibilité auprès de vos clients.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 }
    }),
  },
  navCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: { fontSize: 22, fontWeight: '800', textTransform: 'capitalize' },
  yearLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  calendarCard: {
    padding: 10,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 2 }
    }),
  },
  weekHeader: { flexDirection: 'row', marginBottom: 10 },
  weekDayText: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 13 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayButton: {
    width: '85%',
    height: '85%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  dayText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontWeight: '700', fontSize: 14 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 10,
  },
  toastText: { color: '#FFF', fontWeight: '700', flex: 1 },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});