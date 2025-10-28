# Implementation Plan: Add Select All Button to Knowledge Base

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube search application that helps users build a searchable knowledge base from YouTube videos. Users can add individual videos or entire channels, and the system ingests transcripts using Inngest background jobs. The AI assistant can answer questions across the user's video library with citation support including timestamps. The application uses Next.js 14 with App Router and features a three-column ChatGPT-style interface with conversation history, chat area, and knowledge base explorer.

## 🏗️ Context about Feature

The knowledge base currently allows users to select individual videos for deletion or to scope chat searches. However, there's no way to bulk-select all videos at once. Users must click each video card checkbox individually to select multiple videos. The VideoSelectionContext (`src/contexts/VideoSelectionContext.tsx`) provides a `setSelectedVideos()` method that can replace the entire selection, which we'll use to implement bulk selection.

## 🎯 Feature Vision & Flow

Add a "Select All" button to the knowledge base header that:
- Selects all videos in the knowledge base when clicked
- Toggles to "Deselect All" text when all videos are already selected
- Clears selection when clicked again (deselects all)
- Integrates with existing VideoSelectionContext
- Works seamlessly with existing delete functionality
- Positions next to the delete button in KnowledgeBaseHeader

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Update KnowledgeBaseHeader Interface
**Goal**: Add props for select all functionality

#### Subtask 1.1: Update KnowledgeBaseHeader props interface
- [x] Open `src/components/knowledge-base/knowledge-base-header.tsx`
- [x] Add new prop: `totalVideos: number` - total count of videos in knowledge base
- [x] Add new prop: `onSelectAll: () => void` - callback to handle select all action
- [x] Keep existing props (isCollapsed, onToggleCollapse, selectedVideos, onRemove, etc.)

**Validation Criteria**:
- [x] TypeScript compiles without errors
- [x] Interface defines all required props

---

### Task 2: Implement Select All Logic in KnowledgeBaseHeader
**Goal**: Add button and handle select/deselect logic

#### Subtask 2.1: Add handleSelectAll logic
- [x] Create `handleSelectAll` function inside KnowledgeBaseHeader component
- [x] Calculate if all videos are selected: `selectedVideos.size === totalVideos`
- [x] If all selected: call `onSelectAll()` with empty Set to clear selection
- [x] Otherwise: call `onSelectAll()` with all video IDs from parent

#### Subtask 2.2: Add Select All button to UI
- [x] Import `CheckSquare` and `Square` icons from `lucide-react`
- [x] Add Button before delete button in header
- [x] Use conditional rendering to show different icons:
  - Show `CheckSquare` when all videos selected
  - Show `Square` when not all selected
- [x] Add `onClick={handleSelectAll}` handler
- [x] Disable button when `totalVideos === 0` (no videos to select)
- [x] Add appropriate tooltip for button

**Validation Criteria**:
- [x] Button appears in correct position in header
- [x] Button toggles between "select all" and "deselect all" states
- [x] Visual feedback matches existing button styles

---

### Task 3: Update KnowledgeBase Component
**Goal**: Pass necessary props to KnowledgeBaseHeader and handle select all action

#### Subtask 3.1: Add select all handler
- [x] Open `src/components/knowledge-base/knowledge-base.tsx`
- [x] Create `handleSelectAll` function
- [x] Get all video IDs: `const allVideoIds = new Set(videos.map(v => v.id))`
- [x] Check if all are selected: compare `selectedVideos.size === videos.length`
- [x] If all selected: call `clearSelection()` from useVideoSelection
- [x] Otherwise: call `setSelectedVideos(allVideoIds)` from useVideoSelection

#### Subtask 3.2: Pass props to KnowledgeBaseHeader
- [x] Update KnowledgeBaseHeader JSX to pass new props:
  - `totalVideos={videos.length}`
  - `onSelectAll={handleSelectAll}`
- [x] Ensure existing props are still passed correctly

**Validation Criteria**:
- [x] All videos get selected when button clicked
- [x] All videos get deselected when clicked again
- [x] No TypeScript errors

---

### Task 4: Update VideoSelectionContext Type (if needed)
**Goal**: Ensure setSelectedVideos is available in context interface

#### Subtask 4.1: Verify context exports
- [x] Check `src/contexts/VideoSelectionContext.tsx` 
- [x] Verify `setSelectedVideos` is in interface `VideoSelectionContextType`
- [x] Verify `setSelectedVideos` is included in context value memoization
- [x] Ensure it's exported in the context value object

**Validation Criteria**:
- [x] setSelectedVideos is accessible via useVideoSelection hook
- [x] No TypeScript errors when using in KnowledgeBase

---

## 📁 Files to Modify

1. `src/components/knowledge-base/knowledge-base-header.tsx` - Add select all button and logic
2. `src/components/knowledge-base/knowledge-base.tsx` - Add handler and pass props
3. `src/contexts/VideoSelectionContext.tsx` - Verify setSelectedVideos is exported (likely already done)

## ✅ Final Acceptance Criteria

**All tasks complete when**:
1. [ ] "Select All" button appears in knowledge base header
2. [ ] Button shows "Select All" when not all videos are selected
3. [ ] Button shows "Deselect All" when all videos are selected
4. [ ] Clicking selects all videos at once
5. [ ] Clicking again clears all selections
6. [ ] Button is disabled when there are no videos
7. [ ] Button works with existing delete functionality
8. [ ] No console errors or TypeScript errors
9. [ ] Visual styling matches existing header buttons
10. [ ] Integration test: select all → delete works correctly

**Success Metrics**:
- Users can bulk-select all videos with one click
- Select/deselect toggle works smoothly
- No breaking changes to existing selection behavior
- Consistent UX with existing header buttons

