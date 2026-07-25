export interface ComparisonResult {
  isCorrect: boolean;
  normalizedUser: string;
  normalizedCorrect: string;
  errors: ErrorPosition[];
}

export interface ErrorPosition {
  index: number;
  expected: string;
  got: string;
  isEnding: boolean;
}

export function compareAnswers(user: string, correct: string): ComparisonResult {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const userNorm = normalize(user);
  const correctNorm = normalize(correct);

  if (userNorm === correctNorm) {
    return { isCorrect: true, normalizedUser: userNorm, normalizedCorrect: correctNorm, errors: [] };
  }

  const errors: ErrorPosition[] = [];
  const maxLen = Math.max(userNorm.length, correctNorm.length);

  for (let i = 0; i < maxLen; i++) {
    if (userNorm[i] !== correctNorm[i]) {
      errors.push({
        index: i,
        expected: correctNorm[i] || '',
        got: userNorm[i] || '',
        isEnding: i >= correctNorm.length - 3 || i >= userNorm.length - 3,
      });
    }
  }

  return { isCorrect: false, normalizedUser: userNorm, normalizedCorrect: correctNorm, errors };
}

export function findEndingErrors(user: string, correct: string): string[] {
  const endings = ['мен', 'пен', 'бен', 'ға', 'ге', 'қа', 'ке', 'да', 'де',
    'та', 'те', 'нан', 'нен', 'дан', 'ден', 'тан', 'тен',
    'ды', 'ді', 'ты', 'ті', 'ны', 'ні',
    'мын', 'мін', 'бын', 'бін', 'пын', 'пін',
    'сыз', 'сіз', 'сың', 'сің'];

  const userWords = user.toLowerCase().trim().split(/\s+/);
  const correctWords = correct.toLowerCase().trim().split(/\s+/);

  const errors: string[] = [];

  for (let i = 0; i < Math.min(userWords.length, correctWords.length); i++) {
    if (userWords[i] !== correctWords[i]) {
      for (const ending of endings) {
        if (correctWords[i].endsWith(ending) && !userWords[i].endsWith(ending)) {
          errors.push(`В слове "${correctWords[i]}" пропущено окончание "${ending}"`);
          break;
        }
      }
    }
  }

  return errors;
}
