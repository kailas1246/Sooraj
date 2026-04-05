import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, setToken } from "./use-auth";

// Base API URL (use relative paths; `apiFetch` will prefix the environment base)
const API = "/api/habits";

// CREATE HABIT
export function useAppCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data }) => {
      const res = await apiFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
        }
        throw new Error((json && json.error) || 'Failed to create habit');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
    },
  });
}

// UPDATE HABIT
export function useAppUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await apiFetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) setToken(null);
        throw new Error((json && json.error) || 'Failed to update habit');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
    },
  });
}

// DELETE HABIT
export function useAppDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        if (res.status === 401) setToken(null);
        throw new Error((json && json.error) || 'Failed to delete habit');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
    },
  });
}

// TOGGLE TASK
export function useAppToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await apiFetch(`${API}/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) setToken(null);
        throw new Error((json && json.error) || 'Failed to toggle task');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
    },
  });
}