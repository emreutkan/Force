import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../ExerciseCard';

// Mock dependencies
jest.mock('@/api/Exercises', () => ({
  updateSet: jest.fn(),
}));

jest.mock('@/api/Workout', () => ({
  getRestTimerState: jest.fn(),
  stopRestTimer: jest.fn(),
}));

jest.mock('@/state/userStore', () => ({
  useActiveWorkoutStore: jest.fn(() => ({
    lastSetTimestamp: null,
    lastExerciseCategory: 'isolation',
  })),
}));

jest.mock('../RestTimerBar', () => ({
  useRestTimer: jest.fn(() => ({ timerText: '0:00' })),
}));

describe('ExerciseCard', () => {
  const mockWorkoutExercise = {
    id: 1,
    exercise: {
      id: 1,
      name: 'Bench Press',
      primary_muscle: 'Chest',
      secondary_muscles: ['Shoulders', 'Triceps'],
      equipment_type: 'Barbell',
    },
    sets: [
      {
        id: 1,
        weight: 100,
        reps: 10,
        reps_in_reserve: 2,
        rest_time_before_set: 120,
        is_warmup: false,
      },
    ],
  };

  const defaultProps = {
    workoutExercise: mockWorkoutExercise,
    isLocked: false,
    isEditMode: false,
    isViewOnly: false,
    onToggleLock: jest.fn(),
    onRemove: jest.fn(),
    onAddSet: jest.fn(),
    onDeleteSet: jest.fn(),
    swipeControl: {
      register: jest.fn(),
      onOpen: jest.fn(),
      onClose: jest.fn(),
      closeAll: jest.fn(),
    },
    onInputFocus: jest.fn(),
    onShowInfo: jest.fn(),
    onShowStatistics: jest.fn(),
    isActive: false,
    drag: jest.fn(),
    onUpdateSet: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders exercise name correctly', () => {
    const { getByText } = render(<ExerciseCard {...defaultProps} />);
    expect(getByText('Bench Press')).toBeTruthy();
  });

  it('renders primary muscle tag', () => {
    const { getByText } = render(<ExerciseCard {...defaultProps} />);
    expect(getByText('Chest')).toBeTruthy();
  });

  it('renders sets information', () => {
    const { getByText } = render(<ExerciseCard {...defaultProps} />);
    expect(getByText('1')).toBeTruthy(); // Set number
    expect(getByText('10')).toBeTruthy(); // Reps
  });

  it('shows lock icon when exercise is locked', () => {
    const { getByText } = render(
      <ExerciseCard {...defaultProps} isLocked={true} />
    );
    expect(getByText('Bench Press')).toBeTruthy();
  });

  it('does not render sets when view only and no sets', () => {
    const workoutExerciseNoSets = {
      ...mockWorkoutExercise,
      sets: [],
    };
    const { queryByText } = render(
      <ExerciseCard
        {...defaultProps}
        workoutExercise={workoutExerciseNoSets}
        isViewOnly={true}
        isLocked={true}
      />
    );
    expect(queryByText('Set')).toBeNull();
  });
});
