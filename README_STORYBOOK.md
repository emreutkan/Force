# Storybook Setup

This project is configured with Storybook for React Native to help you develop and test components in isolation.

## Running Storybook

To run Storybook, you have a few options:

### Option 1: Use Storybook Entry Point
1. Temporarily change the `main` field in `package.json` from `"expo-router/entry"` to `"storybook-entry.js"`
2. Run `npm start` or `expo start`
3. Open the app - you'll see Storybook UI instead of your app

### Option 2: Create a Storybook Route
Add a route in your app to access Storybook:
- Create `app/(storybook)/index.tsx` that imports and renders Storybook

## Creating Stories

Create story files next to your components with the `.stories.tsx` extension:

```tsx
// components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import MyComponent from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

## Adding Stories

After creating a new story file, add it to `storybook/index.ts`:

```tsx
require('../components/MyComponent.stories');
```

## Metro Configuration

The Metro bundler is configured to recognize `.stories.tsx`, `.stories.ts`, `.stories.jsx`, and `.stories.js` file extensions.

## Available Addons

- **Controls**: Interactive controls for component props
- **Actions**: Log actions/events
- **Backgrounds**: Change background colors
- **Notes**: Add documentation notes



