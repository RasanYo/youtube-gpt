# Implementation Plan: Issue #11 - Infrastructure & Testing

---

## >� Context about Project

**YouTube GPT** is an intelligent video knowledge base application that transforms hours of YouTube content into an instantly searchable, AI-powered system. The platform allows users to ingest individual videos or entire YouTube channels (latest 10 videos), search across their personal video library, ask AI questions with grounded answers including citations and timestamps, and generate content from selected videos.

The tech stack consists of a **React 18 + TypeScript** frontend built with **Vite**, styled with **Tailwind CSS** and **shadcn/ui** components. The backend uses **Supabase** for authentication and **PostgreSQL** database, with **Prisma ORM** for type-safe database access. The application features a three-column layout: left sidebar for conversation history, center area for AI chat, and right sidebar for knowledge base management.

The project is currently in **Step 1 (Project Bootstrap & Skeleton Deployment)** phase, where foundational infrastructure, authentication, database, and UI layout have been established. The application is built for the Bravi Founding Engineer technical assessment and follows strict code quality guidelines defined in CLAUDE.md, emphasizing KISS principles, YAGNI, and React best practices with comprehensive testing.

---

## <� Context about Feature

**Issue #11 (Infrastructure & Testing)** focuses on finalizing the development infrastructure for the project. This is a foundational task that ensures code quality, consistency, and maintainability across the codebase. The feature sits at the infrastructure layer, touching build configuration, code formatting, linting, and monitoring capabilities.

The current setup already includes **ESLint** (eslint.config.js), **Vitest** for testing, and database management scripts. However, the project lacks **Prettier** for automated code formatting, **eslint-config-prettier** to prevent ESLint/Prettier conflicts, a **health check API endpoint** for monitoring and deployment verification, and a convenient **format script** for developers.

This feature is critical because it establishes the developer experience foundation, ensuring all team members follow consistent code style, can easily format code, verify application health, and maintain code quality. The implementation must be compatible with the **Vite + React** architecture (not Next.js), requiring custom API route setup for the health check endpoint. The feature has no database schema changes, no authentication requirements, and minimal UI impactit's purely infrastructure-focused.

---

## <� Feature Vision & Flow

**End-to-End Behavior:**

Developers working on the codebase will have access to automated code formatting via Prettier, ensuring consistent style (single quotes, no semicolons) across all TypeScript/JavaScript files. When they run `npm run format`, all files will be automatically formatted according to the project's standards without manual intervention.

The ESLint and Prettier integration will work harmoniouslyESLint will focus on code quality rules while Prettier handles formatting, with no conflicting rules between them. Developers can run `npm run lint` to check for code quality issues without getting formatting complaints that Prettier can auto-fix.

The application will expose a `/api/health` endpoint that returns JSON with the application status and current timestamp. This endpoint can be used by deployment platforms (like Vercel), monitoring tools, or CI/CD pipelines to verify the application is running correctly. The endpoint requires no authentication and provides instant feedback on application availability.

All development workflows (formatting, linting, database management) will be accessible via npm scripts with clear naming conventions. Developers can discover available scripts by checking package.json, and all scripts will execute successfully without errors in the current environment.

---

## =� Implementation Plan: Tasks & Subtasks

**Note:** Please mark each task and subtask as complete by changing `[ ]` to `[x]` as you finish them.

**Instruction:** After completing each top-level task, I will pause to confirm with you that the implementation is correct before moving to the next task.

---

### **Task 1: Install and Configure Prettier** � ~5 minutes

This task sets up Prettier as the code formatting tool for the project. Prettier will automatically format code according to the project's style guide (single quotes, no semicolons) as defined in CLAUDE.md.

- [ ] **Subtask 1.1: Install Prettier as dev dependency**
  - Run `npm install --save-dev prettier` to add Prettier to the project
  - This adds prettier to devDependencies in package.json
  - Verify installation by checking package.json contains prettier in devDependencies

- [ ] **Subtask 1.2: Create Prettier configuration file**
  - Create `.prettierrc` file in the project root directory
  - Add configuration: `{ "semi": false, "singleQuote": true }` (no semicolons, single quotes)
  - This follows the project's code style conventions as specified in the issue requirements

- [ ] **Subtask 1.3: Create Prettier ignore file (optional but recommended)**
  - Create `.prettierignore` file in the project root to exclude auto-generated files
  - Add patterns: `node_modules`, `dist`, `.next`, `build`, `coverage`, `*.min.js`, `.git`
  - This prevents Prettier from formatting files that shouldn't be touched (dependencies, build outputs)

- [ ] **Subtask 1.4: Test Prettier configuration**
  - Run `npx prettier --check .` to verify Prettier can scan all files
  - Check the output to see which files would be formatted
  - Do not format files yetjust verify the configuration is working

---

### **Task 2: Install and Configure ESLint + Prettier Integration** � ~3 minutes

This task ensures ESLint and Prettier work together without conflicts. The `eslint-config-prettier` package disables all ESLint rules that conflict with Prettier's formatting.

- [ ] **Subtask 2.1: Install eslint-config-prettier**
  - Run `npm install --save-dev eslint-config-prettier`
  - This package disables ESLint formatting rules that conflict with Prettier
  - Verify installation by checking package.json devDependencies

- [ ] **Subtask 2.2: Update ESLint configuration**
  - Open `eslint.config.js` file (uses new ESLint flat config format)
  - Import eslint-config-prettier: `import prettier from "eslint-config-prettier";`
  - Add prettier config to the extends array in the configuration object
  - The config should extend prettier after other configs to ensure it overrides formatting rules

- [ ] **Subtask 2.3: Test ESLint + Prettier integration**
  - Run `npm run lint` to verify ESLint still works correctly
  - Check that no formatting-related errors appear (only code quality issues)
  - Confirm ESLint and Prettier are not conflicting on formatting rules

---

### **Task 3: Add Format Script to package.json** � ~2 minutes

This task adds a convenient npm script that allows developers to format all code in the project with a single command.

- [ ] **Subtask 3.1: Add format script to package.json**
  - Open `package.json` file in the project root
  - Add new script under "scripts" section: `"format": "prettier --write ."`
  - This script will format all files in the project according to Prettier configuration
  - Place it near other quality scripts (lint, test) for easy discovery

- [ ] **Subtask 3.2: Test the format script**
  - Run `npm run format` to execute the formatting script
  - Verify that Prettier formats all relevant files in the project
  - Check git diff to see what files were changed by the formatter
  - Review formatted files to ensure the style matches expectations (single quotes, no semicolons)

---

### **Task 4: Create Health Check API Endpoint** � ~5 minutes

This task creates a simple HTTP endpoint that returns application status. Since this is a Vite + React app (not Next.js), we need to create a mock API route or use a simple approach compatible with the current architecture.

**Note:** Vite doesn't have built-in API routes like Next.js. We have two options:

1. Create a simple Express server for the health endpoint
2. Use Vite's dev server proxy feature to mock the endpoint
3. **Recommended:** Create a simple health check page component that can be accessed at a route

For this implementation, we'll create a dedicated `/health` route component that returns JSON-like information visible in the browser.

- [ ] **Subtask 4.1: Create health check route component**
  - Create new file `src/pages/Health.tsx` in the pages directory
  - Export a functional component that displays health status information
  - Include: status ("ok"), timestamp (current ISO timestamp), version (from package.json)
  - Use a simple JSON-formatted display (pre-formatted text or code block)

- [ ] **Subtask 4.2: Add health route to React Router**
  - Open `src/App.tsx` file where routes are defined
  - Import the Health component: `import Health from "./pages/Health"`
  - Add a new route above the catch-all route: `<Route path="/health" element={<Health />} />`
  - This creates a `/health` endpoint accessible in the browser

- [ ] **Subtask 4.3: Make health route public (no authentication required)**
  - Review `src/pages/Health.tsx` to ensure it doesn't use `useAuth()` hook
  - The health route should not check for authentication or redirect to login
  - This allows external monitoring tools and deployment platforms to check health without auth

- [ ] **Subtask 4.4: Test the health check endpoint**
  - Start the dev server with `npm run dev`
  - Navigate to `http://localhost:8080/health` in the browser
  - Verify the page displays status information correctly (status: ok, timestamp, version)
  - Test that the endpoint is accessible without being logged in

**Alternative Approach (if needed):**
If a true REST API endpoint is required, we can add `express` as a dependency and create a simple API server, but this adds complexity beyond the scope of the issue. The route-based approach is simpler and sufficient for health checking.

---

### **Task 5: Verify All Scripts and Final Testing** � ~3 minutes

This task ensures all npm scripts in package.json work correctly and the infrastructure is fully functional.

- [ ] **Subtask 5.1: Test all existing scripts**
  - Run `npm run dev` to start the development server (verify it starts without errors)
  - Run `npm run build` to create a production build (verify it completes successfully)
  - Run `npm run lint` to check for code quality issues (verify ESLint runs correctly)
  - Run `npm run test` to run the test suite (verify Vitest runs correctly)

- [ ] **Subtask 5.2: Test database management scripts**
  - Run `npm run db:studio` to open Prisma Studio (verify it launches correctly, then close it)
  - The other db scripts (db:push, db:migrate, db:reset) require database access, so just verify they exist
  - Check package.json to confirm all database scripts are present: db:push, db:studio, db:migrate, db:reset

- [ ] **Subtask 5.3: Test the new format script**
  - Run `npm run format` to format all files in the project
  - Verify Prettier formats code according to the configuration (single quotes, no semicolons)
  - Check git status to see what files were changed (if any)
  - If many files were changed, review a few to ensure formatting is correct

- [ ] **Subtask 5.4: Run final verification**
  - Run `npm run lint` to ensure no linting errors after formatting
  - Run `npm run build` to ensure the project builds successfully after all changes
  - Start the dev server and visit `http://localhost:8080/health` to verify health endpoint
  - Confirm all acceptance criteria from Issue #11 are met

---

##  Acceptance Criteria Checklist

- [ ] Health check route accessible at `/health` (returns status and timestamp)
- [ ] eslint-config-prettier installed and configured
- [ ] Prettier installed and configured (single quotes, no semicolons)
- [ ] `.prettierrc` file created with correct configuration
- [ ] Format script added to package.json (`npm run format`)
- [ ] All scripts tested and working correctly (dev, build, lint, test, format, db:\*)
- [ ] ESLint and Prettier work together without conflicts
- [ ] No linting errors in the codebase after formatting

---

## = Related Information

- **Issue**: #11 - Infrastructure & Testing
- **Branch**: `11-featureinfrastructure-testing`
- **Dependencies**: Issue #1 (Project Generation & Setup)  Completed
- **Followed by**: Issue #10 (Vercel Deployment)
- **Part of**: Step 1  Project Bootstrap & Skeleton Deployment
- **Estimated Total Time**: ~18 minutes

---

## =� Notes

- This is a Vite + React project, not Next.js, so traditional API routes (like Next.js App Router) are not available
- The health check implementation uses a React Router route instead of a REST API endpoint
- The project already has ESLint configured with the new flat config format (eslint.config.js)
- Database management scripts (db:push, db:studio, db:migrate, db:reset) are already present in package.json
- The lint script already exists and uses ESLint
- Follow CLAUDE.md guidelines for code style and conventions throughout implementation

---

**Generated**: 2025-10-22
**Status**: Ready for implementation
