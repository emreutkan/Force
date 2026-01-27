import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface SetsHeaderProps {
    columns: string[];
    showTut?: boolean;
}

export const SetsHeader = ({ columns, showTut }: SetsHeaderProps) => {
    const displayColumns = showTut ? [...columns, 'TUT'] : columns;
    
    return (
        <View style={styles.header}>
            {displayColumns.map((column, index) => (
                <Text 
                    key={index} 
                    style={[
                        styles.headerText, 
                        index === 0 && { maxWidth: 30 }
                    ]}
                >
                    {column.toUpperCase()}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingLeft: 4,
    },
    headerText: {
        flex: 1,
        color: theme.colors.text.secondary,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
});
