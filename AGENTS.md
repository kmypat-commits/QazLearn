# QazLearn

Изучение казахского языка. SPA без бэкенда — всё в браузере, данные в localStorage.

## Команды

- `npm run dev` — дев-сервер
- `npm run build` — сборка (tsc + vite)
- `npm run lint` — oxlint

## Стек

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, oxlint, Vercel.

Несмотря на наличие `react-router-dom` в зависимостях, навигация сделана через `useState<Page>` в `App.tsx`.

## Архитектура

Все состояние в `App.tsx` (entries, progress, currentPage). Пробрасывается через props. Никаких сторов.

- `src/types/dictionary.ts` — все интерфейсы
- `src/lib/storage.ts` — localStorage (ключи `qazlearn_*`)
- `src/lib/spacedRepetition.ts` — SRS (4 оценки, 6 уровней)
- `src/lib/csv.ts` — парсинг/валидация/экспорт CSV
- `src/lib/answerComparison.ts` — проверка ввода с учётом окончаний казахского

6 страниц: Dashboard, Words, Phrases, Practice, Progress, ImportCsv.
6 режимов практики: flashcard, scratch, input-kz, input-ru, choice, phrase-build.

## Соглашения

- **Стили**: CSS-переменные (`--color-*`) + Tailwind. Тёмная тема через класс `.dark` на `<html>`.
- **Импорты**: сначала React/hooks, потом типы, потом библиотеки, потом компоненты.
- **Компоненты**: `export default function Name()`. Страницы в `src/pages/`, переиспользуемые — в `src/components/`.
- **Типы**: строгие, без `any`. Интерфейсы в `dictionary.ts`.
- **Словарь**: CSV в `src/assets/`, импортируется через `?raw`, парсится в рантайме.
- **Ответы**: 4 рейтинга `dont-know | hard | good | easy`, через `handleProgressUpdate`.
- **localStorage**: пишется сразу при каждом изменении, без debounce.
- **Форматирование**: JSX внутри `return (...)`, стрелочные функции для колбэков, `useCallback` для передаваемых вниз функций.
