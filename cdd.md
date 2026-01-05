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

### Progress storage (JSON in LocalStorage)

* Save mastered words + quiz history as a JSON blob in LocalStorage.
* Key example: `kr-en-vocab-progress-v1`

Shape:

```json
{
  "masteredIds": ["w001", "w014"],
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

  * reads/writes LocalStorage JSON
* `QuizStore` (signal-based)

  * state machine for quiz flow (current question, answers, results)
* UI components

  * `HomeComponent`, `QuizComponent`, `ResultComponent`
  * `ProgressBarComponent` (optional)
* Animations

  * Angular animations OR CSS (Tailwind + small keyframes)
  * Keep MVP: card transition + correct/incorrect feedback

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
VocabWord { id: string; kr: string; en: string[] }
QuizAnswer { wordId: string; userAnswer: string; isCorrect: boolean }
QuizAttempt { dateIso: string; score: number; items: QuizAnswer[] }
ProgressState { masteredIds: string[]; attempts: QuizAttempt[] }
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

# Step 3 — LocalStorage JSON progress service

### Build

* `ProgressStorageService`

  * `load(): ProgressState`
  * `save(state: ProgressState): void`
  * `reset(): void`
* Include versioned key and safe fallback if storage is empty/corrupt

### Acceptance criteria

* If LocalStorage empty → returns `{ masteredIds: [], attempts: [] }`
* If corrupted JSON → fallback without crashing

### Codex prompt

```text
Implement ProgressStorageService using LocalStorage JSON.
Key: "kr-en-vocab-progress-v1".
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
  * `remainingPool: VocabWord[]` (unmastered)
  * `quizWords: VocabWord[]` (10)
  * `index: number`
  * `answers: QuizAnswer[]`
  * `status: 'idle' | 'loading' | 'inQuiz' | 'done'`
  * `feedback: 'none' | 'correct' | 'incorrect'` (for animations)
* actions:

  * `initQuiz()`: select 10 unique from unmastered
  * `submitAnswer(answer: string)` (option selection)
  * `next()`
  * `finish()`: compute score, persist attempt, persist masteredIds for correct answers

Selection rules:

* Only unmastered words
* Shuffle, take first 10
* If pool < 10: take all available

### Acceptance criteria

* Correctly answered words are added to mastered set
* Those words never appear in subsequent `initQuiz()` calls
* Quiz always has unique words

### Codex prompt

```text
Create a signal-based QuizStore (Angular 21) that:
- loads all vocab via VocabRepositoryService
- loads progress via ProgressStorageService
- initQuiz() selects up to 10 unique unmastered words (shuffle then slice)
- submitAnswer() marks current answer correct/incorrect (case-insensitive, trim)
- build 4-option multiple-choice list per question (1 correct + 3 distractors)
- correct answers add wordId to masteredIds when finishing
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
* Mastered count / remaining count

### Acceptance criteria

* Full flow works end-to-end: Home → Quiz → Result → Start again
* Responsive layout on mobile

### Codex prompt

```text
Build HomeComponent, QuizComponent, ResultComponent using Tailwind.
Home: Start Daily Quiz button. Display mastered count and remaining count.
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

* If pool is empty: show “All mastered” state and link to reset or add more vocab
* Add `Reset progress` button with confirmation
* Prevent double submit (disable button briefly after submit)

### Acceptance criteria

* No crashes when vocab < 10 or pool empty
* Reset clears masteredIds and attempts

### Codex prompt

```text
Handle edge cases:
- If there are 0 unmastered words, show an 'All words mastered' screen (home or quiz) with Reset button.
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
- Import: paste JSON, validate shape, then overwrite LocalStorage state.
Keep it in a Settings section on the Home screen.
```

---

## Definition of Done (MVP)

* Start quiz, answer 10 KR→EN words
* Correct answers are recorded into JSON progress
* Future quizzes exclude mastered words
* Smooth UI + simple animations
* Works fully offline with vocab in assets and progress in LocalStorage

---
