import { googleLogin, register } from '@/api/Auth';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState<string>('male');
    const [height, setHeight] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const fetchUser = useUserStore((state) => state.fetchUser);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '344903572266-72t0uji4lhh6htisqb3kq36sslq6jf7j.apps.googleusercontent.com',
        iosClientId: '344903572266-72t0uji4lhh6htisqb3kq36sslq6jf7j.apps.googleusercontent.com', // Using web client ID as placeholder to bypass error if running on simulator without native config
        androidClientId: '344903572266-1kfttptioqaffsf58e5rq5uo2n9s2ho5.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        }
    }, [response]);

    const handleGoogleLogin = async (token: string) => {
        setLoading(true);
        try {
            const result = await googleLogin(token);
            if (typeof result === 'object' && result.access && result.refresh) {
                await fetchUser();
                router.replace('/(home)');
            } else {
                Alert.alert("Google Sign Up Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred during Google sign up.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Password Mismatch", "Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const heightValue = height ? parseFloat(height) : undefined;
            const result = await register(email, password, gender, heightValue);
            
            if (typeof result === 'object' && result.access && result.refresh) {
                await fetchUser();
                router.replace('/(home)');
            } else {
                Alert.alert("Registration Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            promptAsync();
        } else {
            Alert.alert(`${provider} Sign Up`, "This feature is coming soon!");
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to start tracking your workouts</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.inputTop} 
                        placeholder="Full Name" 
                        placeholderTextColor="#8E8E93"
                        value={name} 
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <View style={styles.separator} />
                    
                    <TextInput 
                        style={styles.inputMiddle} 
                        placeholder="Email" 
                        placeholderTextColor="#8E8E93"
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.separator} />
                    
                    <View style={styles.passwordContainer}>
                        <TextInput 
                            style={styles.passwordInput} 
                            placeholder="Password" 
                            placeholderTextColor="#8E8E93"
                            value={password} 
                            onChangeText={setPassword} 
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#8E8E93" 
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.separator} />

                    <TextInput 
                        style={styles.inputMiddle} 
                        placeholder="Confirm Password" 
                        placeholderTextColor="#8E8E93"
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                        secureTextEntry={!showPassword}
                    />
                    <View style={styles.separator} />

                    <View style={styles.genderContainer}>
                        <Text style={styles.genderLabel}>Gender</Text>
                        <View style={styles.genderOptions}>
                            <TouchableOpacity
                                style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
                                onPress={() => setGender('male')}
                            >
                                <Text style={[styles.genderOptionText, gender === 'male' && styles.genderOptionTextSelected]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
                                onPress={() => setGender('female')}
                            >
                                <Text style={[styles.genderOptionText, gender === 'female' && styles.genderOptionTextSelected]}>Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.separator} />

                    <TextInput 
                        style={styles.inputBottom} 
                        placeholder="Height (cm) - Optional" 
                        placeholderTextColor="#8E8E93"
                        value={height} 
                        onChangeText={setHeight}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0A84FF" />
                    ) : (
                        <TouchableOpacity 
                            style={styles.registerButton} 
                            onPress={handleRegister}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.registerButtonText}>Sign Up</Text>
                        </TouchableOpacity>
                    )}
                </View>

                 {/* Divider */}
                 <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or sign up with</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialContainer}>
                    <TouchableOpacity 
                        style={styles.socialButton} 
                        onPress={() => handleSocialLogin('Apple')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                        <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.socialButton} 
                        onPress={() => handleSocialLogin('Google')}
                        activeOpacity={0.8}
                        disabled={!request}
                    >
                        {loading && response?.type !== 'success' && request ? (
                             <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                             <>
                                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Google</Text>
                             </>
                        )}
                    </TouchableOpacity>
                </View>
                
                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
        marginTop: 16, // Space for back button if needed, or visual balance
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        textAlign: 'center',
    },
    inputGroup: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    inputTop: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    inputMiddle: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    inputBottom: {
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#1C1C1E',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        height: 56,
    },
    passwordInput: {
        flex: 1,
        height: 56,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
    },
    eyeIcon: {
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
        marginLeft: 16,
    },
    buttonContainer: {
        marginBottom: 24,
    },
    registerButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 22,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
    },
    dividerText: {
        color: '#8E8E93',
        fontSize: 13,
        marginHorizontal: 16,
        fontWeight: '300',
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        gap: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    footer: {
        alignItems: 'center',
    },
    linkText: {
        color: '#8E8E93',
        fontSize: 17,
    },
    linkBold: {
        color: '#0A84FF',
        fontWeight: '400',
    },
    genderContainer: {
        padding: 16,
        backgroundColor: '#1C1C1E',
    },
    genderLabel: {
        color: '#8E8E93',
        fontSize: 13,
        marginBottom: 16,
        fontWeight: '300',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 16,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
    genderOptionSelected: {
        borderColor: '#0A84FF',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
    },
    genderOptionText: {
        color: '#8E8E93',
        fontSize: 17,
        fontWeight: '400',
    },
    genderOptionTextSelected: {
        color: '#0A84FF',
        fontWeight: '400',
    }
});
