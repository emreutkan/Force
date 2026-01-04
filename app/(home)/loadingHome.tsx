import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    Easing,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { checkToday, getRecoveryStatus } from '@/api/Workout';
import { useHomeLoadingStore } from '@/state/userStore';
import { RecoveryStatusResponse } from '@/api/types';

const LOADING_DURATION = 2000; // 2 seconds

export default function LoadingHome() {
    const insets = useSafeAreaInsets();
    const progress = useSharedValue(0);
    const ballY = useSharedValue(0);
    const ballScale = useSharedValue(1);
    const textOpacity = useSharedValue(0);
    const { setTodayStatus, setRecoveryStatus, setInitialLoadComplete } = useHomeLoadingStore();

    useEffect(() => {
        // Start loading data immediately
        const loadData = async () => {
            try {
                // Load today status and recovery status in parallel
                const [todayResult, recoveryResult] = await Promise.all([
                    checkToday().catch(() => null),
                    getRecoveryStatus().catch(() => null)
                ]);

                // Store the data
                if (todayResult) {
                    setTodayStatus(todayResult);
                }
                if (recoveryResult?.recovery_status) {
                    setRecoveryStatus(recoveryResult.recovery_status);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();

        // Start progress bar animation
        progress.value = withTiming(100, {
            duration: LOADING_DURATION,
            easing: Easing.linear,
        });

        // Start ball bouncing animation
        ballY.value = withRepeat(
            withSequence(
                withTiming(-60, { duration: 400, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );

        // Start ball scale animation (squash and stretch)
        ballScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 200, easing: Easing.out(Easing.quad) }),
                withTiming(0.9, { duration: 200, easing: Easing.in(Easing.quad) }),
                withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
            ),
            -1,
            false
        );

        // Fade in text
        textOpacity.value = withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.ease),
        });

        // Navigate to home after loading completes
        const timer = setTimeout(() => {
            setInitialLoadComplete(true);
            router.replace('/(home)');
        }, LOADING_DURATION);

        return () => clearTimeout(timer);
    }, []);

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const ballStyle = useAnimatedStyle(() => {
        const rotation = interpolate(
            ballY.value,
            [-60, 0],
            [0, 360],
            Extrapolation.CLAMP
        );
        
        return {
            transform: [
                { translateY: ballY.value },
                { scale: ballScale.value },
                { rotate: `${rotation}deg` },
            ],
        };
    });

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, progressBarStyle]} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Bouncing Ball */}
                <View style={styles.ballContainer}>
                    <Animated.View style={[styles.ball, ballStyle]} />
                </View>

                {/* Text */}
                <Animated.Text style={[styles.text, textStyle]}>
                    utrack
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    progressBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#1C1C1E',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0A84FF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ballContainer: {
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 40,
    },
    ball: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0A84FF',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    text: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
});

