# iOS Design System & Styling Guide (React Native)

This guide outlines the colors, typography, and layout patterns used to achieve a native iOS "Grouped Table View" look in our application.

## 0. The 8pt Grid System

**CRITICAL**: All padding and margin values MUST use multiples of 8 (8, 16, 24, 32, 40, 48, etc.). This creates visual rhythm and consistency.

- ✅ Use: `8, 16, 24, 32, 40, 48, 56, 64`
- ❌ Never use: `2, 4, 6, 10, 12, 14, 18, 20, 22, 26, 28, 30, 34, 36, 38, 42, 44, 46, 50, 52, 54, 58, 60, 62, 66, 68, 70`

**Common mappings:**
- `2, 4, 6` → `8`
- `10, 12, 14` → `16`
- `18, 20, 22` → `24`
- `26, 28, 30` → `32`
- `34, 36, 38` → `40`
- `42, 44, 46` → `48`
- `50, 52, 54` → `56`
- `58, 60, 62` → `64`

**Note:** Border widths (1px, 2px) and font sizes are exempt from this rule.

## 1. Colors (System Palette)

Use these hex codes to match iOS system colors.

### Backgrounds
- **Main Background (Grouped):** `#F2F2F7` (Light gray, used for the screen background behind lists)
- **Content Background (Cards/Cells):** `#FFFFFF` (White, used for list items and cards)
- **Dark Background (Cards):** `#1C1C1E` (System Gray 6 Dark, used for cards in dark mode or high contrast areas)

### Text
- **Primary Text:** `#000000` (Black)
- **Secondary Text (Subtitles/Details):** `#8E8E93` (System Gray)
- **Section Headers:** `#8E8E93` (Uppercase, small labels above lists)
- **Links/Actions:** `#007AFF` (System Blue)
- **Destructive/Error:** `#FF3B30` (System Red)

### Separators
- **Border/Divider:** `#C6C6C8` or `#3C3C43` (with low opacity)
- **Hairline:** Use `StyleSheet.hairlineWidth` for 1px pixel-perfect lines.

## 2. Typography

### Headers
- **Large Title (Screen Title):**
  - Size: `34` (or `32`)
  - Weight: `bold` (700)
  - Alignment: Left
  - Color: `#000000`

### Section Headers (Grouped Lists)
- **Section Title:**
  - Size: `13`
  - Weight: `600` (Semi-bold)
  - Color: `#8E8E93`
  - Transform: `uppercase`
  - Margin: Left `16px`, Bottom `8px`

### Body
- **Body Text:**
  - Size: `17` (Standard iOS body size)
  - Weight: `400` (Regular)
  - Color: `#000000`

## 3. Layout Patterns

### Grouped List (Settings Menu Style)
To create a settings menu or list:
1. **Container:** `backgroundColor: '#F2F2F7'`, `flex: 1`
2. **List Group:**
   - `backgroundColor: '#FFFFFF'`
   - `borderRadius: 12` (or `10`)
   - `marginBottom: 24` (8pt grid)
   - `overflow: 'hidden'`
3. **List Item (Row):**
   - `flexDirection: 'row'`
   - `alignItems: 'center'`
   - `padding: 16`
   - `backgroundColor: '#FFFFFF'`
   - **Separator:** Add a `borderBottomWidth: StyleSheet.hairlineWidth` to all items *except the last one*.

### Icons
- Use **Ionicons** (part of `@expo/vector-icons`).
- Size: `20` - `24` for list icons.
- Chevron: Use `chevron-forward` (size `20`, color `#C7C7CC`) for navigation arrows on the right.

## 4. Example Component Structure

```tsx
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F2F2F7', // 1. Background
    },
    section: {
        backgroundColor: '#FFFFFF', // 2. Card Background
        borderRadius: 12,
        marginHorizontal: 16, // Inset from edges
        marginTop: 24, // 8pt grid
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginLeft: 32, // Align with content + inset
        marginBottom: 8,
        marginTop: 24, // 8pt grid
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    rowText: {
        fontSize: 17,
        color: '#000',
    }
});
```

## 5. Safe Area
Always wrap your screen content or apply padding using `useSafeAreaInsets()` from `react-native-safe-area-context` to respect the notch and home indicator.

```tsx
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top }}> ... </View>
```

