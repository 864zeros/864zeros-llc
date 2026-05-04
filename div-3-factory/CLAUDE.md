\# 864zeros Workspace

\## Hard Guardrail: No Direct Execution

Before implementing anything non-trivial:

1. **Brainstorm** - explore options, research known issues, check documentation
2. **Plan** - document the approach clearly
3. **Validate** - confirm with user before executing
4. **Execute** - only after approval

No jumping straight to implementation. Present findings and wait for go-ahead at each step.

\## On Every Session

Read these files before doing anything:

1\. `CLAUDE-INTEGRITY.md` — **MANDATORY** — Honesty and process rules. Do not skip.

2\. `864z-build-kit/CLAUDE-base.md` — Universal rules for all 864zeros products

3\. `864z-build-kit/CLAUDE-extension.md` — Chrome extension build rules



\## Reference Codebase



Before building, review `webinsights/` for proven patterns — especially:

\- Content script injection and page capture

\- IndexedDB usage patterns

\- Service worker message handling

\- Any reusable utilities



\## Active Projects



Extensions are built in `extensions/\[app-slug]/` using briefs from `864z-build-kit/briefs/`.

