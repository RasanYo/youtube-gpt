## FEATURE:

Create a comprehensive `ROADMAP.md` file that converts the hierarchical roadmap in `./docs/bravi_roadmap.md` into a structured list of actionable GitHub issues.

### What needs to be done:

Transform the detailed technical roadmap (which has ~2500 lines with Steps, sub-steps, and checkboxes) into:

- A well-organized markdown file with GitHub issue definitions
- Each sub-step (e.g., 1.1, 1.2, 2.3, etc.) becomes a separate GitHub issue
- Issues should be properly formatted with titles, descriptions, labels, and assignable tasks
  IMPORTANT: Do it only for Step 2. Don't do the other steps

### Steps to accomplish this:

1. **Parse the roadmap structure**
   - Read `./docs/bravi_roadmap.md` to understand the full project roadmap
   - Identify the main Steps (e.g., "Step 1 - Project Bootstrap & Skeleton Deployment")
   - Extract all sub-steps (e.g., "1.1 Project Generation & Setup", "1.2 Tailwind & Dark Mode Configuration", etc.)
   - Capture time estimates, goals, and technical details for each section

2. **Design the issue structure**
   - For each sub-step (x.x), create a GitHub issue template that includes:
     - **Title**: Clear, descriptive title (e.g., "1.1 - Project Generation & Setup")
     - **Branch Name**: Suggested git branch name following a consistent naming convention (e.g., `feature/project-setup`)
     - **Description**: What needs to be implemented (extract from the goal and TODO items)
     - **Labels**: Appropriate labels based on the type of work (e.g., "setup", "backend", "frontend", "deployment", "documentation")
     - **Acceptance Criteria**: Transform the checkbox items into clear acceptance criteria
     - **Estimated Time**: Time estimate from the parent Step
     - **Dependencies**: If the sub-step depends on previous sub-steps being completed

3. **Generate the ROADMAP.md file**
   - Create a well-formatted markdown file with:
     - A header explaining the purpose of this roadmap
     - A table of contents or summary showing all Steps and their sub-steps
     - For each sub-step, a complete issue definition in markdown format
     - Use consistent formatting throughout (proper headers, code blocks, lists, etc.)
     - Include metadata like total estimated time and tech stack from the original roadmap

4. **Organize by priority and dependencies**
   - Maintain the original sequential order (Step 1 → Step 2 → etc.)
   - Clearly indicate which issues must be completed before others can start
   - Group related issues together under their parent Step

5. **Format for GitHub integration**
   - Structure the output so it can be easily converted into actual GitHub issues (either manually or via automation)
   - Use GitHub-flavored markdown
   - Include checkboxes for task lists within each issue
   - Consider adding emoji indicators for issue types (🎯 for goals, ⚙️ for setup, 🎨 for UI, etc.)

## EXAMPLES

### Example of an issue definition in ROADMAP.md:

```markdown
---

### Issue #1: 1.1 - Project Generation & Setup

**Branch Name:** `feature/project-setup`

**Labels:** `setup`, `infrastructure`, `Step 1`

**Estimated Time:** ~30 minutes (part of Step 1: 2 hours total)

**Dependencies:** None (first issue)

#### 🎯 Description

Set up the foundational Next.js project with TypeScript, Tailwind CSS, and initialize the GitHub repository. This is the first step in creating the Bravi YouTube AI application.

#### ✅ Acceptance Criteria

- [ ] Create a new Next.js project with TypeScript using `create-next-app@latest`
- [ ] Initialize Git repository locally
- [ ] Create GitHub repository using `gh` CLI
- [ ] Push initial commit to GitHub
- [ ] Configure `.gitignore` to include `.env`, `.env.local`, `node_modules`, `.next`

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Followed by: Issue #2 (1.2 - Tailwind & Dark Mode Configuration)

---
```

This example shows the complete format for transforming a sub-step from `bravi_roadmap.md` into a ready-to-use GitHub issue.
