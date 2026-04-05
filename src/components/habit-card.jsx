import React, { useState, useEffect } from "react";
import { Check, Flame, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useAppToggleTask } from "@/hooks/use-habit-queries";
import { apiFetch, setToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ProgressBar } from "./ui-components";



function useGetHabitLog(habitId, { date }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const fetchData = async ({ background = false } = {}) => {
    if (!habitId) return background ? setIsRefetching(false) : setIsLoading(false);
    try {
      if (background) setIsRefetching(true); else setIsLoading(true);
      const res = await apiFetch(`/api/habits/${habitId}?date=${date}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null)
          setLocation('/')
          toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
          setIsError(true)
          return
        }
        throw new Error((json && json.error) || 'Failed to fetch habit log')
      }
      setData(json)
      setIsError(false)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      if (background) setIsRefetching(false); else setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitId, date])


  const refetch = () => fetchData({ background: true })

  return { data, isLoading, isError, isRefetching, refetch }
}

export function HabitCard({ habit, date = formatDate(new Date()), onHistoryUpdate }) {
  const { data: log, isLoading, isError, refetch } = useGetHabitLog(habit.id, { date });
  const toggleMutation = useAppToggleTask();

  const handleToggle = (index, currentStatus) => {
    if (toggleMutation.isLoading) return; // prevent concurrent toggles
    toggleMutation.mutate({
      id: habit.id,
      data: {
        itemIndex: index,
        completed: !currentStatus,
        date
      }
    }, {
      onSuccess: () => {
        // refetch latest log so UI reflects persisted state
        if (typeof refetch === 'function') refetch();
        // notify parent to refresh history/legend immediately
        if (typeof onHistoryUpdate === 'function') onHistoryUpdate();
      }
    });
  };

  const isFullyCompleted = log?.isFullyCompleted || false;
  const pct = log?.completionPercentage || 0;

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 md:p-6 transition-all duration-300 border-2",
      isFullyCompleted 
        ? "border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-primary/10" 
        : "border-border shadow-md hover:shadow-xl hover:border-primary/30"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground">{habit.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {log?.completedCount || 0} of {habit.checklistItems.length} tasks completed
          </p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
          habit.currentStreak > 0 ? "bg-orange-100 text-orange-700" : "bg-secondary text-muted-foreground"
        )}>
          <Flame size={16} className={habit.currentStreak > 0 ? "fill-orange-500" : ""} />
          {habit.currentStreak} Day{habit.currentStreak !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="mb-6">
        <ProgressBar progress={pct} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-10 bg-secondary animate-pulse rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle size={16} />
          <span className="text-sm">Failed to load today's log.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {(Array.isArray(habit.checklistItems) ? habit.checklistItems : []).map((itemText, index) => {
            // Find status in log, default false if log doesn't match
            const logItem = log?.items[index];
            const isCompleted = logItem?.completed || false;
            
            return (
              <div
                key={index}
                onClick={() => handleToggle(index, isCompleted)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer border",
                  isCompleted
                    ? "bg-primary/5 border-primary/20"
                    : "bg-white border-transparent"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0",
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : "border-muted-foreground/30 text-transparent"
                )}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className={cn(
                  "text-[15px] font-medium transition-all duration-200",
                  isCompleted ? "text-primary line-through opacity-70" : "text-foreground"
                )}>
                  {itemText}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}