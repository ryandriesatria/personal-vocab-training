# PersonalKrVocabTraining

Daily Korean-English vocabulary quiz that helps you build a consistent habit. The app serves 10-word quizzes, uses multiple-choice answers, and tracks completion totals by level (A, B, C, D, MISC). Progress is stored locally so it works offline.

## Features

- Level-based quiz selection (A through D + MISC)
- Multiple-choice answers with quick feedback animations
- Completion totals by level
- IndexedDB progress (no account required)
- Import/export progress JSON
- Offline-ready (PWA service worker)

## Tech

Angular 21 (signal-based) with Tailwind CSS. Project generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Vocabulary source

The vocabulary/corpus is sourced from the [kengdic](https://github.com/garfieldnate/kengdic) project.

The `src/assets/vocab.json` file is generated from the kengdic TSV using the script at:

```
scripts/tsv-to-vocab.ts
```

Example command (requires a TypeScript runner such as `tsx`):

```bash
npx tsx scripts/tsv-to-vocab.ts --input src/assets/raw/kengdic.tsv --out src/assets/vocab.json --hangulOnly true --inferLevel true
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## PWA / Offline

The app is configured as a Progressive Web App (PWA). Offline behavior is enabled in production builds via Angular's service worker and `ngsw-config.json`, which prefetches core assets and `assets/vocab.json`.

Build and serve the production output to test offline support:

```bash
ng build --configuration production
```

Then serve the `dist/` output with any static server (service worker does not run in `ng serve`).

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
