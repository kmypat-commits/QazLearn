import { supabase, isSupabaseConfigured } from './supabase';
import type { ProgressEntry, KnowledgeLevel, RuleProgress } from '../types/dictionary';
import type { DailyStats } from './storage';

/* Progress */

export async function loadProgress(): Promise<Record<number, ProgressEntry>> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabase
    .from('progress')
    .select('*');
  if (error || !data) return {};
  const map: Record<number, ProgressEntry> = {};
  for (const row of data) {
    map[row.entry_id] = {
      id: row.entry_id,
      attempts: row.attempts,
      correctAnswers: row.correct_answers,
      wrongAnswers: row.wrong_answers,
      consecutiveCorrect: row.consecutive_correct,
      knowledgeLevel: row.knowledge_level as KnowledgeLevel,
      reviewStatus: row.review_status as ProgressEntry['reviewStatus'],
      nextReviewAt: row.next_review_at,
      lastReviewedAt: row.last_reviewed_at,
    };
  }
  return map;
}

export async function saveProgressEntry(entryId: number, progress: ProgressEntry): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('progress').upsert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    entry_id: entryId,
    knowledge_level: progress.knowledgeLevel,
    correct_answers: progress.correctAnswers,
    wrong_answers: progress.wrongAnswers,
    consecutive_correct: progress.consecutiveCorrect,
    attempts: progress.attempts,
    review_status: progress.reviewStatus,
    next_review_at: progress.nextReviewAt,
    last_reviewed_at: progress.lastReviewedAt,
  });
}

/* Rule Progress */

export async function loadRuleProgress(): Promise<Record<string, RuleProgress>> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabase.from('rule_progress').select('*');
  if (error || !data) return {};
  const map: Record<string, RuleProgress> = {};
  for (const row of data) {
    map[row.rule_id] = {
      id: row.rule_id,
      status: row.status as RuleProgress['status'],
      lastReviewedAt: row.last_reviewed_at,
    };
  }
  return map;
}

export async function saveRuleProgressEntry(ruleId: string, progress: RuleProgress): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('rule_progress').upsert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    rule_id: ruleId,
    status: progress.status,
    last_reviewed_at: progress.lastReviewedAt,
  });
}

/* Daily Stats */

export async function loadDailyStats(): Promise<DailyStats> {
  if (!isSupabaseConfigured()) {
    return { date: new Date().toDateString(), correct: 0, wrong: 0 };
  }
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', today)
    .single();
  if (error || !data) {
    return { date: today, correct: 0, wrong: 0 };
  }
  return { date: data.date, correct: data.correct, wrong: data.wrong };
}

export async function recordAnswer(correct: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', today)
    .single();
  if (data) {
    await supabase
      .from('daily_stats')
      .update({
        correct: data.correct + (correct ? 1 : 0),
        wrong: data.wrong + (correct ? 0 : 1),
      })
      .eq('id', data.id);
  } else {
    await supabase.from('daily_stats').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      date: today,
      correct: correct ? 1 : 0,
      wrong: correct ? 0 : 1,
    });
  }
}

/* Streak */

export async function loadStreak(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak')
    .single();
  if (error || !data) return 0;
  return data.current_streak;
}

export async function updateStreak(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return 0;

  const { data } = await supabase
    .from('streaks')
    .select('*')
    .single();

  if (!data) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      last_active_date: today,
    });
    return 1;
  }

  if (data.last_active_date === today) return data.current_streak;

  let streak = data.current_streak;
  if (data.last_active_date === yesterday) {
    streak++;
  } else {
    streak = 1;
  }

  await supabase
    .from('streaks')
    .update({ current_streak: streak, last_active_date: today })
    .eq('id', data.id);

  return streak;
}
