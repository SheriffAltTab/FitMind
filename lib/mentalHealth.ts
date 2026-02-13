import type { LucideIcon } from 'lucide-react'
import { Wind, Moon, Heart, Headphones } from 'lucide-react'

export type MindfulnessIconName = 'Wind' | 'Moon' | 'Heart' | 'Headphones'

const ICON_MAP: Record<MindfulnessIconName, LucideIcon> = {
  Wind,
  Moon,
  Heart,
  Headphones,
}

/** Serializable shape for storage (no React components). */
export interface MindfulnessSessionStored {
  id: string
  title: string
  type: string
  durationMinutes: number
  duration: string
  iconName: MindfulnessIconName
  color: string
  description: string
  benefits: string[]
  instructions: string[]
  audioUrl?: string
}

export interface MindfulnessSession {
  id: string
  title: string
  type: string
  durationMinutes: number
  duration: string
  icon: LucideIcon
  color: string
  description: string
  benefits: string[]
  instructions: string[]
  audioUrl?: string
}

export function storedSessionToUI(stored: MindfulnessSessionStored): MindfulnessSession {
  const { iconName, ...rest } = stored
  return {
    ...rest,
    icon: ICON_MAP[iconName] ?? Wind,
  }
}

/** Default sessions in storage shape; used as fallback when nothing is stored. */
export const sessionsStoredDefault: MindfulnessSessionStored[] = [
  {
    id: 'deep-breathing',
    title: 'Deep Breathing',
    type: 'Breathing',
    durationMinutes: 10,
    duration: '10 min',
    iconName: 'Wind',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    description:
      'A simple yet powerful breathing technique to reduce stress and anxiety immediately.',
    benefits: ['Lowers cortisol', 'Improves focus', 'Calms nervous system'],
    instructions: ['Find a comfortable seat', 'Inhale for 4 counts', 'Hold for 4 counts', 'Exhale for 4 counts'],
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    type: 'Meditation',
    durationMinutes: 15,
    duration: '15 min',
    iconName: 'Heart',
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
    description: 'Systematically bring awareness to different parts of your body to release tension.',
    benefits: ['Increases body awareness', 'Reduces physical tension', 'Promotes relaxation'],
    instructions: ['Lie down comfortably', 'Close your eyes', 'Focus on your toes', 'Slowly move attention up'],
  },
  {
    id: 'sleep-stories',
    title: 'Sleep Stories',
    type: 'Sleep',
    durationMinutes: 25,
    duration: '25 min',
    iconName: 'Moon',
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
    description: 'Drift off to sleep with this calming narrative designed to quiet your mind.',
    benefits: ['Faster sleep onset', 'Deeper sleep', 'Reduced racing thoughts'],
    instructions: ['Get into bed', 'Turn off lights', 'Listen and visualize', 'Let go of the day'],
  },
  {
    id: 'morning-gratitude',
    title: 'Morning Gratitude',
    type: 'Mindfulness',
    durationMinutes: 5,
    duration: '5 min',
    iconName: 'Headphones',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    description: "Start your day with a positive mindset by focusing on what you're grateful for.",
    benefits: ['Boosts mood', 'Increases resilience', 'Improves outlook'],
    instructions: ['Sit comfortably', 'Think of 3 things', 'Feel the appreciation', 'Carry it with you'],
  },
  {
    id: 'anxiety-release',
    title: 'Anxiety Release',
    type: 'Meditation',
    durationMinutes: 20,
    duration: '20 min',
    iconName: 'Wind',
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400',
    description: 'Guided meditation to help you navigate and release feelings of anxiety.',
    benefits: ['Emotional regulation', 'Panic reduction', 'Grounding'],
    instructions: ['Find a quiet space', 'Acknowledge feelings', 'Breathe through them', 'Visualize release'],
  },
  {
    id: 'focus-flow',
    title: 'Focus Flow',
    type: 'Mindfulness',
    durationMinutes: 15,
    duration: '15 min',
    iconName: 'Headphones',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    description: 'Enhance your concentration and mental clarity with this mindfulness practice.',
    benefits: ['Improved attention', 'Mental clarity', 'Productivity boost'],
    instructions: ['Eliminate distractions', 'Focus on breath', 'Notice wandering mind', 'Gently return focus'],
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    type: 'Meditation',
    durationMinutes: 12,
    duration: '12 min',
    iconName: 'Heart',
    color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400',
    description: 'Cultivate compassion for yourself and others with this guided loving-kindness meditation.',
    benefits: ['Self-compassion', 'Reduced anger', 'Emotional warmth'],
    instructions: ['Sit with eyes closed', 'Wish yourself well', 'Extend to others', 'Rest in kindness'],
  },
  {
    id: 'power-nap',
    title: 'Power Nap Recharge',
    type: 'Sleep',
    durationMinutes: 15,
    duration: '15 min',
    iconName: 'Moon',
    color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400',
    description: 'A short guided rest to recharge your energy without falling into deep sleep.',
    benefits: ['Quick energy boost', 'Improved alertness', 'No grogginess'],
    instructions: ['Set a 15-min timer', 'Lie down or recline', 'Follow the voice', 'Wake gently'],
  },
  {
    id: 'stress-melt',
    title: 'Stress Melt',
    type: 'Breathing',
    durationMinutes: 8,
    duration: '8 min',
    iconName: 'Wind',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    description: 'Release physical and mental tension with extended exhales and body awareness.',
    benefits: ['Lower stress hormones', 'Muscle relaxation', 'Mental clarity'],
    instructions: ['Exhale longer than inhale', 'Scan for tension', 'Breathe into tight spots', 'Let go'],
  },
  {
    id: 'mindful-walk',
    title: 'Mindful Walk',
    type: 'Mindfulness',
    durationMinutes: 10,
    duration: '10 min',
    iconName: 'Headphones',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400',
    description: 'Audio-guided walking meditation to ground you in the present moment.',
    benefits: ['Grounding', 'Sensory awareness', 'Calm focus'],
    instructions: ['Walk slowly', 'Notice each step', 'Feel the air', 'Stay present'],
  },
  {
    id: 'sleep-wind-down',
    title: 'Sleep Wind Down',
    type: 'Sleep',
    durationMinutes: 20,
    duration: '20 min',
    iconName: 'Moon',
    color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    description: 'Evening routine to signal your body it is time to sleep.',
    benefits: ['Faster sleep onset', 'Better sleep quality', 'Relaxed mind'],
    instructions: ['Dim the lights', 'Follow the prompts', 'Release the day', 'Drift off'],
  },
  {
    id: 'panic-calm',
    title: 'Panic Calm',
    type: 'Breathing',
    durationMinutes: 5,
    duration: '5 min',
    iconName: 'Wind',
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    description: 'Emergency short practice to slow your nervous system during high anxiety.',
    benefits: ['Rapid calming', 'Slower heart rate', 'Clearer thinking'],
    instructions: ['Find a safe spot', 'Long exhales', 'Name what you feel', 'Stay with breath'],
  },
]

export const sessions: MindfulnessSession[] = sessionsStoredDefault.map(storedSessionToUI)
