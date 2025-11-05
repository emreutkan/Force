import { login } from '@/api/Auth';
import { getAccessToken } from '@/api/Storage';
import debug, { DebugLoginButton } from '@/state/debug';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        getAccessToken().then((accessToken) => {
            if (accessToken) {
                router.replace('/(home)');
            }
        });
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Information", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        // setError(''); // Removing local error state usage for alert
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                Alert.alert("Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
             {debug ? <View style={{ marginTop: 50 }}><DebugLoginButton /></View> : null}
             
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Log In</Text>
                    <Text style={styles.subtitle}>Sign in to access your workouts</Text>
                </View>
                
                {/* iOS Grouped Input Style */}
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.inputTop} 
                        placeholder="Email" 
                        placeholderTextColor="#C7C7CC"
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.separator} />
                    <TextInput 
                        style={styles.inputBottom} 
                        placeholder="Password" 
                        placeholderTextColor="#C7C7CC"
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry
                    />
                </View>

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <TouchableOpacity 
                            style={styles.loginButton} 
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>Log In</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity style={{ marginTop: 20 }}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark Background
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        textAlign: 'center',
    },
    inputGroup: {
        backgroundColor: '#2C2C2E', // Dark Card
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    inputTop: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#2C2C2E',
    },
    inputBottom: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#2C2C2E',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43', // Dark Separator
        marginLeft: 16,
    },
    buttonContainer: {
        marginTop: 8,
    },
    loginButton: {
        backgroundColor: '#007AFF', // iOS Blue
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    error: {
        color: '#FF3B30', // iOS Red
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 15,
    },
    linkText: {
        color: '#007AFF',
        textAlign: 'center',
        fontSize: 17,
    }
});
