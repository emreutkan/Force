import { googleLogin, login } from '@/api/Auth';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Web-compatible alert helper
const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

// Handle deep linking for authentication
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tapCount = useRef(0);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);
    
    // Animation for login button section
    const buttonHeight = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    
    useEffect(() => {
        if (password.length > 0) {
            buttonHeight.value = withTiming(70, {
                duration: 500,
            });
            buttonOpacity.value = withTiming(1, { duration: 500 });
        } else {
            buttonHeight.value = withTiming(0, {
                duration: 500,
            });
            buttonOpacity.value = withTiming(0, { duration: 500 });
        }
    }, [password.length]);
    
    const animatedButtonStyle = useAnimatedStyle(() => ({
        height: buttonHeight.value,
        opacity: buttonOpacity.value,
        overflow: 'hidden',
    }));

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '344903572266-72t0uji4lhh6htisqb3kq36sslq6jf7j.apps.googleusercontent.com',
        // You need to generate these in Google Cloud Console for the specific platform to avoid "Compliance" errors
        iosClientId: '344903572266-314v6q9vh2qooo4hqkqp1ornn8098uh6.apps.googleusercontent.com', 
        androidClientId: '344903572266-1kfttptioqaffsf58e5rq5uo2n9s2ho5.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });


    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        }
    }, [response]);

    useEffect(() => {
        return () => {
            if (tapTimeout.current) {
                clearTimeout(tapTimeout.current);
            }
        };
    }, []);

    const handleUtrackTap = () => {
        tapCount.current += 1;
        
        // Clear existing timeout
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
        }
        
        // If 5 taps, navigate to debug
        if (tapCount.current >= 5) {
            tapCount.current = 0;
            router.push('/(auth)/debug');
        } else {
            // Reset counter after 2 seconds of no taps
            tapTimeout.current = setTimeout(() => {
                tapCount.current = 0;
            }, 2000) as any;
        }
    };

    const handleGoogleLogin = async (token: string) => {
        setLoading(true);
        try {
            const result = await googleLogin(token);
            // Allow login if we get an object with an access token, even if refresh is empty string
            if (typeof result === 'object' && result.access) {
                router.replace('/(home)');
            } else {
                showAlert("Google Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            showAlert("Error", "An unexpected error occurred during Google login.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Missing Information", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                showAlert("Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            showAlert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            promptAsync();
        } else {
            showAlert(`${provider} Login`, "This feature is coming soon!");
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.heroSection}>
                    <TouchableOpacity 
                        onPress={handleUtrackTap}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.heroTitle}>utrack</Text>
                    </TouchableOpacity>
                </View>
      
                
                <BlurView intensity={80} style={styles.blurView}>
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.inputTop} 
                        placeholder="Email" 
                        placeholderTextColor="#8E8E93"
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.separator} />
                    <TextInput 
                        style={styles.inputMiddle} 
                        placeholder="Password" 
                        placeholderTextColor="#8E8E93"
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry
                    />
                   <Animated.View style={animatedButtonStyle}>
                         <View style={styles.seperatorWide} />
                         <TouchableOpacity style={styles.inputBottom}
                             onPress={handleLogin}
                             activeOpacity={0.8}
                             disabled={loading || password.length === 0}
                             >
                             <Text style={styles.loginButtonText}>Log In</Text>
                         </TouchableOpacity>
                   </Animated.View>

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
                        disabled={!request} // Disable if request is not ready
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
                </BlurView>
                
                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 16 }}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
        padding: 24,
    },
    blurView: {
        borderRadius: 22,
        overflow: 'hidden',

        padding: 12,
    },
    heroSection: {
        paddingTop: "20%",
        paddingBottom: "5%",
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: '700',
        color: '#0A84FF',
        letterSpacing: 2,
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
        height: 70,
        paddingHorizontal: 16,
        fontSize: 17,
        backgroundColor: '#151517',
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
        marginLeft: 16,
        marginRight: 16,
    },
    seperatorWide: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
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
    forgotPasswordText: {
        color: '#0A84FF',
        fontSize: 17,
    }
});
