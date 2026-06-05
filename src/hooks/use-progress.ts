import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { User, UserProgress, TypingSession } from "@shared/schema";

export function useProgress() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  // Get user progress
  const { data: progress = [], isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ['/api/progress'],
    enabled: !!authUser,
    retry: false
  });

  // Get user sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<TypingSession[]>({
    queryKey: ['/api/sessions'],
    enabled: !!authUser,
    retry: false
  });

  // Save typing session
  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      wpm: number;
      accuracy: number;
      timeSeconds: number;
      charactersTyped: number;
      errorsData: Record<string, number>;
      lessonId?: string;
    }) => {
      const response = await apiRequest('POST', '/api/sessions', {
        ...sessionData,
        completed: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  // Update user progress
  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest('PATCH', '/api/user', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });

  // Save daily progress
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: {
      day: number;
      wpm: number;
      accuracy: number;
      timeMinutes: number;
      errorsData: Record<string, number>;
    }) => {
      const response = await apiRequest('POST', '/api/progress', {
        ...progressData,
        completed: true,
        completedAt: new Date()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    }
  });

  const completedDays = progress
    .filter(p => p.completed)
    .map(p => p.day);

  return {
    user: authUser,
    progress,
    sessions,
    completedDays,
    isLoading: progressLoading || sessionsLoading,
    saveSession: saveSessionMutation.mutate,
    updateUser: updateUserMutation.mutate,
    saveProgress: saveProgressMutation.mutate,
    isSaving: saveSessionMutation.isPending || updateUserMutation.isPending || saveProgressMutation.isPending
  };
}
