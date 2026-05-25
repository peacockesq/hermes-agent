# Spike — Mike Fork Test Results

**Date:** 2026-05-24  
**Scope revision from Willie:** Test a fork of Mike itself and possibly the hardening fork. Do not spend time on redline forks unless Adeu licensing is a blocker. Adeu is already operationally strong for redlining.

## Scope

Tested:

1. Upstream Mike: `willchen96/mike`
2. Hardening/internal-firm fork: `cpatpa/PIP`
3. Adeu license posture

Did not test:

- `jamietso/mike-redline` beyond prior discovery, because Adeu covers DOCX redlining and is MIT-licensed.
- EU-Mike/MikeNL beyond prior architecture discovery, because they are connector-pattern references, not core fork candidates.
- Azure fork beyond prior architecture discovery, because useful provider abstractions can be studied later if Mike/PIP survive the first spike.

## Local workspace

`/Users/bot/.hermes/hermes-agent/project-artifacts/lexy-legal-os/mike-spike/`

Repos:

- `repos/upstream-mike` — commit `d39f580`, 2026-05-18
- `repos/pip-hardening` — commit `e72dcf9`, 2026-05-19

Logs:

- `logs/upstream-backend-npm-ci.log`
- `logs/upstream-backend-build.log`
- `logs/upstream-frontend-lint.log`
- `logs/upstream-frontend-build.log`
- `logs/pip-backend-npm-ci.log`
- `logs/pip-backend-build.log`
- `logs/pip-backend-test.log`
- `logs/pip-frontend-lint.log`
- `logs/pip-frontend-build.log`

## Environment

- Node: `v25.6.1`
- npm: `11.9.0`
- git: `2.50.1 (Apple Git-155)`

NPM cache note: initial `npm ci` hit a local npm cache permission/collision under `/Users/bot/.npm/_cacache`. Retried with project-specific cache at `mike-spike/npm-cache`, which fixed the environment issue without destructive cache cleanup.

## Results summary

| Target | Install | Backend build | Backend tests | Frontend lint | Frontend build |
|---|---:|---:|---:|---:|---:|
| Upstream Mike | Pass | Pass | N/A | **Fail** | **Fail** |
| PIP hardening fork | Pass | Pass | Pass: 101/101 | **Fail** | Pass |

## Upstream Mike findings

### What passed

- Backend dependencies installed.
- Backend TypeScript build passed: `npm run build` → `tsc` success.

### What failed

#### Frontend lint

`npm run lint` failed with **107 problems: 39 errors, 68 warnings**.

Representative issues:

- React hooks lint violations such as synchronous `setState` inside effects.
- `no-explicit-any` in login page.
- unescaped entities.
- CommonJS `require()` imports in frontend script.

This is not fatal for a prototype, but it is a quality smell.

#### Frontend production build

`npm run build` compiled but failed during prerendering:

- Route: `/account/models`
- Error: `supabaseUrl is required`

Interpretation: upstream frontend assumes Supabase configuration during build/prerender. That is fixable with env setup or dynamic rendering changes, but it confirms upstream is not cleanly environment-independent.

## PIP hardening fork findings

### What passed

- Backend dependencies installed.
- Backend TypeScript build passed.
- Backend tests passed: **13 test files, 101 tests**.
- Frontend dependencies installed.
- Frontend production build passed.

### What failed

#### Frontend lint

`npm run lint` failed with **118 problems: 47 errors, 71 warnings**.

Representative issues overlap with upstream:

- React hooks `set-state-in-effect` violations.
- static component lint issue in workflow modal.
- unescaped entities.
- CommonJS imports in frontend script.

Interpretation: PIP materially improves backend/production posture, but frontend lint debt remains. It is not polished, but it is more operationally serious than upstream because production build and backend tests pass.

## Adeu license finding

Adeu local repo: `/Users/bot/work/adeu`  
Origin: `https://github.com/dealfluence/adeu.git`  
Version in `pyproject.toml`: `1.4.4`  
License: **MIT**

License file grants permission to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies, subject to preserving copyright/license notice.

Conclusion: Adeu is permissive enough for our redlining path. No reason to waste core fork-spike time on Mike redline forks unless we later want UI integration ideas.

## Strategic read

Willie’s instinct is right: the first serious test should be upstream Mike plus the hardening fork, not every shiny fork.

### Upstream Mike

Useful as:

- attention magnet;
- UX reference;
- upstream ecosystem base;
- possible open-core starting point.

Risk:

- frontend lint debt;
- build assumes Supabase env;
- not production-ready without hardening.

### PIP hardening fork

Useful as:

- evidence that a real firm has already pushed Mike toward production shape;
- reference for backend hardening, tests, auth, RLS, retention, audit/admin, migrations;
- better fork candidate than upstream if license/upstream compatibility is acceptable.

Risk:

- still AGPL;
- likely tailored to its firm;
- frontend lint debt persists;
- may have assumptions we do not want.

### Adeu

Adeu should remain our redlining/document-fidelity component. It is MIT and already performs.

## Recommendation

Do **not** chase the redline fork now.

Next test should be one of these:

1. **Run PIP locally with fake data** and inspect whether the UI/workflows actually do meaningful work or are just firm-specific shell.
2. **Patch upstream Mike’s build environment minimally** and run it locally to compare UX against PIP.
3. **Diff PIP against upstream** to extract the specific hardening commits/features we would want in a Peacock fork.
4. **Decide fork target:** upstream Mike + selected hardening patches, or PIP as starting fork.

Current leaning after this spike: **PIP is the only Mike-family fork worth serious core evaluation right now. Upstream Mike is the public/momentum base; PIP is the hardening evidence. Adeu handles redlining.**
