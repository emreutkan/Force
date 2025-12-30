# How to Use Storybook

## Quick Start

### 1. Access Storybook in Your App

Storybook is accessible via a route in your app. Navigate to:
- **URL**: `/(storybook)` or use Expo Router to navigate programmatically
- **From code**: `router.push('/(storybook)')`

### 2. Running the App with Storybook

1. Start your Expo dev server:
   ```bash
   npm start
   ```

2. Open the app on your device/emulator

3. Navigate to the Storybook route (you can add a button in your app or use deep linking)

### 3. Creating Stories

Create story files next to your components with the `.stories.tsx` extension:

**Example: `components/Button.stories.tsx`**
```tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#000000', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Click Me',
    onPress: () => console.log('Pressed'),
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
  },
};
```

### 4. Registering Stories

After creating a story file, add it to `storybook/index.ts`:

```tsx
require('../components/Button.stories');
require('../components/YourComponent.stories');
```

### 5. Auto-generate Stories (Optional)

You can use the storybook-generate command to automatically discover and generate stories:

```bash
npm run storybook-generate
```

This will scan your components and create story files automatically.

## Storybook Features

### Available Addons

- **Controls**: Interactive controls to modify component props in real-time
- **Actions**: Log actions/events (like button presses)
- **Backgrounds**: Change background colors to test different themes
- **Notes**: Add documentation and notes to your stories

### Using Controls

In your story file, define argTypes to create controls:

```tsx
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    title: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};
```

### Using Actions

Actions automatically log when callbacks are triggered:

```tsx
export const WithAction: Story = {
  args: {
    onPress: () => {
      // This will be logged in the Actions panel
      console.log('Button pressed');
    },
  },
};
```

## Tips

1. **Bypass Auth**: The Storybook route is inside AuthCheck, so you might want to add a way to access it without authentication, or create a dev-only route.

2. **Organize Stories**: Use the `title` field to organize stories hierarchically:
   - `'Components/Button'` → Components > Button
   - `'Screens/Home'` → Screens > Home

3. **Decorators**: Use decorators to wrap all stories with common providers or styling.

4. **Multiple Variants**: Create multiple story exports to show different states of your component.

## Troubleshooting

- **Stories not showing**: Make sure you've added the story import to `storybook/index.ts`
- **Metro bundler errors**: Clear cache with `npx expo start -c`
- **Component not rendering**: Check that all dependencies are properly imported



