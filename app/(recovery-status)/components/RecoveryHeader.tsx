import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export default function RecoveryHeader() {
  return (
    <View style={styles.header}>
      <Pressable 
        onPress={() => router.back()} 
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
      </Pressable>
      <View style={styles.titleContainer}>
        <Text style={typographyStyles.h2}>RECOVERY</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BETA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ scale: 0.96 }],
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    ...typographyStyles.label,
    fontSize: 8,
    color: theme.colors.status.active,
    letterSpacing: 1,
  },
});
