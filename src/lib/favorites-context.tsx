"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { dummyProgress } from "@/lib/progress/dummy";

/**
 * お気に入りの状態管理。
 * Phase 1 は React state のみ（Phase 5 で Supabase の lesson_favorites /
 * course_favorites に置き換える。インターフェースはそのまま使える想定）。
 */
type FavoritesValue = {
  lessonIds: string[];
  courseIds: string[];
  isLessonFavorite: (lessonId: string) => boolean;
  isCourseFavorite: (courseId: string) => boolean;
  toggleLesson: (lessonId: string) => void;
  toggleCourse: (courseId: string) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [lessonIds, setLessonIds] = useState<string[]>(dummyProgress.favoriteLessonIds);
  const [courseIds, setCourseIds] = useState<string[]>([]);

  const toggleLesson = useCallback((lessonId: string) => {
    setLessonIds((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId],
    );
  }, []);

  const toggleCourse = useCallback((courseId: string) => {
    setCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      lessonIds,
      courseIds,
      isLessonFavorite: (id) => lessonIds.includes(id),
      isCourseFavorite: (id) => courseIds.includes(id),
      toggleLesson,
      toggleCourse,
    }),
    [lessonIds, courseIds, toggleLesson, toggleCourse],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
