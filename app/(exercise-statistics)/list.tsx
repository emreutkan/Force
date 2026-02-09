import { getExercises } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExerciseListScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const insets = useSafeAreaInsets();

    const loadExercises = useCallback(async (reset = false) => {
        if (reset) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        try {
            const pageToFetch = reset ? 1 : page + 1;
            const data = await getExercises(searchQuery, pageToFetch);

            if (data?.results) {
                // Paginated response
                if (reset) {
                    setExercises(data.results);
                    setPage(1);
                } else {
                    setExercises(prev => [...prev, ...data.results]);
                    setPage(pageToFetch);
                }
                setHasMore(!!data.next);
            } else if (Array.isArray(data)) {
                // Raw array response
                if (reset) {
                    setExercises(data);
                    setPage(1);
                } else {
                    setExercises(prev => [...prev, ...data]);
                    setPage(pageToFetch);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load exercises:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [searchQuery, page]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadExercises(true);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, loadExercises]);

    const handleLoadMore = () => {
        if (hasMore && !isLoadingMore && !isLoading) {
            loadExercises(false);
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>EXERCISE STATS</Text>
                <Text style={styles.headerSubtitle}>SELECT AN EXERCISE</Text>
            </View>
        </View>
    );

    const renderSearchBar = () => (
        <View style={styles.searchSection}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={theme.colors.text.tertiary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search exercises..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                )}
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
                {renderSearchBar()}
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.colors.text.brand} />
                    </View>
                ) : (
                    <FlatList
                        data={exercises}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.exerciseCard}
                                onPress={() => router.push(`/(exercise-statistics)/${item.id}`)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.exerciseInfo}>
                                    <View style={styles.exerciseIcon}>
                                        <Text style={styles.exerciseInitial}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.exerciseText}>
                                        <Text style={styles.exerciseName}>{item.name.toUpperCase()}</Text>
                                        <Text style={styles.exerciseDetail}>
                                            {item.primary_muscle?.toUpperCase() || 'MUSCLE'} • {item.equipment_type?.toUpperCase() || 'EQUIPMENT'}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isLoadingMore ? (
                                <View style={styles.footerLoader}>
                                    <ActivityIndicator size="small" color={theme.colors.text.brand} />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="barbell-outline" size={48} color={theme.colors.text.zinc800} />
                                <Text style={styles.emptyText}>No exercises found</Text>
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
    searchSection: { padding: 20 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    searchIcon: { marginRight: 12 },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    listContent: { paddingHorizontal: 20 },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    exerciseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    exerciseIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    exerciseInitial: {
        color: theme.colors.text.brand,
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    exerciseText: { flex: 1 },
    exerciseName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        fontStyle: 'italic',
        marginBottom: 2,
    },
    exerciseDetail: {
        color: theme.colors.text.tertiary,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    emptyContainer: { padding: 60, alignItems: 'center', justifyContent: 'center' },
    emptyText: {
        color: theme.colors.text.tertiary,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 16,
        textTransform: 'uppercase',
    },
});
