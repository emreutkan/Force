import { getResearch } from '@/api/KnowledgeBase';
import { ResearchFilters, TrainingResearch } from '@/api/types';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'INTENSITY_GUIDELINES', label: 'Intensity Guidelines' },
    { value: 'PROTEIN_SYNTHESIS', label: 'Protein Synthesis' },
    { value: 'MUSCLE_GROUPS', label: 'Muscle Groups' },
    { value: 'MUSCLE_RECOVERY', label: 'Muscle Recovery' },
    { value: 'REST_PERIODS', label: 'Rest Periods' },
    { value: 'TRAINING_FREQUENCY', label: 'Training Frequency' },
    { value: 'BODY_MEASUREMENTS', label: 'Body Measurements' },
];

const MUSCLE_GROUPS = [
    { value: '', label: 'All Muscle Groups' },
    { value: 'chest', label: 'Chest' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'biceps', label: 'Biceps' },
    { value: 'triceps', label: 'Triceps' },
    { value: 'lats', label: 'Lats' },
    { value: 'traps', label: 'Traps' },
    { value: 'quads', label: 'Quads' },
    { value: 'hamstrings', label: 'Hamstrings' },
    { value: 'glutes', label: 'Glutes' },
    { value: 'calves', label: 'Calves' },
    { value: 'abs', label: 'Abs' },
];

const EXERCISE_TYPES = [
    { value: '', label: 'All Exercise Types' },
    { value: 'compound', label: 'Compound' },
    { value: 'isolation', label: 'Isolation' },
];

export default function KnowledgeBaseScreen() {
    const insets = useSafeAreaInsets();
    const [research, setResearch] = useState<TrainingResearch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<ResearchFilters>({});
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadResearch();
    }, [filters]);

    const loadResearch = async () => {
        setIsLoading(true);
        try {
            const data = await getResearch(filters);
            if (Array.isArray(data)) {
                setResearch(data);
            }
        } catch (error) {
            console.error('Failed to load research:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResearch = research.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.title.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    const formatCategory = (category: string) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const renderResearchCard = ({ item }: { item: TrainingResearch }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{formatCategory(item.category)}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                        {(item.confidence_score * 100).toFixed(0)}%
                    </Text>
                </View>
            </View>
            
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSummary}>{item.summary}</Text>
            
            {item.evidence_level && (
                <View style={styles.evidenceBadge}>
                    <Text style={styles.evidenceText}>{item.evidence_level} evidence</Text>
                </View>
            )}
            
            {item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {item.tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
            
            {item.source_url && (
                <TouchableOpacity 
                    style={styles.sourceButton}
                    onPress={() => {
                        // You can use Linking.openURL(item.source_url!) here if needed
                    }}
                >
                    <Ionicons name="link-outline" size={16} color="#0A84FF" />
                    <Text style={styles.sourceText}>View Source</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader title="Knowledge Base" />

            <View style={styles.filtersContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={[
                                        styles.filterPill,
                                        filters.category === cat.value && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilters({ ...filters, category: cat.value || undefined })}
                                >
                                    <Text style={[
                                        styles.filterPillText,
                                        filters.category === cat.value && styles.filterPillTextActive
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Muscle Group</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {MUSCLE_GROUPS.map((mg) => (
                                <TouchableOpacity
                                    key={mg.value}
                                    style={[
                                        styles.filterPill,
                                        filters.muscle_group === mg.value && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilters({ ...filters, muscle_group: mg.value || undefined })}
                                >
                                    <Text style={[
                                        styles.filterPillText,
                                        filters.muscle_group === mg.value && styles.filterPillTextActive
                                    ]}>
                                        {mg.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Exercise Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {EXERCISE_TYPES.map((et) => (
                                <TouchableOpacity
                                    key={et.value}
                                    style={[
                                        styles.filterPill,
                                        filters.exercise_type === et.value && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilters({ ...filters, exercise_type: et.value || undefined })}
                                >
                                    <Text style={[
                                        styles.filterPillText,
                                        filters.exercise_type === et.value && styles.filterPillTextActive
                                    ]}>
                                        {et.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search research..."
                    placeholderTextColor="#8E8E93"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={filteredResearch}
                    renderItem={renderResearchCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContent, { paddingTop: 60 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="library-outline" size={64} color="#8E8E93" />
                            <Text style={styles.emptyText}>No research found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    filtersContainer: {
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        marginTop: 60,
    },
    filtersContent: {
        paddingVertical: 16,
    },
    filterGroup: {
        marginRight: 24,
        minWidth: 200,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '300',
        color: '#8E8E93',
        marginBottom: 16,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterScroll: {
        flexGrow: 0,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2C2C2E',
        marginRight: 8,
        marginLeft: 16,
    },
    filterPillActive: {
        backgroundColor: '#0A84FF',
    },
    filterPillText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
        fontWeight: '400',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        marginHorizontal: 16,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 17,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryBadge: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '300',
        color: '#0A84FF',
        textTransform: 'uppercase',
    },
    confidenceBadge: {
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
    },
    confidenceText: {
        fontSize: 13,
        fontWeight: '300',
        color: '#32D74B',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    cardSummary: {
        fontSize: 17,
        color: '#8E8E93',
        lineHeight: 24,
        marginBottom: 16,
        fontWeight: '400',
    },
    evidenceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 12,
    },
    evidenceText: {
        fontSize: 12,
        color: '#8E8E93',
        textTransform: 'capitalize',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        color: '#A1A1A6',
    },
    sourceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    sourceText: {
        fontSize: 14,
        color: '#0A84FF',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
});

