## Problem (what you’re solving)

You want a simple way to **consistently practice Korean → English vocabulary daily** without:

* wasting time picking words,
* repeating the same questions too often,
* or using a boring flashcard experience that doesn’t feel like a “game”.

The key pain is **daily repetition with progress**, not “learning everything at once”.

## MVP Goal

A lightweight daily quiz app that:

1. gives **10 KR→EN questions per quiz**,
2. lets you **guess answers in a quiz format**,
3. **records correct answers**, and
4. ensures **future quizzes don’t include words you’ve already answered correctly**.

Plus: **interactive and user-friendly** UI with **simple animations** (micro-interactions).

---

## Target user (MVP persona)

* You (and people like you) who want a **daily habit** of vocab training.
* Already have some vocab list (or are ok starting from a small starter list).
* Want quick sessions: **2–5 minutes/day**.

---

## MVP User Story (core flow)

1. User opens the app.
2. Taps **“Start Daily Quiz”**.
3. App shows **Question 1/10**: Korean word.
4. User types (or chooses) English answer.
5. App gives **instant feedback** (Correct/Incorrect) with a small animation.
6. Repeat until **10 questions** done.
7. End screen shows **score + list of correct/incorrect**.
8. Correct answers get marked as “mastered” so they **won’t appear again** in future quizzes.

---

## MVP Feature Set (must-have)

### 1) Quiz generation (10 unique words)

* Pull 10 words from the vocabulary pool that are **not yet mastered**.
* Ensure **no duplicates in the same quiz**.

### 2) Answer input + validation

* User submits an English answer.
* Compare with the correct translation.
* MVP-friendly validation approach:

  * Exact match (case-insensitive, trimmed),
  * Optionally accept multiple correct synonyms if stored.

### 3) Progress tracking (the “non-repeating” rule)

* When user gets a word correct, store it as **mastered**.
* Future quizzes exclude mastered words.
* If user gets it wrong, keep it eligible for future quizzes.

### 4) Results screen

* Score (e.g., 7/10).
* Review list:

  * KR word → correct EN answer → user answer.

### 5) Basic delightful UX (animation + friendliness)

Keep it minimal but polished:

* **Card transition** between questions (slide/fade).
* **Correct**: subtle bounce/checkmark.
* **Incorrect**: shake animation + show correct answer.
* Progress indicator (e.g., “3/10”).

This is enough to feel interactive without building a full game.

---

## Data Model (simple and MVP-ready)

You only need a few objects:

**VocabularyWord**

* `id`
* `kr` (Korean word)
* `en` (English answer) OR `enAnswers[]` (if multiple)
* `isMastered` (true/false) OR `masteredAt` timestamp

**QuizAttempt**

* `date`
* `score`
* `answers[]`:

  * `wordId`
  * `userAnswer`
  * `isCorrect`

Storage can be local first (fast MVP):

* Mobile/web local storage / SQLite
* Optional login later

---

## MVP Screens (minimum UI)

1. **Home**

* “Start Quiz”
* “Mastered count: X”
* “Remaining: Y”

2. **Quiz Screen**

* KR word prompt
* answer input
* submit button
* feedback animation
* next button (or auto-advance after feedback)

3. **Results Screen**

* score summary
* review list
* “Start another quiz” (optional)

---

## Edge Cases (handle in MVP)

* If remaining unmastered words < 10:

  * Show fewer questions **or**
  * show message: “You’ve mastered all available words—add more to continue.”

---

## What to **exclude** from MVP (save for v2)

These are tempting but will slow you down:

* Spaced repetition algorithm (SM2, Leitner)
* Difficulty levels, categories, streaks, leaderboards
* Audio pronunciation, speech input
* Multiplayer / sharing
* AI-generated words
* Cloud sync / accounts

---

## MVP Success Criteria (simple metrics)

* You can complete 10 questions in under 3 minutes.
* Mastered words never repeat.
* You feel motivated enough to do it daily.

---
