import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Droplets, Utensils, Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getToday } from '../lib/storage'
import type { FoodEntry } from '../lib/types'

export function NutritionPage() {
  const { user, appData, updateAppData, recordNutritionPercent } = useAuth()
  const today = getToday()
  const dayLog = useMemo(
    () => appData?.foodLog?.find((f) => f.date === today),
    [appData?.foodLog, today]
  )
  const foodLog = dayLog?.entries ?? []
  const sortedFoodLog = useMemo(
    () => [...foodLog].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')),
    [foodLog]
  )

  const totalCalories = useMemo(() => foodLog.reduce((sum, e) => sum + e.calories, 0), [foodLog])
  const calorieGoal = user?.dailyCalorieGoal ?? 2200
  const nutritionPercent = useMemo(
    () => (calorieGoal > 0 ? Math.min(100, (totalCalories / calorieGoal) * 100) : 0),
    [totalCalories, calorieGoal]
  )

  useEffect(() => {
    recordNutritionPercent(nutritionPercent)
  }, [nutritionPercent])

  const macroData = useMemo(() => {
    let protein = 0,
      carbs = 0,
      fats = 0
    foodLog.forEach((e) => {
      protein += parseInt(e.protein, 10) || 0
      carbs += parseInt(e.carbs, 10) || 0
      fats += parseInt(e.fats, 10) || 0
    })
    const total = protein + carbs + fats || 1
    return [
      { name: 'Protein', value: Math.round((protein / total) * 100) || 33, color: '#A8E6CF' },
      { name: 'Carbs', value: Math.round((carbs / total) * 100) || 34, color: '#81ECEC' },
      { name: 'Fats', value: Math.round((fats / total) * 100) || 33, color: '#55EFC4' },
    ]
  }, [foodLog])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    time: '',
    meal: 'Breakfast',
    food: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  })

  const getTimeNow = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault()
    const timeValue = newEntry.time && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(newEntry.time) ? newEntry.time : getTimeNow()
    const entry: FoodEntry = {
      id: String(Date.now()),
      time: timeValue,
      meal: newEntry.meal,
      food: newEntry.food,
      calories: parseInt(newEntry.calories, 10) || 0,
      protein: `${newEntry.protein}g`,
      carbs: `${newEntry.carbs}g`,
      fats: `${newEntry.fats}g`,
    }
    updateAppData((prev) => {
      const rest = prev.foodLog.filter((f) => f.date !== today)
      const current = prev.foodLog.find((f) => f.date === today)
      const entries = current ? [...current.entries, entry] : [entry]
      return { ...prev, foodLog: [...rest, { date: today, entries }] }
    })
    setShowAddModal(false)
    setNewEntry({
      time: '',
      meal: 'Breakfast',
      food: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
    })
  }

  const removeEntry = (id: string) => {
    updateAppData((prev) => {
      const rest = prev.foodLog.filter((f) => f.date !== today)
      const current = prev.foodLog.find((f) => f.date === today)
      if (!current) return prev
      const entries = current.entries.filter((e) => e.id !== id)
      if (entries.length === 0) return { ...prev, foodLog: rest }
      return { ...prev, foodLog: [...rest, { date: today, entries }] }
    })
  }

  const caloriesProgress = calorieGoal > 0 ? Math.min(100, (totalCalories / calorieGoal) * 100) : 0

  return (
    <div className="space-y-8 pb-8 relative">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Nutrition</h1>
        <p className="text-[var(--text-secondary)] mt-1">Your daily nutrition breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)]"
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Macronutrient Balance</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 10 }}
                    contentStyle={{ zIndex: 10 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-lg">
                          {payload.map((entry, idx) => (
                            <div key={String(entry.name ?? idx)} className="flex items-center gap-2 text-[var(--text-primary)]">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (entry as { color?: string }).color }} />
                              <span>{(entry as { name?: string }).name}: {(entry as { value?: number }).value}%</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <span className="text-2xl font-bold text-[var(--text-primary)]">{totalCalories}</span>
                <span className="text-xs text-[var(--text-secondary)]">kcal</span>
              </div>
            </div>
            <div className="space-y-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{macro.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{macro.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-[var(--border)] flex flex-col justify-between"
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Daily Summary</h3>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[var(--text-primary)]">Calories</span>
                <span className="text-[var(--text-secondary)]">
                  {totalCalories} / {calorieGoal}
                </span>
              </div>
              <div className="h-3 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${caloriesProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-[var(--accent)] rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Water Intake</p>
                  <p className="text-xs text-[var(--text-secondary)]">Track in Profile</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Meals Logged</p>
                  <p className="text-xs text-[var(--text-secondary)]">{foodLog.length} items today</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">{foodLog.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden"
      >
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Today's Food Log</h3>
          <button
            onClick={() => {
              setNewEntry((prev) => ({ ...prev, time: getTimeNow() }))
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Food
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-primary)] text-[var(--text-secondary)] font-medium">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Meal</th>
                <th className="px-6 py-4">Food</th>
                <th className="px-6 py-4 text-right">Calories</th>
                <th className="px-6 py-4 text-right hidden sm:table-cell">Protein</th>
                <th className="px-6 py-4 text-right hidden sm:table-cell">Carbs</th>
                <th className="px-6 py-4 text-right hidden sm:table-cell">Fats</th>
                <th className="px-6 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sortedFoodLog.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{item.time}</td>
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{item.meal}</td>
                  <td className="px-6 py-4 text-[var(--text-primary)]">{item.food}</td>
                  <td className="px-6 py-4 text-right font-medium text-[var(--text-primary)]">{item.calories}</td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)] hidden sm:table-cell">
                    {item.protein}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)] hidden sm:table-cell">
                    {item.carbs}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)] hidden sm:table-cell">
                    {item.fats}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => removeEntry(item.id)}
                      className="text-[var(--text-secondary)] hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {foodLog.length === 0 && (
            <p className="px-6 py-8 text-center text-[var(--text-secondary)]">No entries yet. Add food to track your intake.</p>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Add Food Entry</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Time</label>
                    <input
                      type="time"
                      value={newEntry.time}
                      onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Meal</label>
                    <select
                      value={newEntry.meal}
                      onChange={(e) => setNewEntry({ ...newEntry, meal: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Food Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Avocado Toast"
                    value={newEntry.food}
                    onChange={(e) => setNewEntry({ ...newEntry, food: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Cals</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEntry.calories}
                      onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Prot (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEntry.protein}
                      onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Carb (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEntry.carbs}
                      onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Fat (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newEntry.fats}
                      onChange={(e) => setNewEntry({ ...newEntry, fats: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--text-primary)] font-bold hover:opacity-90 transition-opacity"
                  >
                    Add Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
