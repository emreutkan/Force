import { TemplateWorkout } from '@/api/types';
import { startTemplateWorkout } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TemplatesSectionProps {
    templates: TemplateWorkout[];
}

export default function TemplatesSection({ templates }: TemplatesSectionProps) {
    const handleTemplatePress = (templateId: number) => {
        startTemplateWorkout({ template_workout_id: templateId }).then(res => {
            if(res?.id) router.push('/(active-workout)');
        });
    };

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Templates</Text>
                <TouchableOpacity onPress={() => router.push('/(templates)/create')}>
                    <Ionicons name="add-circle" size={24} color={theme.colors.status.active} />
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateList}>
                {templates.map(tpl => (
                    <TouchableOpacity 
                        key={tpl.id} 
                        style={styles.templateCard} 
                        onPress={() => handleTemplatePress(tpl.id)}
                    >
                        <View style={styles.templateIcon}>
                            <Text style={styles.templateIconText}>{tpl.title.charAt(0)}</Text>
                        </View>
                        <Text style={styles.templateName} numberOfLines={2}>{tpl.title}</Text>
                        <Text style={styles.templateCount}>{tpl.exercises.length} Exercises</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: theme.spacing.s, 
        paddingHorizontal: theme.spacing.xs 
    },
    sectionTitle: { 
        fontSize: theme.typography.sizes.l, 
        fontWeight: '700', 
        color: theme.colors.text.primary 
    },
    templateList: { 
        paddingRight: theme.spacing.m, 
        gap: theme.spacing.s 
    },
    templateCard: { 
        width: 140, 
        height: 140, 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.l, 
        padding: theme.spacing.s, 
        justifyContent: 'space-between', 
        borderWidth: 0.5, 
        borderColor: theme.colors.ui.border 
    },
    templateIcon: { 
        width: 32, 
        height: 32, 
        borderRadius: theme.borderRadius.m, 
        backgroundColor: theme.colors.ui.surfaceHighlight, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    templateIconText: { 
        fontSize: theme.typography.sizes.m, 
        fontWeight: '700', 
        color: theme.colors.text.primary 
    },
    templateName: { 
        fontSize: theme.typography.sizes.s, 
        fontWeight: '600', 
        color: theme.colors.text.primary 
    },
    templateCount: { 
        fontSize: theme.typography.sizes.s, 
        color: theme.colors.text.secondary 
    },
});

