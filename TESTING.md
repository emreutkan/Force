# Testing Guide

This project uses Jest and React Native Testing Library for testing.

## Setup

Tests are configured with:
- **Jest** - Test runner
- **@testing-library/react-native** - React Native component testing
- **jest-expo** - Expo-specific Jest preset

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located in:
- `__tests__/` - Root level tests
- `components/__tests__/` - Component tests
- `api/__tests__/` - API function tests
- `state/__tests__/` - State management tests

## Writing Tests

### Component Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });
});
```

### API Tests

```typescript
import { myApiFunction } from '../api';
import apiClient from '../APIClient';

jest.mock('../APIClient');

describe('myApiFunction', () => {
  it('should make API call', async () => {
    const mockResponse = { data: { result: 'success' } };
    apiClient.get.mockResolvedValue(mockResponse);
    
    const result = await myApiFunction();
    expect(result).toEqual(mockResponse.data);
  });
});
```

### State Management Tests

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '../myStore';

describe('useMyStore', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.updateValue('test');
    });
    
    expect(result.current.value).toBe('test');
  });
});
```

## Known Issues

### Expo Winter Runtime

If you encounter errors like "You are trying to `import` a file outside of the scope of the test code", this is a known issue with Expo SDK 54's winter runtime. 

**Workaround**: For now, focus on testing:
1. Pure functions (helpers, utilities)
2. API functions (with mocked dependencies)
3. State management (Zustand stores)

Component tests may require additional mocking of Expo modules.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component/function does, not how
2. **Mock external dependencies** - Mock API calls, native modules, and third-party libraries
3. **Keep tests simple** - Each test should verify one thing
4. **Use descriptive test names** - Test names should clearly describe what they're testing
5. **Test edge cases** - Don't just test the happy path

## Coverage Goals

Aim for:
- **80%+ coverage** on critical paths (API, state management)
- **60%+ coverage** on components
- **100% coverage** on utility/helper functions
