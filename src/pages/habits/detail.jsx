import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { HabitCard } from "@/components/habit-card";
import { format, subDays, parseISO, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { ArrowLeft, Flame, Trophy, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

import { useState, useEffect, useRef, useCallback } from "react"
import { apiFetch, setToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function HabitDetail() {
  const params = useParams();
  const id = params.id || "";

  const { data: habit, isLoading } = useGetHabit(id);
  const { data: history, refetch: refetchHistory } = useGetHabitHistory(id, { days: 30 });

  if (isLoading) return <Layout><div className="animate-pulse h-64 bg-secondary rounded-xl" /></Layout>;
  if (!habit) return <Layout><div>Habit not found</div></Layout>;

  // Generate current month days array and padded display for a 7-col calendar
  const now = new Date();
  const start = startOfMonth(now);
  const daysInMonth = getDaysInMonth(now);
  const monthDays = Array.from({ length: daysInMonth }).map((_, i) => {
    const d = addDays(start, i);
    return format(d, 'yyyy-MM-dd');
  });

  // create padded array so the month aligns to weekdays in a 7-column grid
  const startPadding = start.getDay(); // 0 (Sun) - 6 (Sat)
  const displayDays = [
    ...Array(startPadding).fill(null),
    ...monthDays,
  ];
  // add trailing padding to complete the last week row
  while (displayDays.length % 7 !== 0) displayDays.push(null);

  // Normalize history dates into a map keyed by yyyy-MM-dd for reliable matching
  const normalizeDate = (d) => {
    if (!d) return d;
    try {
      const parsed = parseISO(d);
      if (isNaN(parsed.getTime())) return d;
      return format(parsed, 'yyyy-MM-dd');
    } catch (e) {
      return d;
    }
  };

  const historyMap = new Map((history || []).map(h => [normalizeDate(h.date), h]));

  // Live counts for legend (only include days up to today)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const legendCounts = monthDays.reduce((acc, d) => {
    if (d > todayStr) return acc; // skip future days
    const log = historyMap.get(d);
    if (log && log.isFullyCompleted) acc.perfect++;
    else if (log && log.completedCount > 0) acc.partial++;
    else acc.missed++;
    return acc;
  }, { missed: 0, partial: 0, perfect: 0 });

  // Compute streaks from history (based on consecutive fully-completed days)
  const computedCurrentStreak = (() => {
    if (!history || history.length === 0) return 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayIndex = monthDays.indexOf(todayStr);
    if (todayIndex === -1) return 0;
    const todayLog = historyMap.get(todayStr);
    if (!todayLog || !todayLog.isFullyCompleted) return 0;

    let streak = 0;
    for (let i = todayIndex; i >= 0; i--) {
      const d = monthDays[i];
      const log = historyMap.get(d);
      if (log && log.isFullyCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  const computedLongestStreak = (() => {
    if (!history || history.length === 0) return 0;
    let longest = 0;
    let run = 0;
    for (let i = 0; i < monthDays.length; i++) {
      const d = monthDays[i];
      const log = historyMap.get(d);
      if (log && log.isFullyCompleted) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    return longest;
  })();

  return (
    <Layout>
      <Link href="/habits" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors font-medium">
        <ArrowLeft size={16} className="mr-1" /> Back to Habits
      </Link>

      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">{habit.name}</h1>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-orange-50 border border-orange-100 text-orange-700 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
            <Flame size={20} className="fill-orange-500" />
            Current Streak: {computedCurrentStreak}
          </div>
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
            <Trophy size={20} className="fill-yellow-500" />
            Longest Streak: {computedLongestStreak}
          </div>
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
            <CheckCircleIcon />
            Total Completions: {habit.totalCompletions}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Today's Actions */}
        <section>
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Today's Checklist</h2>
          <HabitCard habit={habit} onHistoryUpdate={refetchHistory} />
        </section>

        {/* 30 Day Heatmap */}
        <section>
          <h2 className="text-2xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="text-primary" />
            30 Day History
          </h2>
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <div className="grid grid-cols-7 gap-2">
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground pb-2">{day}</div>
              ))}

              {displayDays.map((dateStr, idx) => {
                if (!dateStr) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className={cn(
                        "aspect-square rounded-md transition-all duration-200 border",
                        "bg-transparent border-transparent"
                      )}
                    />
                  );
                }

                const logForDay = historyMap.get(dateStr);
                const isComplete = logForDay?.isFullyCompleted;
                const isPartial = !isComplete && logForDay && logForDay.completedCount > 0;

                return (
                  <div 
                    key={dateStr}
                    title={`${dateStr}: ${logForDay?.completedCount || 0}/${habit.checklistItems.length} tasks`}
                    className={cn(
                      "aspect-square rounded-md transition-all duration-200 border",
                      isComplete ? "bg-primary border-primary shadow-sm scale-105" 
                      : isPartial ? "bg-primary/30 border-primary/40" 
                      : "bg-secondary border-border/50"
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-end gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-secondary border border-border/50"></div> Missed
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/30 border border-primary/40"></div> Partial
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary border border-primary"></div> Perfect
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function useGetHabit(habitId) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!habitId) return setIsLoading(false);
    const fetchHabit = async () => {
      try {
        setIsLoading(true)
        const res = await apiFetch(`/api/habits/${habitId}`)
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          if (res.status === 401) {
            setToken(null)
            setLocation('/')
            toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
            setIsError(true)
            return
          }
          throw new Error((json && json.error) || 'Failed')
        }
        setData(json)
      } catch (err) {
        console.error(err)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHabit()
  }, [habitId])

  return { data, isLoading, isError }
}

function useGetHabitHistory(habitId, { days = 30, pollInterval = 5000 } = {}) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mountedRef = useRef(true);

  const fetchHistory = useCallback(async ({ background = false } = {}) => {
    if (!habitId) return background ? setIsLoading(false) : setIsLoading(false);
    try {
      if (!background) setIsLoading(true);
      const res = await apiFetch(`/api/habits/${habitId}/history?days=${days}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null)
          setLocation('/')
          toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
          if (mountedRef.current) setIsError(true)
          return
        }
        throw new Error((json && json.error) || 'Failed')
      }
      if (mountedRef.current) setData(Array.isArray(json) ? json : [])
      if (mountedRef.current) setIsError(false)
    } catch (err) {
      console.error(err)
      if (mountedRef.current) setIsError(true)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [habitId, days, setLocation, toast])

  useEffect(() => {
    mountedRef.current = true;
    fetchHistory()
    let timer = null
    if (pollInterval > 0) {
      timer = setInterval(() => fetchHistory({ background: true }), pollInterval)
    }
    return () => {
      mountedRef.current = false;
      if (timer) clearInterval(timer)
    }
  }, [fetchHistory, pollInterval])

  const refetch = (opts = { background: true }) => fetchHistory(opts)

  return { data, isLoading, isError, refetch }
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );
}
