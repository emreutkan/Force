import { CalendarDay } from '@/api/types/index';
import { getCalendar } from '@/api/Workout';
import { theme, typographyStyles } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { useDateStore } from '@/state/userStore';
import { useSetSelectedDate } from '@/hooks/useWorkout';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { CalendarStripSkeleton } from './homeLoadingSkeleton';

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

interface CalendarStripProps {
  onPress: () => void;
}

export default function CalendarStrip({ onPress }: CalendarStripProps) {
  const today = useDateStore((state) => state.today);
  const setSelectedDate = useSetSelectedDate();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const result = await getCalendar(now.getFullYear(), undefined, currentWeek);

      if (result?.calendar) {
        setCalendarData(result.calendar);
      }
    } catch (error) {
      logger.error('Error fetching calendar', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [fetchCalendarData])
  );

  const startOfWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Start on Monday
    return d;
  }, [today]);

  const calendarMap = useMemo(() => {
    const map: Record<string, CalendarDay> = {};
    for (const day of calendarData) {
      map[day.date] = day;
    }
    return map;
  }, [calendarData]);

  const currentMonth = MONTH_NAMES[today.getMonth()];
  const weekNumber = Math.ceil(
    (today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7
  );

  if (loading) {
    return <CalendarStripSkeleton />;
  }

  return (
    <View style={styles.calendarStrip}>
      <Pressable 
        style={({ pressed }) => [
          styles.calendarHeader,
          pressed && { opacity: 0.7 }
        ]} 
        onPress={onPress}
      >
        <Text style={typographyStyles.labelMuted}>OVERVIEW</Text>
        <Text style={styles.calendarWeek}>
          {currentMonth}, WEEK {weekNumber.toString().padStart(2, '0')}
        </Text>
      </Pressable>

      <View style={styles.calendarRow}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + i);
          const isSelected = d.toDateString() === today.toDateString();
          const isCalendarToday = d.toDateString() === new Date().toDateString();
          const dateStr = d.toISOString().split('T')[0];
          const dayData = calendarMap[dateStr];
          const hasActivity = dayData?.has_workout || dayData?.is_rest_day;

          return (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && styles.dayCellActive,
                isCalendarToday && !isSelected && styles.dayCellToday,
                pressed && styles.dayCellPressed,
              ]}
              onPress={() => setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)}
              </Text>
              <Text style={[styles.dayDate, isSelected && styles.dayDateActive]}>
                {d.getDate().toString().padStart(2, '0')}
              </Text>
              <View style={styles.dayDotContainer}>
                {hasActivity && (
                  <View
                    style={[
                      styles.dayDot,
                      isSelected
                        ? styles.dayDotActive
                        : dayData?.has_workout
                        ? styles.dayDotWorkout
                        : styles.dayDotRest,
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarStrip: {
    marginVertical: theme.spacing.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: 2,
  },
  calendarWeek: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    color: theme.colors.status.active,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellActive: {
    backgroundColor: theme.colors.status.active,
    borderColor: theme.colors.ui.primaryBorder,
  },
  dayCellToday: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayCellPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
  dayName: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayNameActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayDate: {
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.secondary,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dayDateActive: {
    color: theme.colors.text.primary,
  },
  dayDotContainer: {
    marginTop: 6,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayDotActive: {
    backgroundColor: theme.colors.text.primary,
  },
  dayDotWorkout: {
    backgroundColor: theme.colors.status.active,
  },
  dayDotRest: {
    backgroundColor: theme.colors.status.rest,
  },
});
