import StorybookUIRoot from '../../storybook';
import { View, StyleSheet } from 'react-native';

export default function StorybookScreen() {
  return (
    <View style={styles.container}>
      <StorybookUIRoot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});



