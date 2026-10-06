export interface Exercise {
  key: string
  name: string
  category: 'balance' | 'strength' | 'cardio' | 'flexibility'
  description: string
  instructions: string[]
  durationMinutes: number
  reps?: number
  sets?: number
  fallRiskLevels: ('low' | 'moderate' | 'high')[]
  videoUrl?: string
}

export const EXERCISE_LIBRARY: Exercise[] = [
  {
    key: 'single_leg_stand',
    name: 'Single Leg Stand',
    category: 'balance',
    description: 'Stand on one foot to improve balance and reduce fall risk.',
    instructions: [
      'Stand behind a sturdy chair and hold the back for support.',
      'Lift your right foot off the floor and balance on your left leg.',
      'Hold for up to 30 seconds.',
      'Switch legs and repeat.',
      'As you improve, try without holding the chair.',
    ],
    durationMinutes: 5,
    reps: 3,
    sets: 2,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'heel_toe_walk',
    name: 'Heel-to-Toe Walk',
    category: 'balance',
    description: 'Walk in a straight line placing heel directly in front of toes.',
    instructions: [
      'Stand near a wall for support if needed.',
      'Place your right heel directly in front of your left toes.',
      'Look ahead (not down) and take 20 steps.',
      'Turn around and walk back.',
    ],
    durationMinutes: 5,
    fallRiskLevels: ['low', 'moderate'],
  },
  {
    key: 'seated_marching',
    name: 'Seated Marching',
    category: 'strength',
    description: 'March in place while seated to build leg strength safely.',
    instructions: [
      'Sit up straight in a firm chair.',
      'Lift your right knee as high as comfortable.',
      'Lower and lift your left knee.',
      'Continue alternating for 1–2 minutes.',
    ],
    durationMinutes: 5,
    reps: 20,
    sets: 2,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'wall_pushup',
    name: 'Wall Push-Up',
    category: 'strength',
    description: 'A gentle upper body strength exercise using a wall.',
    instructions: [
      'Stand arm\'s length from a wall.',
      'Place your palms flat against the wall at shoulder height.',
      'Bend your elbows and lean toward the wall.',
      'Push back to starting position.',
      'Keep your body straight throughout.',
    ],
    durationMinutes: 5,
    reps: 10,
    sets: 3,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'chair_squat',
    name: 'Chair Squat',
    category: 'strength',
    description: 'Sit-to-stand exercise that builds the leg strength needed for daily activities.',
    instructions: [
      'Sit at the edge of a sturdy chair.',
      'Cross your arms over your chest or place hands on knees.',
      'Lean slightly forward and stand up slowly.',
      'Pause, then sit back down slowly and with control.',
    ],
    durationMinutes: 5,
    reps: 10,
    sets: 2,
    fallRiskLevels: ['low', 'moderate'],
  },
  {
    key: 'seated_walk',
    name: 'Seated Walking (Chair Cardio)',
    category: 'cardio',
    description: 'Mimic walking movements while seated for a safe cardio workout.',
    instructions: [
      'Sit up straight in a firm chair.',
      'Swing your arms and march your feet as if walking.',
      'Gradually speed up to a comfortable pace.',
      'Continue for 5–10 minutes.',
    ],
    durationMinutes: 10,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'outdoor_walk',
    name: 'Outdoor Walk',
    category: 'cardio',
    description: 'A brisk 15-minute walk outside for cardiovascular health and mood.',
    instructions: [
      'Wear supportive, non-slip shoes.',
      'Start at a comfortable pace and warm up for 2 minutes.',
      'Pick up to a brisk pace — you should be able to talk but not sing.',
      'Cool down with 2 minutes of slow walking.',
    ],
    durationMinutes: 15,
    fallRiskLevels: ['low'],
  },
  {
    key: 'neck_stretch',
    name: 'Neck & Shoulder Stretch',
    category: 'flexibility',
    description: 'Gentle stretches to relieve tension and improve range of motion.',
    instructions: [
      'Sit up tall in a chair.',
      'Slowly tilt your right ear toward your right shoulder. Hold 15 seconds.',
      'Return to center and repeat on the left.',
      'Roll shoulders backward 5 times, then forward 5 times.',
    ],
    durationMinutes: 5,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'ankle_circles',
    name: 'Ankle Circles',
    category: 'flexibility',
    description: 'Improve ankle mobility to support balance and walking.',
    instructions: [
      'Sit in a chair and lift your right foot off the floor.',
      'Rotate your ankle clockwise 10 times.',
      'Then rotate counterclockwise 10 times.',
      'Switch to your left ankle and repeat.',
    ],
    durationMinutes: 3,
    reps: 10,
    fallRiskLevels: ['low', 'moderate', 'high'],
  },
  {
    key: 'calf_raise',
    name: 'Calf Raise',
    category: 'strength',
    description: 'Strengthen calf muscles to improve balance and ankle stability.',
    instructions: [
      'Stand behind a sturdy chair and hold the back lightly.',
      'Rise up on your toes as high as comfortable.',
      'Hold for 1 second, then slowly lower.',
      'Keep movements slow and controlled.',
    ],
    durationMinutes: 5,
    reps: 15,
    sets: 2,
    fallRiskLevels: ['low', 'moderate'],
  },
]

export function getExercisesForRiskLevel(level: 'low' | 'moderate' | 'high'): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.fallRiskLevels.includes(level))
}

export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.category === category)
}
