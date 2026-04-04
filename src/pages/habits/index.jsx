import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button, Input, Dialog } from "@/components/ui-components";
import { useAppCreateHabit, useAppDeleteHabit } from "@/hooks/use-habit-queries";
import { Link } from "wouter";
import { Plus, Trash2, Edit2, ChevronRight, X } from "lucide-react";

import { useEffect } from "react"
import { apiFetch, setToken } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function useGetHabits() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchData = async ({ background = false } = {}) => {
    try {
      if (!background) setIsLoading(true);
      const res = await apiFetch("http://localhost:5000/api/habits")
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          // not authorized - clear token and redirect to login
          setToken(null)
          setLocation('/')
          toast({ title: 'Not authorized', description: 'Please sign in again', variant: 'destructive' })
          setData([])
          setIsError(true)
          return
        }
        // other errors
        setIsError(true)
        setData([])
        return
      }

      // ensure we always set an array
      setData(Array.isArray(json) ? json : [])
      setIsError(false)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      if (!background) setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = () => fetchData({ background: true })

  return { data, isLoading, isError, refetch }
}

export default function HabitsList() {
  const { data: habits, isLoading, refetch } = useGetHabits();
  const deleteMutation = useAppDeleteHabit();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-foreground mb-2">All Habits</h1>
          <p className="text-muted-foreground">Manage your routines and checklists.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          New Habit
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-border animate-pulse rounded-2xl" />)}
        </div>
      ) : habits?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <p className="text-muted-foreground">No habits found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {habits?.map((habit) => (
            <div key={habit.id} className="group bg-white border border-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg transition-all duration-300">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">{habit.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {habit.checklistItems.length} task{habit.checklistItems.length !== 1 ? 's' : ''} • Current Streak: {habit.currentStreak} 🔥
                </p>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive p-2 h-auto"
                  onClick={() => {
                    if(confirm("Are you sure you want to delete this habit?")) {
                      deleteMutation.mutate({ id: habit.id }, {
                        onSuccess: () => {
                          if (typeof refetch === 'function') refetch();
                        }
                      });
                    }
                  }}
                >
                  <Trash2 size={18} />
                </Button>
                <Link href={`/habits/${habit.id}`} className="block w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    View Details
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateHabitModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => { if (typeof refetch === 'function') refetch(); }} />
    </Layout>
  );
}

function CreateHabitModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState([""]);
  const createMutation = useAppCreateHabit();

  const handleAdd = () => {
    if (!name || items.some(i => !i.trim())) return alert("Please fill all fields");
    createMutation.mutate({
      data: { name, checklistItems: items.filter(i => i.trim()) }
    }, {
      onSuccess: () => {
        setName("");
        setItems([""]);
        if (typeof onCreated === 'function') onCreated();
        onClose();
      }
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Habit">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Habit Name</label>
          <Input 
            placeholder="e.g. Morning Routine" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Checklist Tasks</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Input 
                  placeholder={`Task ${idx + 1}`}
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx] = e.target.value;
                    setItems(newItems);
                  }}
                />
                {items.length > 1 && (
                  <Button 
                    variant="outline" 
                    className="px-3"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  >
                    <X size={16} className="text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-2 border border-dashed border-border"
            onClick={() => setItems([...items, ""])}
          >
            <Plus size={16} className="mr-2" /> Add Task
          </Button>
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button 
            className="flex-1" 
            onClick={handleAdd}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Save Habit"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}