import React from 'react';
import { StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useAnimatedStyle, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface SwipeActionProps {
    progress: SharedValue<number>;
    dragX?: SharedValue<number>;
    onPress: () => void;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
    iconSize?: number;
}

export const SwipeAction = ({ 
    progress, 
    onPress, 
    iconName, 
    color = theme.colors.text.primary, 
    backgroundColor = theme.colors.ui.glass,
    style,
    iconSize = 22
}: SwipeActionProps) => {
    
    const animatedIconStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            progress.value,
            [0, 1],
            [0.5, 1.1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            progress.value,
            [0, 0.5, 1],
            [0, 0, 1],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale: withSpring(scale) }],
            opacity
        };
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Pressable 
            onPress={handlePress}
            style={({ pressed }) => [
                styles.container, 
                { backgroundColor },
                style,
                pressed && styles.pressed
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
        >
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.lg,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
});

