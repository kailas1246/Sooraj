import { Layout } from "@/components/layout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { useState, useEffect } from "react"
import { apiFetch, setToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function useGetHabits() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const res = await apiFetch("/api/habits")
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          if (res.status === 401) {
            setToken(null)
            setLocation('/')
            toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
          }
          setData([])
          setIsError(true)
          return
        }
        setData(Array.isArray(json) ? json : [])
      } catch (err) {
        console.error(err)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHabits()
  }, [])

  return { data, isLoading, isError }
}

function useGetWeeklyAnalytics() {
  const [data, setData] = useState({ dailyCompletions: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const res = await apiFetch('/api/habits')
        const habits = await res.json().catch(() => null)
        if (!res.ok) {
          if (res.status === 401) {
            setToken(null)
            setLocation('/')
            toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
            setIsError(true)
            return
          }
          throw new Error((habits && habits.error) || 'Failed')
        }

        const days = 7
        // build dates array
        const dates = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          dates.push(`${yyyy}-${mm}-${dd}`)
        }

        // fetch histories per habit
        const histories = await Promise.all(habits.map(async (h) => {
          const r = await apiFetch(`/api/habits/${h.id}/history?days=${days}`)
          const j = await r.json().catch(() => null)
          if (!r.ok) return []
          return Array.isArray(j) ? j : []
        }))

        // compute per-date completion percentage (average across habits)
        const dailyCompletions = dates.map((dateStr, idx) => {
          let sumPct = 0
          let count = 0
          histories.forEach((hist, hi) => {
            const log = hist.find(l => l.date === dateStr)
            if (log) {
              sumPct += (log.completionPercentage || 0)
              count++
            } else {
              // if no log, treat as 0
              sumPct += 0
              count++
            }
          })
          const completionPercentage = count > 0 ? Math.round(sumPct / count) : 0
          return { date: dateStr, completionPercentage }
        })

        setData({ dailyCompletions })
      } catch (err) {
        console.error(err)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return { data, isLoading, isError }
}

function useGetMonthlyAnalytics() {
  const [data, setData] = useState({ dailyCompletions: [], habitSuccessRates: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const res = await apiFetch('/api/habits')
        const habits = await res.json().catch(() => null)
        if (!res.ok) {
          if (res.status === 401) {
            setToken(null)
            setLocation('/')
            toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
            setIsError(true)
            return
          }
          throw new Error((habits && habits.error) || 'Failed')
        }

        const days = 30
        const dates = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          dates.push(`${yyyy}-${mm}-${dd}`)
        }

        const histories = await Promise.all(habits.map(async (h) => {
          const r = await apiFetch(`/api/habits/${h.id}/history?days=${days}`)
          const j = await r.json().catch(() => null)
          if (!r.ok) return []
          return Array.isArray(j) ? j : []
        }))

        // daily aggregated completedHabits
        const dailyCompletions = dates.map(dateStr => {
          let completedHabits = 0
          histories.forEach(hist => {
            const log = hist.find(l => l.date === dateStr)
            if (log && log.isFullyCompleted) completedHabits++
          })
          return { date: dateStr, completedHabits }
        })

        // habit success rates over month
        const habitSuccessRates = habits.map((h, idx) => {
          const hist = histories[idx] || []
          const completedDays = hist.filter(l => l.isFullyCompleted).length
          const totalDays = days
          const successRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0
          return {
            habitId: h.id,
            habitName: h.name,
            completedDays,
            totalDays,
            successRate
          }
        }).sort((a,b) => b.successRate - a.successRate)

        setData({ dailyCompletions, habitSuccessRates })
      } catch (err) {
        console.error(err)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return { data, isLoading, isError }
}

export default function Analytics() {
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyAnalytics();
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyAnalytics();

  const primaryColor = '#800000'; // Maroon

  const weeklyData = {
    labels: weekly?.dailyCompletions.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
    datasets: [
      {
        label: 'Completion %',
        data: weekly?.dailyCompletions.map(d => d.completionPercentage) || [],
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}20`, // 20% opacity
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: primaryColor,
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const monthlyData = {
    labels: monthly?.dailyCompletions.map(d => new Date(d.date).getDate().toString()) || [],
    datasets: [
      {
        label: 'Habits Completed',
        data: monthly?.dailyCompletions.map(d => d.completedHabits) || [],
        backgroundColor: primaryColor,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: { family: 'Inter', size: 14 },
        bodyFont: { family: 'Inter', size: 14 },
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
      }
    }
  };

  return (
    <Layout>
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground text-lg">Visualize your progress over time.</p>
      </header>

      <div className="space-y-8">
        {/* Weekly Chart */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Past 7 Days Success Rate</h2>
          <div className="h-[300px] w-full">
            {weeklyLoading ? (
              <div className="w-full h-full bg-secondary animate-pulse rounded-xl" />
            ) : (
              <Line data={weeklyData} options={{...chartOptions, scales: { y: { max: 100, beginAtZero: true } }}} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Bar Chart */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">This Month's Daily Habits</h2>
            <div className="h-[300px] w-full">
              {monthlyLoading ? (
                 <div className="w-full h-full bg-secondary animate-pulse rounded-xl" />
              ) : (
                <Bar data={monthlyData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">Habit Success Rates (Month)</h2>
            {monthlyLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-secondary animate-pulse rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="py-3 font-semibold text-muted-foreground">Habit</th>
                      <th className="py-3 font-semibold text-muted-foreground">Days Hit</th>
                      <th className="py-3 font-semibold text-muted-foreground">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly?.habitSuccessRates.map((h) => (
                      <tr key={h.habitId} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                        <td className="py-4 font-medium text-foreground">{h.habitName}</td>
                        <td className="py-4 text-muted-foreground">{h.completedDays} / {h.totalDays}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{Math.round(h.successRate)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {monthly?.habitSuccessRates.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">No data for this month yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
