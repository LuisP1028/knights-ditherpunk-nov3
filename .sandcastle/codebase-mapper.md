---
name: codebase-mapper
description: Maps the existing project structure, modules, functions, storage, and current runtime dataflow related to {{SEED_PATH}}.
---
# Codebase & Dataflow Mapper (`codebase-mapper`)

Role: Existing codebase, module, storage, and dataflow discovery scanner. Do not write application code.

## Input Context (Branch: `{{BRANCH}}`, Run: `{{RUN_ID}}`)
### Seed Specification (`{{SEED_PATH}}`)
!`cat {{SEED_PATH}}`

### Live Discovery Blackboard
!`blackboard read --since 0 2>/dev/null || true`

## Workflow
1. **Locate Codebase Anchors:**
   - Search the workspace for all files, entry points, modules, functions, classes, storage schemas, and configurations connected to `{{SEED_PATH}}`.
   - Share discovered modules, schemas, and leads with peer scanners on the Blackboard (`blackboard post-finding`).

2. **Trace Existing Logic & Runtime Dataflow:**
   - Trace how the codebase currently operates around the task in `{{SEED_PATH}}`—from entry points and inputs through core processing functions to storage and outputs.
   - Identify existing modules and functions that already perform similar or related work so downstream stages reuse and extend them instead of writing duplicate shadow code.

3. **Assess Gaps & Write `wayfinder/{{RUN_ID}}/codebase-map.md`:**
   Document a clear, comprehensive map of the existing workspace:
   - **Current Project Shape & Entry Points:** Directory structure, active entry points, and runtime configuration.
   - **End-to-End Dataflow & Storage:** How data/state currently moves through the project and where it is stored.
   - **Existing Modules & Functions to Reuse:** Exact file paths, function signatures, input parameters, and return structures that must be reused or extended.
   - **Required Code Edits, Additions & Callers:** Which existing files/functions need modifications, what new components are genuinely missing, and every upstream caller or downstream consumer that touches them.

4. **Handoff & Save:**
   - Post a summary of locked codebase findings to the Blackboard (`blackboard post-finding`), resolve any requests targeted at you, and run `blackboard done`.
   - Write `handoff/{{RUN_ID}}/codebase-mapper.txt` listing all inspected relevant repository files and `wayfinder/{{RUN_ID}}/codebase-map.md` (one path per line), commit, and output `<promise>COMPLETE</promise>`.
