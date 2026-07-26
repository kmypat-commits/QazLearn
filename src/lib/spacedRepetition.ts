import type { ProgressEntry, KnowledgeLevel, AnswerRating } from '../types/dictionary';

const INTERVALS = [0, 1, 3, 7, 14, 30];

export function updateProgress(
  progress: ProgressEntry,
  rating: AnswerRating
): ProgressEntry {
  const now = new Date().toISOString();
  progress.lastReviewedAt = now;
  progress.attempts++;

  switch (rating) {
    case 'dont-know':
      progress.wrongAnswers++;
      progress.consecutiveCorrect = 0;
      progress.knowledgeLevel = Math.max(0, (progress.knowledgeLevel - 2)) as KnowledgeLevel;
      progress.nextReviewAt = new Date(Date.now() + 60000).toISOString();
      progress.reviewStatus = 'learning';
      break;

    case 'hard':
      progress.wrongAnswers++;
      progress.consecutiveCorrect = 0;
      progress.knowledgeLevel = Math.max(0, (progress.knowledgeLevel - 1)) as KnowledgeLevel;
      progress.nextReviewAt = new Date(Date.now() + 86400000).toISOString();
      progress.reviewStatus = 'learning';
      break;

    case 'good':
      progress.correctAnswers++;
      progress.consecutiveCorrect++;
      progress.knowledgeLevel = Math.min(5, (progress.knowledgeLevel + 1)) as KnowledgeLevel;
      if (progress.correctAnswers > progress.wrongAnswers) {
        const interval = INTERVALS[progress.knowledgeLevel] || 30;
        progress.nextReviewAt = new Date(Date.now() + interval * 86400000).toISOString();
        progress.reviewStatus = progress.knowledgeLevel >= 3 ? 'mastered' : 'review';
      } else {
        progress.nextReviewAt = new Date(Date.now() + 3600000).toISOString();
        progress.reviewStatus = 'learning';
      }
      break;

    case 'easy':
      progress.correctAnswers++;
      progress.consecutiveCorrect++;
      progress.knowledgeLevel = Math.min(5, (progress.knowledgeLevel + 2)) as KnowledgeLevel;
      if (progress.correctAnswers > progress.wrongAnswers) {
        const interval = INTERVALS[progress.knowledgeLevel] || 30;
        progress.nextReviewAt = new Date(Date.now() + interval * 86400000).toISOString();
        progress.reviewStatus = progress.knowledgeLevel >= 3 ? 'mastered' : 'review';
      } else {
        progress.nextReviewAt = new Date(Date.now() + 3600000).toISOString();
        progress.reviewStatus = 'learning';
      }
      break;
  }

  return progress;
}

export function needsReview(progress: ProgressEntry): boolean {
  if (!progress.nextReviewAt) return true;
  return new Date(progress.nextReviewAt) <= new Date();
}

export function isMastered(progress: ProgressEntry): boolean {
  return (
    progress.reviewStatus === 'mastered' &&
    progress.knowledgeLevel >= 3 &&
    progress.correctAnswers > progress.wrongAnswers
  );
}
