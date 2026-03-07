import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WorkoutsHeader() {
  return (
    <View style={styles.header}>
      <Text style={[typographyStyles.h2, { flex: 1 }]}>RECORDS</Text>
      <Pressable
        onPress={() => router.push('/(personal-records)')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.trophyButton}
      >
        <Ionicons name="trophy-outline" size={22} color={theme.colors.status.warning} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  trophyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
