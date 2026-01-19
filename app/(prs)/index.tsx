import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    FlatList,
    Dimensions
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, typographyStyles, commonStyles } from '@/constants/theme';
import { getPersonalRecords } from '@/api/Achievements';
import { PersonalRecord } from '@/api/types';

const PRCard = ({ item }: { item: any }) => {
    return (
        <TouchableOpacity 
            style={styles.prCard}
            onPress={() => router.push(`/(exercise-statistics)/${item.exercise_id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.prHeader}>
                <View style={styles.exerciseIcon}>
                    <Ionicons name="barbell" size={24} color={theme.colors.text.brand} />
                </View>
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.exercise_name.toUpperCase()}</Text>
                    <Text style={styles.totalVolume}>
                        TOTAL VOLUME: {item.total_volume.toLocaleString()} KG
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
            </View>

            <View style={styles.prStats}>
                <View style={styles.prStatItem}>
                    <Text style={styles.prStatLabel}>BEST WEIGHT</Text>
                    <View style={styles.prStatValueContainer}>
                        <Text style={styles.prStatValue}>{item.best_weight}</Text>
                        <Text style={styles.prStatUnit}>KG</Text>
                    </View>
                </View>
                
                <View style={styles.verticalDivider} />

                <View style={styles.prStatItem}>
                    <Text style={styles.prStatLabel}>BEST 1RM</Text>
                    <View style={styles.prStatValueContainer}>
                        <Text style={[styles.prStatValue, { color: theme.colors.text.brand }]}>
                            {item.best_one_rep_max.toFixed(1)}
                        </Text>
                        <Text style={styles.prStatUnit}>KG</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function PRScreen() {
    const insets = useSafeAreaInsets();
    const [prs, setPrs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPersonalRecords();
            setPrs(data);
        } catch (error) {
            console.error('Failed to fetch PRs:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>PERSONAL RECORDS</Text>
                <Text style={styles.headerSubtitle}>YOUR STRONGEST SELF</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            {renderHeader()}
            
            <View style={{ flex: 1 }}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.colors.text.brand} />
                    </View>
                ) : (
                    <FlatList
                        data={prs}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <PRCard item={item} />}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40, paddingTop: 10 }]}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="medal-outline" size={48} color={theme.colors.text.zinc800} />
                                <Text style={styles.emptyText}>No personal records yet</Text>
                                <Text style={styles.emptySubtext}>COMPLETE WORKOUTS TO TRACK YOUR BEST LIFTS</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingBottom: 15,
        gap: 15
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: { flex: 1 },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '900', 
        color: '#FFF', 
        fontStyle: 'italic',
        letterSpacing: 0.5 
    },
    headerSubtitle: { 
        fontSize: 10, 
        fontWeight: '800', 
        color: theme.colors.text.tertiary, 
        letterSpacing: 1 
    },
    listContent: {
        paddingHorizontal: 20,
    },
    prCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    prHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 16,
    },
    exerciseIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    totalVolume: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    prStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    prStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    prStatLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: 6,
    },
    prStatValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    prStatValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
    },
    prStatUnit: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
    },
    verticalDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.ui.border,
        marginHorizontal: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        marginTop: 16,
        textTransform: 'uppercase',
    },
    emptySubtext: {
        color: theme.colors.text.tertiary,
        fontSize: 9,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 0.5,
        lineHeight: 14,
    },
});
