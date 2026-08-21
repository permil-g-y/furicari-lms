"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { setCourseFavorite, setLessonFavorite } from "@/lib/progress/actions";

/**
 * お気に入りの状態管理。
 *
 * ■ データの流れ
 *   初期値はサーバー（lesson_favorites / course_favorites）から props で受け取り、
 *   トグルは画面をすぐ更新してから Server Action で永続化する（楽観的更新）。
 *   保存に失敗したら元の状態へ戻すので、画面と DB がずれたままにならない。
 *
 * ■ なぜトグルではなく「設定」を送るか
 *   Server Action へ渡すのは「押した結果どうなるべきか」という真偽値。
 *   連打して通信の到着順が入れ替わっても、最後に送った状態へ収束する。
 *
 * ■ useFavorites() のインターフェースは Phase 1 から変えていない。
 *   利用側（VideoCard / WatchView / CourseDetail / お気に入りページ）は変更不要。
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

/** 追加は先頭へ（お気に入りページの「保存日が新しい順」に合わせる） */
function withFavorite(ids: string[], id: string, favorite: boolean): string[] {
  const without = ids.filter((current) => current !== id);
  return favorite ? [id, ...without] : without;
}

export function FavoritesProvider({
  initialLessonIds,
  initialCourseIds,
  children,
}: {
  initialLessonIds: string[];
  initialCourseIds: string[];
  children: React.ReactNode;
}) {
  const [lessonIds, setLessonIds] = useState<string[]>(initialLessonIds);
  const [courseIds, setCourseIds] = useState<string[]>(initialCourseIds);
  const [, startTransition] = useTransition();

  const toggleLesson = useCallback(
    (lessonId: string) => {
      const favorite = !lessonIds.includes(lessonId);
      setLessonIds((prev) => withFavorite(prev, lessonId, favorite));

      startTransition(async () => {
        const result = await setLessonFavorite(lessonId, favorite);
        if (!result.ok) {
          // 保存できなかったので表示を元に戻す
          setLessonIds((prev) => withFavorite(prev, lessonId, !favorite));
        }
      });
    },
    [lessonIds],
  );

  const toggleCourse = useCallback(
    (courseId: string) => {
      const favorite = !courseIds.includes(courseId);
      setCourseIds((prev) => withFavorite(prev, courseId, favorite));

      startTransition(async () => {
        const result = await setCourseFavorite(courseId, favorite);
        if (!result.ok) {
          setCourseIds((prev) => withFavorite(prev, courseId, !favorite));
        }
      });
    },
    [courseIds],
  );

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
