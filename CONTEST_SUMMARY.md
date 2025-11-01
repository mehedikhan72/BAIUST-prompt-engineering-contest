# Prompt Engineering Contest Overview

## Format

- Duration: 4 hours, split into three sequential phases.
- Teams race to finish levels; progress updates feed a real-time, ICPC-inspired leaderboard.
- Penalty score = contest start minute + submission minute for each solved level. Lower penalty ranks higher. Phase Two & Three bonus points (based on judges’ scores) are subtracted from the penalty. In Phase 1, for wrong answers, the penalty is 10 minutes.

## Phase One – Password Retrieval (10 Steps)

- Interface: custom Retrieval-Augmented Generation (RAG) agent served from `ai-agent-service/`.
- Objective: interact with the agent to uncover the password for each of 5 sequential steps.
- Game Flow:
  - Topical guardrails screen out irrelevant prompts.
  - Once a prompt is allowed, the RAG agent responds using level-specific system instructions.
  - Responses that risk leaking the secret are filtered by a moderation pass before reaching the team.
- Completion Criteria: submit the correct password for each step to advance.

### Level Behaviors (Representative)

- **Level ONE:** agent reveals the secret when asked.
- **Level TWO:** agent refuses to reveal directly; provides hints instead.
- **Level THREE:** politeness required for assistance; rude requests are declined.
- **Level FOUR:** hints limited to pop-culture references about the secret.
- **Level FIVE:** agent supplies riddles; players solve to obtain the secret.
- (Further steps continue with escalating variations aligned to the contest narrative.)

## Phase Two – Reverse Prompt Engineering

- Unlock Criteria: Must complete Phase One's first 3 levels.
- Levels: 5
- Level Details: Title, Description, Reference Image, Exact Asset List.
- Assets Provided: reference image + exact asset list used to create it in per level.
- Task: craft a prompt for the same AI image model that reproduces the reference as closely as possible.
- Evaluation: judges review the submitted prompt and generated result manually. Closer matches earn higher marks.
- Scoring Impact: awarded marks count as negative penalty (bonus), improving leaderboard position.

## Phase Three – Build-Your-Own RAG

- Unlock Criteria: Must complete Phase Two.
- Deliverable: functional RAG system built over a large PDF corpus supplied at the start of the phase.
- Preferred Tooling: OpenAI models (contestants may choose alternatives if justified).
- Evaluation: criteria to be finalized; expect assessment on retrieval quality, answer fidelity, and system design.

## Leaderboard & Tie-Breaks

- Real-time updates mirror ICPC scoring.
- Phase completion time determines penalty accrual; Phase Two & Three bonuses reduce total penalty.
- Lowest total penalty wins. Time of last correct submission serves as tie-breaker if needed.

## Repository Layout (Planned)

- `ai-agent-service/`: FastAPI-based RAG agent powering Phase One.
- `api/`: Hono + TypeScript + Mongoose backend for contest orchestration (upcoming).
- `client/`: Next.js + TailwindCSS frontend (upcoming).
