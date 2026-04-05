import { format } from "date-fns";
import { Layout } from "@/components/layout";
import { HabitCard } from "@/components/habit-card";
import { CheckCircle2, ListTodo, Target, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { setToken, apiFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";

import { useState, useEffect } from "react"

function useGetHabits() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchHabits = async ({ background = false } = {}) => {
    try {
      if (background) setIsRefetching(true); else setIsLoading(true)
      const res = await apiFetch("/api/habits")
      const json = await res.json()
      setData(json)
      setIsError(false)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      if (background) setIsRefetching(false); else setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = (opts = { background: true }) => fetchHabits(opts)

  return { data, isLoading, isError, isRefetching, refetch }
}

function useGetTodayAnalytics() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchAnalytics = async ({ background = false } = {}) => {
    try {
      if (background) setIsRefetching(true); else setIsLoading(true)
      const res = await apiFetch("/api/habits")
      const habits = await res.json()

      // For each habit, fetch today's log
      const today = formatDate(new Date())
      const logs = await Promise.all(habits.map(async (h) => {
        try {
          const r = await apiFetch(`/api/habits/${h.id}?date=${today}`)
          return await r.json()
        } catch (e) {
          return null
        }
      }))

      const totalHabits = habits.length
      let completedHabits = 0
      let totalTasksAvailable = 0
      let totalTasksCompleted = 0
      let completionSum = 0

      habits.forEach((h, idx) => {
        const log = logs[idx]
        const items = h.checklistItems || []
        const total = items.length
        const completed = log?.completedCount || 0
        const pct = log?.completionPercentage || 0

        totalTasksAvailable += total
        totalTasksCompleted += completed
        completionSum += pct
        if ((log && log.isFullyCompleted) || completed >= total) completedHabits += 1
      })

      const overallCompletionPercentage = totalHabits > 0 ? Math.round((completionSum / totalHabits) || 0) : 0

      setData({
        totalHabits,
        completedHabits,
        totalTasksAvailable,
        totalTasksCompleted,
        overallCompletionPercentage
      })
      setIsError(false)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      if (background) setIsRefetching(false); else setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = (opts = { background: true }) => fetchAnalytics(opts)

  return { data, isLoading, isError, isRefetching, refetch }
}

export default function Dashboard() {
  const todayStr = formatDate(new Date());
  const [, setLocation] = useLocation()
  const handleLogout = () => {
    setToken(null)
    setLocation('/')
  }
  
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useGetTodayAnalytics();
  const { data: habits, isLoading: habitsLoading, refetch: refetchHabits } = useGetHabits();

  return (
    <Layout>
      <header className="mb-10 relative">
        <button onClick={handleLogout} className="absolute top-0 right-0 mt-2 mr-2 inline-flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-xl shadow-sm hover:bg-slate-50">
          <LogOut size={16} />
          <span className="text-sm font-medium">Logout</span>
        </button>
        <p className="text-primary font-semibold mb-2 tracking-wide uppercase text-sm">
          {format(new Date(), "EEEE, MMMM do")}
        </p>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
          Today's Dashboard
        </h1>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        <StatCard 
          icon={<CheckCircle2 className="text-primary" size={24} />}
          label="Overall Progress"
          value={`${Math.round(analytics?.overallCompletionPercentage || 0)}%`}
          loading={analyticsLoading}
        />
        <StatCard 
          icon={<Target className="text-emerald-500" size={24} />}
          label="Habits Completed"
          value={`${analytics?.completedHabits || 0} / ${analytics?.totalHabits || 0}`}
          loading={analyticsLoading}
        />
        <StatCard 
          icon={<ListTodo className="text-blue-500" size={24} />}
          label="Tasks Done"
          value={`${analytics?.totalTasksCompleted || 0} / ${analytics?.totalTasksAvailable || 0}`}
          loading={analyticsLoading}
        />
      </div>

      {/* Habits List */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">Your Daily Habits</h2>
        
        {habitsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-secondary animate-pulse rounded-2xl" />)}
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                date={todayStr}
                onHistoryUpdate={() => {
                  if (typeof refetchAnalytics === 'function') refetchAnalytics();
                  if (typeof refetchHabits === 'function') refetchHabits();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-border p-12 text-center flex flex-col items-center">
            <img 
              src={`${import.meta.env.BASE_URL}images/empty-habits.png`} 
              alt="No habits yet" 
              className="w-48 h-48 opacity-80 mix-blend-multiply mb-6"
            />
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">No habits tracked yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">Create your first habit to start building streaks and tracking your daily progress.</p>
            <a href="/habits" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Create a Habit
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
           <div className="h-8 w-16 bg-secondary animate-pulse rounded mt-1" />
        ) : (
           <p className="text-2xl font-display font-bold text-foreground transition-opacity duration-300">{value}</p>
        )}
      </div>
    </div>
  );
}