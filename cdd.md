## Storage approach (personal app, JSON-based)

### Vocabulary source (static JSON)

* Store your KR→EN list in a JSON file inside the app:

  * `src/assets/vocab.json`

Example:

```json
[
  { "id": "w001", "kr": "사과", "en": ["apple"] },
  { "id": "w002", "kr": "학교", "en": ["school"] }
]
```

### Progress storage (JSON in IndexedDB)

* Save completed words + quiz history as a JSON blob in IndexedDB.
* Key example: `kr-vocab-progress` (IndexedDB DB name)

Shape:

```json
{
  "completedIds": ["w001", "w014"],
  "completionByLevel": {
    "A": 2,
    "B": 4,
    "C": 1,
    "D": 0,
    "MISC": 0
  },
  "attempts": [
    {
      "dateIso": "2026-01-05",
      "score": 7,
      "items": [
        { "wordId": "w001", "userAnswer": "apple", "isCorrect": true }
      ]
    }
  ]
}
```

This keeps everything JSON-based and trivial to export/backup later.

---

## Architecture (Angular 21 signals)

### Core modules / pieces

* `VocabRepositoryService`

  * loads `assets/vocab.json`
* `ProgressStorageService`

  * reads/writes IndexedDB JSON
* `QuizStore` (signal-based)

  * state machine for quiz flow (current question, answers, results)
* UI components

  * `HomeComponent`, `QuizComponent`, `ResultComponent`
  * `ProgressBarComponent` (optional)
* Animations

  * Angular animations OR CSS (Tailwind + small keyframes)
  * Keep MVP: card transition + correct/incorrect feedback
* PWA

  * Angular service worker for offline caching
  * Cache app shell + vocab assets

---

## Codex-driven development (CDD) plan

Each step includes:

1. what to build
2. acceptance criteria
3. a ready-to-copy **Codex prompt** (you can paste into Codex / ChatGPT code mode)

---

# Step 0 — Project bootstrap

### Build

* Create Angular app
* Add Tailwind CSS
* Add routing
* Create base layout shell

### Acceptance criteria

* App runs with Tailwind working (`bg-slate-900` etc.)
* Routes exist: `/`, `/quiz`, `/result`

### Codex prompt

```text
You are working in an Angular 21 app (signal-based). Set up Tailwind CSS and Angular Router.
Create routes for HomeComponent (/), QuizComponent (/quiz), ResultComponent (/result).
Add a simple AppComponent shell with a centered container and Tailwind typography.
Return the exact file changes and commands needed.
```

---

# Step 1 — Define types + JSON schemas

### Build

Create model types:

* `VocabWord`
* `QuizAnswer`
* `QuizAttempt`
* `ProgressState`

### Acceptance criteria

* Types compile
* JSON schema is consistent across services/store

### Codex prompt

```text
Create TypeScript model interfaces for:
VocabWord { id: string; kr: string; en: string[]; level: 'A' | 'B' | 'C' | 'D' | 'MISC' }
QuizAnswer { wordId: string; userAnswer: string; isCorrect: boolean }
QuizAttempt { dateIso: string; score: number; items: QuizAnswer[] }
ProgressState { completedIds: string[]; completionByLevel: Record<Level, number>; attempts: QuizAttempt[] }
Place them in src/app/core/models/*.ts and export from an index barrel.
```

---

# Step 2 — Load vocabulary list from assets/vocab.json

### Build

* `VocabRepositoryService` loads `assets/vocab.json`
* Use `HttpClient` and cache in a signal or shareReplay

### Acceptance criteria

* `getAllWords()` returns the list
* Works offline (served as asset)

### Codex prompt

```text
Implement VocabRepositoryService that loads src/assets/vocab.json using HttpClient.
Expose a method getAllWords(): Observable<VocabWord[]> and also a cached signal-based getter for components/stores.
Add necessary providers/imports in the app config (or module) for HttpClient.
```

---

# Step 3 — IndexedDB progress service

### Build

* `ProgressStorageService`

  * `load(): ProgressState`
  * `save(state: ProgressState): void`
  * `reset(): void`
* Include versioned key and safe fallback if storage is empty/corrupt

### Acceptance criteria

* If IndexedDB empty → returns `{ completedIds: [], completionByLevel: {...}, attempts: [] }`
* If corrupted JSON → fallback without crashing

### Codex prompt

```text
Implement ProgressStorageService using IndexedDB.
DB name: "kr-vocab-progress".
Methods: load(): ProgressState, save(state), reset().
load() must handle missing or invalid JSON and return empty default state.
Write minimal unit tests for load/save behavior.
```

---

# Step 4 — Quiz logic (no repeats, 10 questions)

### Build

Create a `QuizStore` using signals:

* state:

  * `words: VocabWord[]`
  * `remainingPool: VocabWord[]` (selected level pool)
  * `quizWords: VocabWord[]` (10)
  * `index: number`
  * `answers: QuizAnswer[]`
  * `status: 'idle' | 'loading' | 'inQuiz' | 'done'`
  * `feedback: 'none' | 'correct' | 'incorrect'` (for animations)
* actions:

  * `setLevel(level: 'A' | 'B' | 'C' | 'D' | 'MISC')`
  * `initQuiz()`: select 10 unique from selected level pool
  * `submitAnswer(answer: string)` (option selection)
  * `next()`
  * `finish()`: compute score, persist attempt, persist completedIds for correct answers

Selection rules:

* Only words from the selected level
* Shuffle, take first 10
* If pool < 10: take all available

### Acceptance criteria

* Correctly answered words increment completion totals by level
* Quiz always has unique words

### Codex prompt

```text
Create a signal-based QuizStore (Angular 21) that:
- loads all vocab via VocabRepositoryService
- loads progress via ProgressStorageService
- setLevel() stores the selected level for the next quiz
- initQuiz() selects up to 10 unique words from that level (shuffle then slice)
- submitAnswer() marks current answer correct/incorrect (case-insensitive, trim)
- build 4-option multiple-choice list per question (1 correct + 3 distractors)
- correct answers add wordId to completedIds and update completionByLevel
- after 10 questions, status becomes 'done' and a QuizAttempt is saved
Include derived signals: currentWord, progressText (e.g., "3/10"), scoreSoFar.
Also create pure helper functions for shuffle and normalization and unit test them.
```

---

# Step 5 — Quiz UI (user-friendly)

### Build

**QuizComponent**:

* Shows:

  * progress “X/10”
  * KR word card
  * 4-option buttons
  * feedback text + animation
  * next button (or auto-advance after 600ms)

**ResultComponent**:

* Score display
* Review list (KR, correct EN, user answer, correct/incorrect badge)
* CTA:

  * “Start new quiz”
  * “Reset progress” (optional MVP button)

**HomeComponent**:

* Start button
* Completion totals by level

### Acceptance criteria

* Full flow works end-to-end: Home → Quiz → Result → Start again
* Responsive layout on mobile

### Codex prompt

```text
Build HomeComponent, QuizComponent, ResultComponent using Tailwind.
Home: Start Daily Quiz button, level selector, and completion totals by level.
Quiz: show current KR word in a card, 4-option buttons, feedback message, progress indicator.
Result: show score and list of answers with badges, plus buttons to start new quiz and reset progress.
Wire navigation using Angular Router and QuizStore.
Keep components accessible (labels, focus states).
```

---

# Step 6 — Animations (MVP-level, tasteful)

### Build (keep minimal)

* Card transition between questions: fade/slide
* Correct: check icon + slight scale bounce
* Incorrect: shake

Implementation options:

* **Angular animations** (clean + deterministic)
* or **CSS keyframes** via Tailwind `@layer utilities`

### Acceptance criteria

* Animations do not block input
* Looks responsive and not “too much”

### Codex prompt

```text
Add simple animations for quiz interactions:
- When the word changes: card fades and slides up slightly.
- On correct: show a check icon and a subtle scale bounce.
- On incorrect: shake the card briefly.
- On option pick: quick highlight or pulse on the selected button.
Use Angular animations if possible; otherwise add CSS keyframes in styles and apply via Tailwind utility classes.
Ensure animations are triggered by QuizStore feedback state.
```

---

# Step 7 — Guardrails + edge cases

### Build

* If pool is empty: show “No words for this level” state and link back to level selection
* Add `Reset progress` button with confirmation
* Prevent double submit (disable button briefly after submit)

### Acceptance criteria

* No crashes when vocab < 10 or pool empty
* Reset clears completedIds and attempts

### Codex prompt

```text
Handle edge cases:
- If selected level has 0 words, show a "No words for this level" screen with a link back to Home.
- Disable submit button after submission until next question.
- Add a reset confirmation modal (simple) or confirm() for MVP.
Implement these without introducing complex state.
```

---

# Step 8 — “Personal app” extras (still small)

Optional but nice for you:

* Import/export progress JSON (copy/paste)
* Add “strict mode” vs “lenient” checking (later)

### Codex prompt

```text
Add a simple Import/Export progress feature:
- Export: show JSON in a textarea and a copy button.
- Import: paste JSON, validate shape, then overwrite IndexedDB state.
Keep it in a Settings section on the Home screen.
```

---

## Definition of Done (MVP)

* Start quiz, answer 10 KR→EN words
* Correct answers are recorded into JSON progress
* Completion totals tracked by level
* Smooth UI + simple animations
* Works fully offline with vocab in assets and progress in IndexedDB

---

