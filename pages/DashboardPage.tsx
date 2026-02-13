import React, { useState, useMemo, useId } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import {
  ArrowUp,
  ArrowDown,
  Sparkles,
  Activity,
  Target,
  Zap,
  Pencil,
  Check,
  X,
  Info,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getToday, getTopPercentFromAllUsers } from '../lib/storage'
import { WORKOUTS_FOR_FULL, MINDFULNESS_FOR_FULL } from '../lib/types'

function getWeekDays(): string[] {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

/** Returns 4 rows × 7 cols: rows = weeks (oldest first), cols = Mon..Sun. */
function getLast4WeeksGrid(): { date: string; row: number; col: number }[] {
  const today = new Date()
  const dayOfWeek = (today.getDay() + 6) % 7
  const mondayOfThisWeek = new Date(today)
  mondayOfThisWeek.setDate(today.getDate() - dayOfWeek)
  const out: { date: string; row: number; col: number }[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const d = new Date(mondayOfThisWeek)
      d.setDate(mondayOfThisWeek.getDate() - (3 - row) * 7 + col)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      out.push({ date, row, col })
    }
  }
  return out
}

const BMI_TOOLTIP = (
  <div className="space-y-2">
    <p>Body Mass Index (BMI) = weight (kg) ÷ height² (m). It indicates how your weight corresponds to your height.</p>
    <p>Normal: 18.5–24.9.</p>
    <p>Below 18.5: underweight.</p>
    <p>25–29.9: overweight.</p>
    <p>30 and above: obese.</p>
  </div>
)

type SparklinePoint = { date?: string; value: number }

const StatCard = ({
  label,
  value,
  subValue,
  change,
  changeTooltip,
  trend,
  badgeColor,
  icon: Icon,
  delay,
  onEdit,
  sparklineData,
  valueTooltip,
  chartValueLabel,
  bottomContent,
}: {
  label: string
  value: string | number
  subValue?: string
  change?: string
  changeTooltip?: string
  trend?: 'up' | 'down' | null
  badgeColor?: 'red' | 'green' | 'orange'
  icon: React.ComponentType<{ className?: string }>
  delay: number
  onEdit?: (newVal: string) => void
  sparklineData?: SparklinePoint[]
  valueTooltip?: React.ReactNode
  chartValueLabel?: string
  bottomContent?: React.ReactNode
}) => {
  const id = useId()
  const gradientId = `gradient-${label.replace(/\s/g, '')}-${id.replace(/:/g, '')}`
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value).replace(/[^0-9.]/g, ''))
  const handleSave = () => {
    if (onEdit) onEdit(editValue)
    setIsEditing(false)
  }
  const data = sparklineData ?? [{ value: 0 }, { value: 10 }, { value: 0 }]
  const dataMax = Math.max(...data.map((d) => d.value), 1)
  const yDomain: [number, number] = [0, Math.max(50, dataMax + 15)]
  const chartKey = `spark-${data.map((d) => d.value).join('-')}`

  const renderChartTooltip = (props: { active?: boolean; payload?: Array<{ payload?: SparklinePoint }> }) => {
    if (!props.active || !props.payload?.[0]?.payload || !chartValueLabel) return null
    const p = props.payload[0].payload
    const dateStr = p.date ? new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
    const valueStr =
      chartValueLabel === 'Weight'
        ? `${p.value} kg`
        : chartValueLabel === 'Rank'
          ? `${Math.round(p.value)} pts`
          : chartValueLabel === 'Streak'
            ? `${Math.round(p.value)} days`
            : String(p.value.toFixed(1))
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm shadow-lg">
        <div className="text-[var(--text-primary)] font-medium">{dateStr}</div>
        <div className="text-[var(--text-secondary)]">{chartValueLabel}: {valueStr}</div>
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)] relative overflow-visible group hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-2 py-1 text-lg font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)]"
                autoFocus
              />
              <button onClick={handleSave} className="p-1 rounded-full bg-[var(--accent)] text-[var(--text-primary)]">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-full bg-red-100 text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{value}</h3>
                {valueTooltip != null && (
                  <span className="relative inline-flex cursor-help text-[var(--text-secondary)] opacity-70 hover:opacity-100 group/tip">
                    <Info className="w-4 h-4" />
                    <span className="absolute left-full top-0 ml-2 mt-1 hidden group-hover/tip:block z-50 w-72 p-3 text-sm font-normal text-left text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg whitespace-normal" style={{ top: '0.25rem' }}>
                      {valueTooltip}
                    </span>
                  </span>
                )}
              </div>
              {subValue && <span className="text-sm text-[var(--text-secondary)]">{subValue}</span>}
              {onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-primary)] rounded-full text-[var(--text-secondary)]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {change != null && (
          <span
            className={`relative inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full cursor-default group/badge ${
              badgeColor === 'red'
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : badgeColor === 'orange'
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                  : badgeColor === 'green' || (!badgeColor && trend === 'up')
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : trend === null
                      ? 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}
            title={changeTooltip}
          >
            {changeTooltip && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/badge:block z-50 w-40 p-2 text-center text-xs font-normal text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg whitespace-nowrap">
                {changeTooltip}
              </span>
            )}
            {trend === 'up' && <ArrowUp className="w-3 h-3" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <div className="h-16 -mx-2">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={yDomain} hide />
            {chartValueLabel && <Tooltip content={renderChartTooltip} cursor={{ stroke: 'var(--border)' }} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              {...(chartValueLabel
                ? {
                    dot: { r: 4, fill: 'var(--accent)', strokeWidth: 1, stroke: 'var(--bg-card)' },
                    activeDot: { r: 5, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--bg-card)' },
                  }
                : {})}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {bottomContent && <div className="mt-3">{bottomContent}</div>}
    </motion.div>
  )
}

const ProgressRing = ({
  percentage,
  color,
  label,
  delay,
}: {
  percentage: number
  color: string
  label: string
  delay: number
}) => {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r={radius} stroke="var(--border-light)" strokeWidth="8" fill="transparent" />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: delay + 0.2 }}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-lg font-bold text-[var(--text-primary)]">{Math.round(percentage)}%</span>
      </div>
      <span className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{label}</span>
    </motion.div>
  )
}

export function DashboardPage() {
  const { user, appData, updateUser, updateAppData, getRankName } = useAuth()
  const [weight, setWeight] = useState(user?.weight ?? 70)
  const [hoveredDay, setHoveredDay] = useState<{ date: string; workouts: string[]; isToday: boolean } | null>(null)

  const heightM = (user?.height ?? 170) / 100
  const bmi = weight / (heightM * heightM)
  const bmiFormatted = bmi.toFixed(1)

  const handleWeightUpdate = (newWeight: string) => {
    const w = parseFloat(newWeight)
    if (!isNaN(w) && w > 0) {
      setWeight(w)
      updateUser({ weight: w })
    }
  }

  const today = getToday()

  const workoutsPercent = appData
    ? Math.min(100, (appData.workoutsCompletedToday / WORKOUTS_FOR_FULL) * 100)
    : 0
  const mindfulnessPercent = appData
    ? Math.min(100, (appData.mindfulnessCompletedToday / MINDFULNESS_FOR_FULL) * 100)
    : 0
  const nutritionPercent = appData?.nutritionPercentToday ?? 0

  const xpForLevel = (appData?.level ?? 1) * 100
  const xpInLevel = (appData?.xp ?? 0) % xpForLevel
  const xpProgress = xpForLevel > 0 ? (xpInLevel / xpForLevel) * 100 : 0


  const weekDayLabels = getWeekDays()
  const heatmapCells = useMemo(() => getLast4WeeksGrid(), [today])

  const rankPoints = appData?.rankPoints ?? 0
  const rankName = getRankName(rankPoints)
  const streak = Math.max(1, appData?.streak ?? 0)
  const highestStreak = Math.max(1, appData?.highestStreak ?? 0)
  const topPercent = useMemo(() => getTopPercentFromAllUsers(rankPoints), [rankPoints])

  const weightHistory = appData?.weightHistory ?? []

  const weightChange = useMemo((): {
    changeText: string
    changeTooltip: string | undefined
    trend: 'up' | 'down' | null
  } => {
    if (weightHistory.length < 2) return { changeText: '—', changeTooltip: undefined, trend: null }
    const prev = weightHistory[weightHistory.length - 2].weight
    const curr = weight
    const changeKg = curr - prev
    const changePercent = prev !== 0 ? (changeKg / prev) * 100 : 0
    const sign = changeKg > 0 ? '+' : ''
    const trend: 'up' | 'down' | null = changeKg > 0 ? 'up' : changeKg < 0 ? 'down' : null
    const changeText = changePercent === 0 ? '0%' : `${sign}${changePercent.toFixed(1)}%`
    const changeTooltip =
      changeKg > 0 ? `Gained ${changeKg.toFixed(1)} kg` : changeKg < 0 ? `Lost ${Math.abs(changeKg).toFixed(1)} kg` : 'No change'
    return { changeText, changeTooltip, trend }
  }, [weightHistory, weight])

  const sparklineFromWeight = useMemo((): SparklinePoint[] => {
    const history = weightHistory.slice(-7)
    if (history.length === 0) return [{ date: today, value: weight }]
    return history.map((h) => ({ date: h.date, value: h.weight }))
  }, [weightHistory, weight, today])

  const sparklineFromBmi = useMemo((): SparklinePoint[] => {
    const history = weightHistory.slice(-7)
    const heightSq = heightM * heightM
    const currentBmi = weight / heightSq
    if (history.length === 0) return [{ date: today, value: currentBmi }]
    return history.map((h) => ({ date: h.date, value: h.weight / heightSq }))
  }, [weightHistory, weight, heightM, today])

  const sparklineFromStreak = useMemo((): SparklinePoint[] => {
    const history = (appData?.streakHistory ?? []).slice(-7)
    if (history.length === 0) return [{ date: today, value: streak }]
    return history.map((h) => ({ date: h.date, value: h.value }))
  }, [appData?.streakHistory, streak, today])

  const sparklineFromRank = useMemo((): SparklinePoint[] => {
    const history = (appData?.rankHistory ?? []).slice(-7)
    if (history.length === 0) return [{ date: today, value: rankPoints }]
    return history.map((h) => ({ date: h.date, value: h.value }))
  }, [appData?.rankHistory, rankPoints, today])

  const bmiCategory = useMemo((): { label: string; trend: 'up' | 'down' | null; badgeColor: 'red' | 'green' | 'orange' } => {
    if (bmi < 18.5) return { label: 'Underweight', trend: 'up', badgeColor: 'red' }
    if (bmi < 25) return { label: 'Normal', trend: null, badgeColor: 'green' }
    if (bmi < 30) return { label: 'Overweight', trend: 'down', badgeColor: 'orange' }
    return { label: 'Obese', trend: 'down', badgeColor: 'red' }
  }, [bmi])

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Good morning, {user?.name ?? 'User'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="BMI"
          value={bmiFormatted}
          trend={bmiCategory.trend}
          badgeColor={bmiCategory.badgeColor}
          change={bmiCategory.label}
          icon={Activity}
          delay={0.1}
          sparklineData={sparklineFromBmi}
          valueTooltip={BMI_TOOLTIP}
          chartValueLabel="BMI"
        />
        <StatCard
          label="Weight"
          value={weight}
          subValue="kg"
          trend={weightChange.trend}
          change={weightChange.changeText}
          changeTooltip={weightChange.changeTooltip}
          badgeColor={weightChange.trend === 'up' ? 'green' : weightChange.trend === 'down' ? 'red' : undefined}
          icon={Target}
          delay={0.2}
          onEdit={handleWeightUpdate}
          sparklineData={sparklineFromWeight}
          chartValueLabel="Weight"
        />
        <StatCard
          label="Streak"
          value={streak}
          subValue="days"
          trend="up"
          change={`Highest Score: ${highestStreak}`}
          icon={Zap}
          delay={0.3}
          sparklineData={sparklineFromStreak}
          chartValueLabel="Streak"
        />
        <StatCard
          label="Rank"
          value={rankName}
          subValue={`${rankPoints} pts`}
          trend="up"
          change={`Top ${topPercent}%`}
          icon={Sparkles}
          delay={0.4}
          sparklineData={sparklineFromRank}
          chartValueLabel="Rank"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Weekly Activity</h3>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-10" />
                <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-40" />
                <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-70" />
                <div className="w-3 h-3 rounded-sm bg-[var(--accent)] opacity-100" />
              </div>
              <span>More</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 relative">
            {weekDayLabels.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[var(--text-secondary)] mb-2">
                {day}
              </div>
            ))}
            {heatmapCells.map((cell, i) => {
              const workoutsThisDay = appData?.workoutsByDay?.[cell.date] ?? []
              const count = workoutsThisDay.length
              const isToday = cell.date === today
              const opacity = count === 0 ? 0.1 : Math.min(1, 0.2 + (count / 4) * 0.8)
              return (
                <motion.div
                  key={`${cell.date}-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.01 }}
                  className="aspect-square rounded-md bg-[var(--accent)] relative group cursor-default"
                  style={{ opacity: isToday ? Math.max(opacity, 0.5) : opacity }}
                  onMouseEnter={() => setHoveredDay({ date: cell.date, workouts: workoutsThisDay, isToday })}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {hoveredDay?.date === cell.date && (
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 z-20 ml-3 min-w-[200px] py-4 px-4 rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--bg-card)] text-left pointer-events-none shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]"
                    >
                      <div className="text-base font-bold text-[var(--text-primary)] mb-2">
                        {hoveredDay.isToday ? 'Today' : new Date(hoveredDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      {hoveredDay.workouts.length > 0 ? (
                        <ul className="space-y-1.5 text-sm text-[var(--text-primary)] font-medium">
                          {hoveredDay.workouts.map((w) => (
                            <li key={w} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[var(--text-primary)] font-medium opacity-90">
                          {hoveredDay.isToday ? 'No workouts yet today' : 'No workouts'}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)] flex flex-col"
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Your Progress</h3>
          <div className="flex justify-between items-center mb-8">
            <ProgressRing percentage={workoutsPercent} color="#A8E6CF" label="Workouts" delay={0.7} />
            <ProgressRing percentage={mindfulnessPercent} color="#81ECEC" label="Mindfulness" delay={0.8} />
            <ProgressRing percentage={nutritionPercent} color="#55EFC4" label="Nutrition" delay={0.9} />
          </div>
          <div className="mt-auto pt-6 border-t border-[var(--border)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Level {appData?.level ?? 1}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {appData?.xp ?? 0} / {(appData?.level ?? 1) * 100} XP
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, delay: 1 }}
                className="h-full bg-[var(--accent)] rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
