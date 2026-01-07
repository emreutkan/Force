import { MuscleRecovery } from '@/api/types';
import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface MuscleRecoverySectionProps {
    recoveryStatus: Record<string, MuscleRecovery>;
    onPress?: () => void;
}

// Waveform icon component
const WaveformIcon = ({ color = theme.colors.text.primary }: { color?: string }) => (
    <Svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        <Path
            d="M2 8L4 4L6 10L8 2L10 8L12 6L14 10L16 4L18 8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const MuscleRecoveryCard = ({ 
    muscle, 
    status 
}: { 
    muscle: string; 
    status: MuscleRecovery;
}) => {
    const pct = Number(status.recovery_percentage);
    const hoursLeft = Number(status.hours_until_recovery);
    const isReady = status.is_recovered || pct >= 90;
    
    // Determine colors based on recovery percentage
    // Purple for most cases, green for low recovery, pink for very high
    let iconBgColor: string;
    let percentageColor: string;
    
    if (pct >= 95) {
        iconBgColor = theme.colors.status.rest; // Purple icon
        percentageColor = '#FF10F0'; // Pink/Magenta percentage
    } else if (pct >= 50) {
        iconBgColor = theme.colors.status.rest; // Purple
        percentageColor = theme.colors.status.rest; // Purple
    } else {
        iconBgColor = theme.colors.status.success; // Green
        percentageColor = theme.colors.status.success; // Green
    }

    const timeText = isReady ? 'Ready' : `${Math.round(hoursLeft)}H TO 100%`;
    const displayName = muscle.replace(/_/g, ' ').split(' ').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');

    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                        <WaveformIcon color={theme.colors.text.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.muscleName}>{displayName}</Text>
                        <Text style={styles.timeText}>{timeText}</Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={[styles.percentageText, { color: percentageColor }]}>
                        {pct.toFixed(0)}%
                    </Text>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { 
                                    width: `${pct}%`,
                                    backgroundColor: '#60A5FA' // Light blue
                                }
                            ]} 
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function MuscleRecoverySection({ 
    recoveryStatus, 
    onPress 
}: MuscleRecoverySectionProps) {
    // Get top 3 recovering muscles, sorted by hours until recovery
    // Show muscles that are not fully recovered (recovery_percentage < 100)
    const recovering = Object.entries(recoveryStatus)
        .filter(([_, s]) => {
            const pct = Number(s.recovery_percentage);
            return pct < 100 && Number(s.hours_until_recovery) > 0;
        })
        .sort((a, b) => a[1].hours_until_recovery - b[1].hours_until_recovery)
        .slice(0, 3);

    // If no recovering muscles, show empty state or return null
    if (recovering.length === 0) {
        return null;
    }

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MUSCLE RECOVERY</Text>
                <Text style={styles.headerSubtitle}>BIO-ANALYTICS</Text>
            </View>
            
            <View style={styles.cardsContainer}>
                {recovering.map(([muscle, status]) => (
                    <MuscleRecoveryCard 
                        key={muscle} 
                        muscle={muscle} 
                        status={status}
                    />
                ))}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        paddingHorizontal: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '900',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.label,
    },
    headerSubtitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '900',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.label,
    },
    cardsContainer: {
        gap: theme.spacing.s,
    },
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 0.5,
        borderColor: theme.colors.ui.border,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.s,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    muscleName: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    timeText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    cardRight: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    percentageText: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '900',
        marginBottom: theme.spacing.xs,
    },
    progressBar: {
        width: 80,
        height: 4,
        backgroundColor: theme.colors.ui.progressBg,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});

