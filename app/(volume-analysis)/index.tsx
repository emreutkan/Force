import { getVolumeAnalysis } from '@/api/VolumeAnalysis';
import { VolumeAnalysisResponse } from '@/api/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MuscleGroupSummary {
    muscle_group: string;
    average_volume: number;
    max_volume: number;
    min_volume: number;
    total_sets: number;
    total_workouts: number;
}

export default function VolumeAnalysisScreen() {
    const insets = useSafeAreaInsets();
    const [analysis, setAnalysis] = useState<VolumeAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [weeksBack, setWeeksBack] = useState('12');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    useEffect(() => {
        loadAnalysis();
    }, []);

    const loadAnalysis = async () => {
        setIsLoading(true);
        try {
            const weeks = weeksBack ? parseInt(weeksBack) : 12;
            const data = await getVolumeAnalysis({ weeks_back: weeks });
            if (data?.weeks) {
                setAnalysis(data);
            }
        } catch (error) {
            console.error('Failed to load volume analysis:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate summary stats from weeks data
    const summaryStats = useMemo(() => {
        if (!analysis?.weeks) return [];

        const muscleGroupMap = new Map<string, { volumes: number[]; sets: number; workouts: number }>();

        analysis.weeks.forEach(week => {
            Object.entries(week.muscle_groups).forEach(([muscleGroup, data]) => {
                if (!muscleGroupMap.has(muscleGroup)) {
                    muscleGroupMap.set(muscleGroup, { volumes: [], sets: 0, workouts: 0 });
                }
                const stats = muscleGroupMap.get(muscleGroup)!;
                stats.volumes.push(data.total_volume);
                stats.sets += data.sets;
                stats.workouts += data.workouts;
            });
        });

        const summaries: MuscleGroupSummary[] = [];
        muscleGroupMap.forEach((stats, muscleGroup) => {
            if (stats.volumes.length > 0) {
                summaries.push({
                    muscle_group: muscleGroup,
                    average_volume: stats.volumes.reduce((a, b) => a + b, 0) / stats.volumes.length,
                    max_volume: Math.max(...stats.volumes),
                    min_volume: Math.min(...stats.volumes),
                    total_sets: stats.sets,
                    total_workouts: stats.workouts,
                });
            }
        });

        return summaries.sort((a, b) => b.average_volume - a.average_volume);
    }, [analysis]);

    // Calculate total stats
    const totalStats = useMemo(() => {
        if (!analysis?.weeks) return { totalWorkouts: 0, totalSets: 0 };
        
        const workoutSet = new Set<number>();
        let totalSets = 0;
        
        analysis.weeks.forEach(week => {
            Object.values(week.muscle_groups).forEach(data => {
                totalSets += data.sets;
                // Note: workouts might be duplicated across muscle groups, but we'll use the max per week
            });
        });

        // Count unique workouts (approximate - using max workouts per week)
        const totalWorkouts = Math.max(...analysis.weeks.map(week => 
            Math.max(...Object.values(week.muscle_groups).map(d => d.workouts), 0)
        ), 0) * analysis.weeks.length;

        return {
            totalWorkouts: analysis.weeks.reduce((sum, week) => 
                sum + Math.max(...Object.values(week.muscle_groups).map(d => d.workouts), 0), 0
            ),
            totalSets,
        };
    }, [analysis]);

    const handleApplyFilters = () => {
        setIsFilterModalVisible(false);
        loadAnalysis();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getMuscleGroupColor = (muscleGroup: string) => {
        const colors: Record<string, string> = {
            'chest': '#FF3B30',
            'shoulders': '#FF9500',
            'biceps': '#FFCC00',
            'triceps': '#34C759',
            'lats': '#5AC8FA',
            'traps': '#AF52DE',
            'quads': '#FF2D55',
            'hamstrings': '#5856D6',
            'glutes': '#FF9500',
            'calves': '#32D74B',
            'abs': '#0A84FF',
            'forearms': '#FF9500',
        };
        return colors[muscleGroup.toLowerCase()] || '#8E8E93';
    };

    const renderSummaryCard = ({ item }: { item: MuscleGroupSummary }) => {
        const color = getMuscleGroupColor(item.muscle_group);
        const maxVolume = summaryStats.reduce((max, stat) => Math.max(max, stat.max_volume), 0) || 1;
        const volumePercentage = (item.average_volume / maxVolume) * 100;

        return (
            <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => setSelectedMuscleGroup(item.muscle_group)}
                activeOpacity={0.7}
            >
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryMuscleGroup}>
                        {item.muscle_group.charAt(0).toUpperCase() + item.muscle_group.slice(1)}
                    </Text>
                    <View style={[styles.summaryColorDot, { backgroundColor: color }]} />
                </View>
                
                <View style={styles.summaryStats}>
                    <View style={styles.summaryStat}>
                        <Text style={styles.summaryStatLabel}>Avg</Text>
                        <Text style={styles.summaryStatValue}>{item.average_volume.toFixed(0)}</Text>
                    </View>
                    <View style={styles.summaryStat}>
                        <Text style={styles.summaryStatLabel}>Max</Text>
                        <Text style={styles.summaryStatValue}>{item.max_volume.toFixed(0)}</Text>
                    </View>
                    <View style={styles.summaryStat}>
                        <Text style={styles.summaryStatLabel}>Sets</Text>
                        <Text style={styles.summaryStatValue}>{item.total_sets}</Text>
                    </View>
                </View>

                <View style={styles.summaryBarContainer}>
                    <View style={styles.summaryBarBackground}>
                        <View 
                            style={[
                                styles.summaryBarFill,
                                { 
                                    width: `${volumePercentage}%`,
                                    backgroundColor: color
                                }
                            ]}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderWeeklyData = () => {
        if (!analysis || !selectedMuscleGroup) return null;

        const weeklyData = analysis.weeks.map(week => {
            const muscleData = week.muscle_groups[selectedMuscleGroup];
            return {
                week: week,
                volume: muscleData?.total_volume || 0,
                sets: muscleData?.sets || 0,
            };
        });

        const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);

        return (
            <View style={styles.weeklyContainer}>
                <View style={styles.weeklyHeader}>
                    <Text style={styles.weeklyTitle}>
                        {selectedMuscleGroup.charAt(0).toUpperCase() + selectedMuscleGroup.slice(1)} - Weekly Volume
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedMuscleGroup(null)}>
                        <Ionicons name="close-circle" size={24} color="#8E8E93" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.weeklyChart}>
                        {weeklyData.map((data, idx) => {
                            const heightPercentage = (data.volume / maxVolume) * 100;
                            return (
                                <View key={idx} style={styles.weeklyBarContainer}>
                                    <View style={styles.weeklyBarWrapper}>
                                        <View 
                                            style={[
                                                styles.weeklyBar,
                                                {
                                                    height: `${Math.max(heightPercentage, 5)}%`,
                                                    backgroundColor: getMuscleGroupColor(selectedMuscleGroup)
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.weeklyBarValue}>{data.volume.toFixed(0)}</Text>
                                    <Text style={styles.weeklyBarLabel} numberOfLines={2}>
                                        {formatDate(data.week.week_start)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <Text style={styles.title}>Volume Analysis</Text>
                <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}>
                    <Ionicons name="options-outline" size={24} color="#0A84FF" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : analysis ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Overview Stats */}
                    <View style={styles.overviewCard}>
                        <Text style={styles.overviewTitle}>Overview</Text>
                        <View style={styles.overviewStats}>
                            <View style={styles.overviewStat}>
                                <Text style={styles.overviewStatValue}>{totalStats.totalWorkouts}</Text>
                                <Text style={styles.overviewStatLabel}>Workouts</Text>
                            </View>
                            <View style={styles.overviewStat}>
                                <Text style={styles.overviewStatValue}>{totalStats.totalSets}</Text>
                                <Text style={styles.overviewStatLabel}>Total Sets</Text>
                            </View>
                            <View style={styles.overviewStat}>
                                <Text style={styles.overviewStatValue}>{analysis.period?.total_weeks || analysis.weeks.length}</Text>
                                <Text style={styles.overviewStatLabel}>Weeks</Text>
                            </View>
                        </View>
                    </View>

                    {/* Weekly Chart (if muscle group selected) */}
                    {renderWeeklyData()}

                    {/* Summary Stats */}
                    {summaryStats.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Muscle Group Summary</Text>
                            <FlatList
                                data={summaryStats}
                                renderItem={renderSummaryCard}
                                keyExtractor={(item) => item.muscle_group}
                                scrollEnabled={false}
                            />
                        </View>
                    )}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="bar-chart-outline" size={64} color="#8E8E93" />
                    <Text style={styles.emptyText}>No data available</Text>
                </View>
            )}

            {/* Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filter Options</Text>
                        
                        <Text style={styles.modalLabel}>Weeks Back</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={weeksBack}
                            onChangeText={setWeeksBack}
                            keyboardType="numeric"
                            placeholder="12"
                            placeholderTextColor="#8E8E93"
                        />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsFilterModalVisible(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleApplyFilters}
                            >
                                <Text style={styles.modalButtonSaveText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 40,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    overviewCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    overviewStat: {
        alignItems: 'center',
    },
    overviewStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0A84FF',
        marginBottom: 4,
    },
    overviewStatLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    weeklyContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    weeklyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    weeklyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
    },
    weeklyChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingVertical: 8,
    },
    weeklyBarContainer: {
        alignItems: 'center',
        marginRight: 12,
        minWidth: 50,
    },
    weeklyBarWrapper: {
        height: 120,
        width: 40,
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    weeklyBar: {
        width: '100%',
        borderRadius: 4,
        minHeight: 4,
    },
    weeklyBarValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    weeklyBarLabel: {
        fontSize: 10,
        color: '#8E8E93',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryMuscleGroup: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    summaryColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    summaryStat: {
        alignItems: 'center',
    },
    summaryStatLabel: {
        fontSize: 11,
        color: '#8E8E93',
        marginBottom: 4,
    },
    summaryStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    summaryBarContainer: {
        marginTop: 8,
    },
    summaryBarBackground: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
    },
    summaryBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        padding: 18,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
        marginBottom: 24,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#2C2C2E',
    },
    modalButtonSave: {
        backgroundColor: '#0A84FF',
    },
    modalButtonCancelText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalButtonSaveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

