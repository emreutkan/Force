import { theme, typographyStyles } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function WorkoutsHeader() {
  return (
    <View style={styles.header}>
      <Text style={[typographyStyles.h2, { flex: 1 }]}>RECORDS</Text>
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
});
