// Shared utility functions for exercise cards

export const validateSetData = (data: any): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];

    if (data.reps !== undefined && data.reps !== null) {
        const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
        if (isNaN(reps) || reps < 1 || reps > 100) {
            errors.push('Reps must be between 1 and 100');
        }
    }

    if (data.reps_in_reserve !== undefined && data.reps_in_reserve !== null) {
        const rir = typeof data.reps_in_reserve === 'string' ? parseInt(data.reps_in_reserve) : data.reps_in_reserve;
        if (isNaN(rir) || rir < 0 || rir > 100) {
            errors.push('RIR must be between 0 and 100');
        }
    }

    if (data.rest_time_before_set !== undefined && data.rest_time_before_set !== null) {
        const restTime = typeof data.rest_time_before_set === 'string' ? parseInt(data.rest_time_before_set) : data.rest_time_before_set;
        if (isNaN(restTime) || restTime < 0 || restTime > 10800) {
            errors.push('Rest time cannot exceed 3 hours');
        }
    }

    if (data.total_tut !== undefined && data.total_tut !== null) {
        const tut = typeof data.total_tut === 'string' ? parseInt(data.total_tut) : data.total_tut;
        if (isNaN(tut) || tut < 0 || tut > 600) {
            errors.push('Time under tension cannot exceed 10 minutes');
        }
    }

    return { isValid: errors.length === 0, errors };
};

export const formatValidationErrors = (validationErrors: any): string => {
    if (!validationErrors || typeof validationErrors !== 'object') {
        return 'Validation failed';
    }

    const messages: string[] = [];
    Object.keys(validationErrors).forEach(field => {
        const fieldErrors = validationErrors[field];
        if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((error: string) => {
                let friendlyMessage = error;
                if (error.includes('less than or equal to 100')) {
                    friendlyMessage = field === 'reps' ? 'Reps must be between 1 and 100' : 'RIR must be between 0 and 100';
                } else if (error.includes('less than or equal to 10800')) {
                    friendlyMessage = 'Rest time cannot exceed 3 hours';
                } else if (error.includes('less than or equal to 600')) {
                    friendlyMessage = 'Time under tension cannot exceed 10 minutes';
                } else if (error.includes('greater than or equal to 0')) {
                    friendlyMessage = `${field} cannot be negative`;
                }
                messages.push(friendlyMessage);
            });
        } else {
            messages.push(fieldErrors);
        }
    });

    return messages.join('\n');
};

// Parse rest time: if contains ".", treat as minutes (X.YY), else as seconds
export const parseRestTime = (input: string): number => {
    if (!input || input.trim() === '') return 0;
    
    if (input.includes('.')) {
        // Treat as minutes: X.YY -> convert to seconds
        const minutes = parseFloat(input);
        if (isNaN(minutes)) return 0;
        return Math.round(minutes * 60);
    } else {
        // Treat as seconds
        const seconds = parseInt(input);
        return isNaN(seconds) ? 0 : seconds;
    }
};

// Format rest time for display
export const formatRestTimeForDisplay = (seconds: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}.${s.toString().padStart(2, '0')}` : `${m}`;
};

// Format rest time for input (shows as X.YY for minutes or just number for seconds)
export const formatRestTimeForInput = (seconds: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}.${s.toString().padStart(2, '0')}` : `${m}`;
};

// Format weight for display
export const formatWeight = (weight: number): string => {
    if (!weight && weight !== 0) return '-';
    const w = Number(weight);
    if (isNaN(w)) return '-';
    if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
    return parseFloat(w.toFixed(2)).toString();
};
