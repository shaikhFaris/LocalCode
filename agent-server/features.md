# AI Software Engineering Agent — Features & Roadmap

> Plain-language summary + trackable feature list, derived from the full spec.

## 1. What This Project Is

An autonomous coding agent that takes a plain-English issue (e.g. "Add refresh
token rotation") and works through a repo end-to-end:

```
Issue → Understand → Explore repo → Plan → Modify code → Run tests
      → Analyze failures → Fix → Review → Final report
```

It's built on **LangGraph** (state machine / orchestration for LLM agents),
starts as a **single agent** doing everything, and later splits into
**specialized agents** (explorer, planner, coder, tester, reviewer) managed by
a **supervisor**.

Explicitly _not_ trying to be a fully autonomous SWE-bench system — it favors
safety and controlled execution (sandboxing, human approval gates, no
auto-deploy/merge) over maximum autonomy.

**Stack:** TypeScript, Node.js, LangGraph, LangChain, an LLM provider, Git,
Docker — with Postgres/Redis/Express/Zod/OpenTelemetry as it matures.

---

## 2. Core Concepts (the actual learning goal)

The spec is explicit that the point isn't agent count — it's mastering these
LangGraph primitives, in order:

1. **State** — shared object every node reads/writes
2. **Node** — a unit of work
3. **Edge** — connects nodes
4. **Conditional edge** — branch based on state (e.g. tests passed?)
5. **Cycle** — loop back (e.g. fix → retest)
6. **Checkpoint** — persist state at each step
7. **Human interrupt** — pause for approval
8. **Resume** — continue from last checkpoint after a crash
9. **Parallel branch** — run independent agents concurrently
10. **Subgraph** — nested graphs
11. **Multi-agent supervisor** — a router agent deciding "what next?"

---

## 3. Feature List by Build Phase

### 🟢 MVP — Single Agent, Core Loop

- [ ] Shared LangGraph `AgentState` object (task, files, plan, changes, test/lint/type results, status, etc.)
- [ ] Isolated per-task workspace (`/workspaces/task-123/{repository,logs,artifacts,state}`)
- [x] Repo exploration tools: `list_files`, `read_file`, `search_code`, `get_git_diff`
- [ ] Planning step → structured JSON plan (objective + steps + affected files), stored in state
- [x] Code modification tools: `create_file`, `edit_file`, `delete_file` (patch-based preferred over full rewrites)
- [ ] Every change logged as a `FileChange` (file, operation, reason)
- [ ] Test execution — auto-detect commands from `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod`, run test/lint/typecheck
- [ ] Test → fail → analyze → fix → retest loop, capped at `MAX_ITERATIONS` (e.g. 5)
- [ ] Final report generation (summary, files changed, test results, review result, limitations, next steps)

### 🟡 V2 — Reliability & Safety

- [ ] Checkpointing after every significant step
- [ ] `resume(task_id)` to continue after a crash
- [ ] Git integration: create `agent/task-123` branch, diff/status at the end, final commit
- [ ] Human-in-the-loop approval gates before dangerous ops (PR creation, deletes, destructive commands, config/schema changes, deploys)
- [ ] Retry policies per error type:
  - LLM timeout → retry
  - Tool failure → retry
  - Test failure → coder loop
  - Permission error → escalate to human
  - Invalid repository → fail
- [ ] Observability/event log: `TASK_STARTED`, `TOOL_CALLED`, `LLM_REQUEST`, `FILE_MODIFIED`, `TEST_PASSED`, `HUMAN_APPROVAL`, `TASK_COMPLETED`, etc., each with timestamp/task_id/node/agent/tool/input/output/duration/error

### 🟠 V3 — Multi-Agent

- [ ] Supervisor node that decides: EXPLORE / PLAN / IMPLEMENT / TEST / FIX / REVIEW / HUMAN_APPROVAL / COMPLETE / FAIL
- [ ] **Repository Explorer** agent — structure, relevant files, dependencies
- [ ] **Planner** agent — steps, affected files, strategy
- [ ] **Coder** agent — implements the plan
- [ ] **Tester** agent — runs tests/lint/typecheck, analyzes failures
- [ ] **Reviewer** agent — checks correctness, unnecessary changes, edge cases, test sufficiency, security, regressions, convention adherence
- [ ] Agents communicate only through structured state (no free-text chat between agents) → keeps things observable/deterministic/retryable

### 🔴 V4 — Advanced

- [ ] Parallel agents (e.g. Tests / Security / Dependency agents run simultaneously) with an aggregator before the reviewer
- [ ] Subgraphs
- [ ] Streaming execution updates
- [ ] Long-running task support
- [ ] Persistent memory across tasks
- [ ] Full Docker sandbox: filesystem isolation, command allowlist, network restrictions, CPU/memory limits, execution timeout, output size caps
- [ ] PR creation (with approval)
- [ ] Security review agent, dependency analysis agent
- [ ] Automatic regression testing

---

## 4. API Surface (target)

| Endpoint                  | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `POST /tasks`             | create task `{ repository, issue }`      |
| `GET /tasks/:id`          | check status                             |
| `POST /tasks/:id/approve` | approve a pending human-in-the-loop step |
| `POST /tasks/:id/reject`  | reject it                                |
| `POST /tasks/:id/resume`  | resume from last checkpoint              |
| `GET /tasks/:id/events`   | observability event stream               |
| `GET /tasks/:id/diff`     | current git diff                         |

## 5. UI (target)

Simple dashboard: pipeline checklist (Explorer → Planning → Coding → Testing →
Review), current activity line, live "files changed" list. Later: a visual
graph of the actual LangGraph execution path.

---

## 6. Non-Goals (explicitly out of scope for v1)

- Auto-deploying applications
- Merging PRs without human approval
- Modifying infrastructure
- Running arbitrary production commands
- Supporting every language
- Being a full SWE-bench-level autonomous system

---

## 7. Data Shapes Worth Remembering

```ts
type FileChange = {
  file: string;
  operation: "create" | "modify" | "delete";
  reason: string;
};

type Plan = { objective: string; steps: { description: string; files: string[] }[] };

type Review = { approved: boolean; issues: string[]; suggestions: string[] };

type AgentState = {
  task: string;
  repositoryPath: string;
  relevantFiles: string[];
  repositorySummary: string;
  plan: Plan | null;
  currentStep: number;
  changes: FileChange[];
  testResults: TestResult[];
  lintResults: LintResult[];
  typeCheckResults: TypeCheckResult[];
  review: Review | null;
  errors: AgentError[];
  iteration: number;
  status:
    | "planning"
    | "implementing"
    | "testing"
    | "reviewing"
    | "completed"
    | "failed"
    | "awaiting_approval";
};
```
