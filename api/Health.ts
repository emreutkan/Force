import { Platform } from 'react-native';

let AppleHealthKit: any = null;
let GoogleFit: any = null;

// Lazy load the health libraries
if (Platform.OS === 'ios') {
    try {
        AppleHealthKit = require('react-native-health').default;
    } catch (e) {
        console.log('react-native-health not available');
    }
}

if (Platform.OS === 'android') {
    try {
        GoogleFit = require('react-native-google-fit').default;
    } catch (e) {
        console.log('react-native-google-fit not available');
    }
}

export interface HealthSteps {
    steps: number;
    date: string;
}

class HealthService {
    private isInitialized = false;

    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            if (Platform.OS === 'ios' && AppleHealthKit) {
                return new Promise((resolve) => {
                    const permissions = {
                        permissions: {
                            read: [AppleHealthKit.Constants.Permissions.StepCount],
                        },
                    };

                    AppleHealthKit.initHealthKit(permissions, (error: any) => {
                        if (error) {
                            console.log('Error initializing HealthKit:', error);
                            this.isInitialized = false;
                            resolve(false);
                        } else {
                            this.isInitialized = true;
                            resolve(true);
                        }
                    });
                });
            } else if (Platform.OS === 'android' && GoogleFit) {
                // Check if GoogleFit.Scopes exists
                if (!GoogleFit.Scopes || !GoogleFit.Scopes.FITNESS_ACTIVITY_READ) {
                    console.log('GoogleFit.Scopes not available');
                    this.isInitialized = false;
                    return false;
                }
                
                const options = {
                    scopes: [
                        GoogleFit.Scopes.FITNESS_ACTIVITY_READ,
                    ],
                };

                const authResult = await GoogleFit.authorize(options);
                if (authResult.success) {
                    this.isInitialized = true;
                    return true;
                } else {
                    console.log('Error initializing Google Fit:', authResult.message);
                    this.isInitialized = false;
                    return false;
                }
            }
            this.isInitialized = false;
            return false;
        } catch (error) {
            console.log('Health service initialization error:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async checkPermissionStatus(): Promise<boolean> {
        try {
            if (Platform.OS === 'ios' && AppleHealthKit) {
                return new Promise((resolve) => {
                    const permissions = {
                        permissions: {
                            read: [AppleHealthKit.Constants.Permissions.StepCount],
                        },
                    };

                    AppleHealthKit.initHealthKit(permissions, (error: any) => {
                        if (error) {
                            resolve(false);
                        } else {
                            this.isInitialized = true;
                            resolve(true);
                        }
                    });
                });
            } else if (Platform.OS === 'android' && GoogleFit) {
                // For Android, try to get steps which will fail if not authorized
                try {
                    const today = new Date();
                    const startOfDay = new Date(today);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(today);
                    endOfDay.setHours(23, 59, 59, 999);

                    const options = {
                        startDate: startOfDay.toISOString(),
                        endDate: endOfDay.toISOString(),
                    };

                    const res = await GoogleFit.getDailyStepCountSamples(options);
                    // If we can get data, we're authorized
                    this.isInitialized = true;
                    return true;
                } catch (e) {
                    // If it fails, we're not authorized
                    return false;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    resetInitialization() {
        this.isInitialized = false;
    }

    async getTodaySteps(): Promise<number> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return 0;
            }

            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            if (Platform.OS === 'ios' && AppleHealthKit) {
                return new Promise((resolve) => {
                    const options = {
                        startDate: startOfDay.toISOString(),
                        endDate: endOfDay.toISOString(),
                    };

                    AppleHealthKit.getStepCount(options, (err: any, results: any) => {
                        if (err) {
                            console.log('Error fetching step count:', err);
                            resolve(0);
                        } else {
                            resolve(results?.value || 0);
                        }
                    });
                });
            } else if (Platform.OS === 'android' && GoogleFit) {
                const options = {
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString(),
                };

                const res = await GoogleFit.getDailyStepCountSamples(options);
                if (res && res.length > 0 && res[0].steps) {
                    return res[0].steps.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
                }
                return 0;
            }
            return 0;
        } catch (error) {
            console.log('Error getting steps:', error);
            return 0;
        }
    }
}

export const healthService = new HealthService();

