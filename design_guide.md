# Design Guide - 8pt Grid System

## The 8pt Grid: Core Principle

**CRITICAL**: All padding and margin values MUST use multiples of 8 (8, 16, 24, 32, 40, 48, 56, 64, etc.). This creates visual rhythm and consistency that professional apps have.

### ✅ Allowed Values (Multiples of 8)
- `8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128...`

### ❌ Never Use (Non-multiples of 8)
- `2, 4, 6, 10, 12, 14, 18, 20, 22, 26, 28, 30, 34, 36, 38, 42, 44, 46, 50, 52, 54, 58, 60, 62, 66, 68, 70...`

## Common Value Mappings

When you encounter non-8pt values, round them to the nearest multiple of 8:

| Current Value | → | 8pt Grid Value |
|--------------|---|----------------|
| `2, 4, 6` | → | `8` |
| `10, 12, 14` | → | `16` |
| `18, 20, 22` | → | `24` |
| `26, 28, 30` | → | `32` |
| `34, 36, 38` | → | `40` |
| `42, 44, 46` | → | `48` |
| `50, 52, 54` | → | `56` |
| `58, 60, 62` | → | `64` |

## What This Applies To

### ✅ Must Use 8pt Grid:
- `padding` (all variants: padding, paddingTop, paddingBottom, paddingLeft, paddingRight, paddingHorizontal, paddingVertical)
- `margin` (all variants: margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical)
- `gap` (flexbox gap property)
- `minHeight`, `minWidth` (when used for spacing)
- `height`, `width` (when used for spacing/layout, not content-specific)

### ❌ Exempt from 8pt Grid:
- `borderWidth` (typically 1px or 2px)
- `fontSize` (typography sizes)
- `lineHeight` (typography)
- `borderRadius` (can use any value, but prefer 8pt multiples when possible)
- `letterSpacing` (typography)
- Content-specific dimensions (e.g., icon sizes, image dimensions)

## Examples

### ✅ Correct (8pt Grid)
```tsx
const styles = StyleSheet.create({
    container: {
        padding: 16,        // ✅ Multiple of 8
        marginBottom: 24,  // ✅ Multiple of 8
        gap: 8,            // ✅ Multiple of 8
    },
    card: {
        paddingHorizontal: 16,  // ✅ Multiple of 8
        paddingVertical: 24,    // ✅ Multiple of 8
        marginTop: 32,          // ✅ Multiple of 8
    },
});
```

### ❌ Incorrect (Not 8pt Grid)
```tsx
const styles = StyleSheet.create({
    container: {
        padding: 12,        // ❌ Not a multiple of 8
        marginBottom: 20,   // ❌ Not a multiple of 8
        gap: 6,            // ❌ Not a multiple of 8
    },
    card: {
        paddingHorizontal: 10,  // ❌ Not a multiple of 8
        paddingVertical: 14,   // ❌ Not a multiple of 8
        marginTop: 22,        // ❌ Not a multiple of 8
    },
});
```

## Why 8pt Grid?

1. **Visual Rhythm**: Creates consistent spacing that feels natural and organized
2. **Scalability**: Works across different screen sizes and densities
3. **Professional Look**: Industry standard used by major design systems (Material Design, iOS HIG)
4. **Developer Efficiency**: Easier to remember and apply consistent values
5. **Maintainability**: Easier to refactor and maintain consistent spacing

## Implementation Checklist

When creating or updating styles:

- [ ] All `padding` values are multiples of 8
- [ ] All `margin` values are multiples of 8
- [ ] All `gap` values are multiples of 8
- [ ] Spacing-related `minHeight`/`minWidth` are multiples of 8
- [ ] Border widths and font sizes are exempt (as appropriate)

## Quick Reference

**Most Common Values:**
- `8` - Small spacing (between related elements)
- `16` - Standard spacing (default padding, margins)
- `24` - Medium spacing (section spacing)
- `32` - Large spacing (major section breaks)
- `40` - Extra large spacing
- `48` - Very large spacing

---

# Typography Scale

**CRITICAL**: Never use random font sizes. Use a strict typography scale for consistency.

## Typography Scale

| Type | Size | Weight | Use Case |
|------|------|--------|----------|
| **Title** | `34px` | Bold (700) | Screen titles, major headings |
| **Headline** | `24px` | Bold (700) | Section headers, card titles |
| **Sub-head** | `18px` | Medium (500) | Subsection headers |
| **Body** | `17px` | Regular (400) | Main content text, default text |
| **Body (Alt)** | `16px` | Regular (400) | Alternative body text |
| **Caption** | `13px` | Light (300) | Secondary text, labels, hints |
| **Caption (Alt)** | `12px` | Light (300) | Small labels, metadata |

### ✅ Correct Typography Usage
```tsx
const styles = StyleSheet.create({
    title: {
        fontSize: 34,      // ✅ Title
        fontWeight: '700',
    },
    headline: {
        fontSize: 24,     // ✅ Headline
        fontWeight: '700',
    },
    subhead: {
        fontSize: 18,    // ✅ Sub-head
        fontWeight: '500',
    },
    body: {
        fontSize: 17,    // ✅ Body (iOS standard)
        fontWeight: '400',
    },
    caption: {
        fontSize: 13,    // ✅ Caption
        fontWeight: '300',
    },
});
```

### ❌ Incorrect Typography Usage
```tsx
const styles = StyleSheet.create({
    text: {
        fontSize: 20,    // ❌ Not in scale - use 18 or 24
        fontWeight: '600',
    },
    heading: {
        fontSize: 22,    // ❌ Not in scale - use 24
        fontWeight: '700',
    },
});
```

---

# Border Radius (Corners)

**Standard**: Use `borderRadius: 22` for cards and major UI elements.

## Border Radius Guidelines

- **Cards & Major Elements**: `22px` (standard)
- **Small Elements**: `8px` or `12px` (buttons, tags)
- **Large Containers**: `24px` or `32px` (modals, sheets)

### ✅ Correct Border Radius
```tsx
const styles = StyleSheet.create({
    card: {
        borderRadius: 22,  // ✅ Standard for cards
    },
    button: {
        borderRadius: 12,  // ✅ For buttons
    },
    tag: {
        borderRadius: 8,   // ✅ For small elements
    },
});
```

---

# Shadows

**CRITICAL**: Shadows should be almost invisible. Professional designers use very subtle shadows.

## Shadow Guidelines

- **Opacity**: `0.04` to `0.1` (never higher)
- **Shadow Radius**: Large (typically `16px` to `24px`)
- **Shadow Color**: Black with low opacity
- **Shadow Offset**: Small (`{ width: 0, height: 2 }` or `{ width: 0, height: 4 }`)

### ✅ Correct Shadows (Almost Invisible)
```tsx
const styles = StyleSheet.create({
    card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,      // ✅ Very subtle
        shadowRadius: 16,         // ✅ Large radius
        elevation: 2,            // Android
    },
    elevated: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,     // ✅ Still subtle
        shadowRadius: 24,         // ✅ Large radius
        elevation: 4,            // Android
    },
});
```

### ❌ Incorrect Shadows (Too Heavy)
```tsx
const styles = StyleSheet.create({
    card: {
        shadowOpacity: 0.3,      // ❌ Too visible
        shadowRadius: 4,         // ❌ Too small
        shadowColor: '#000000',
    },
});
```

---

# Materials (Glass Effect)

Use `expo-blur` for translucent, glass-like effects on headers and cards.

## Material Guidelines

- **Headers**: Use blur for translucent navigation bars
- **Cards**: Use blur for floating card effects
- **Modals**: Use blur for backdrop effects

### ✅ Correct Material Usage
```tsx
import { BlurView } from 'expo-blur';

// Translucent header
<BlurView intensity={80} style={styles.header}>
    <Text>Header Content</Text>
</BlurView>

// Glass card
<BlurView intensity={60} style={styles.card}>
    <Text>Card Content</Text>
</BlurView>
```

---

# Spacing Standards

## Standard Spacing Values

- **Standard**: `16px` - Default spacing for most elements
- **Spacious/Premium**: `24px` - For premium feel, major sections

### Spacing Guidelines

| Context | Value | Use Case |
|---------|-------|----------|
| Standard | `16px` | Default padding, margins between elements |
| Spacious | `24px` | Premium spacing, major section breaks |
| Compact | `8px` | Tight spacing, related elements |
| Large | `32px` | Major section separators |

### ✅ Correct Spacing
```tsx
const styles = StyleSheet.create({
    container: {
        padding: 16,        // ✅ Standard
        marginBottom: 24,   // ✅ Spacious
    },
    section: {
        marginTop: 24,      // ✅ Premium spacing
        padding: 16,         // ✅ Standard padding
    },
});
```

