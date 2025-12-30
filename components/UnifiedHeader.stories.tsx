import type { Meta, StoryObj } from '@storybook/react-native';
import UnifiedHeader from './UnifiedHeader';
import { View } from 'react-native';

const meta: Meta<typeof UnifiedHeader> = {
  title: 'Components/UnifiedHeader',
  component: UnifiedHeader,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof UnifiedHeader>;

export const Default: Story = {
  args: {
    title: 'Example Screen',
    showBackButton: true,
  },
};

export const WithRightButton: Story = {
  args: {
    title: 'Settings',
    showBackButton: true,
    rightButton: {
      icon: 'add',
      onPress: () => console.log('Right button pressed'),
    },
  },
};

export const NoBackButton: Story = {
  args: {
    title: 'Home',
    showBackButton: false,
  },
};



