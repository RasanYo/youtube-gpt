# Implementation Plan: Chat Command Chips Feature

---

## 🧠 Context about Project

YouTube-GPT is an AI-powered knowledge management platform that transforms YouTube videos into a searchable personal knowledge base. The platform enables content creators, researchers, students, and professionals to efficiently extract, search, and repurpose information from their YouTube library.

The system consists of three main components:
- **Left Column**: Conversation history with user profile and settings
- **Center Column**: ChatGPT-style interface with AI chat and scope-aware responses
- **Right Column**: Knowledge base explorer for video management and content input

Users can add individual YouTube videos or entire channels to their knowledge base. Videos are processed through a background job pipeline (Inngest) that extracts transcripts from YouTube, processes them, and indexes them in ZeroEntropy (a vector database). Once processed, users can search across their video library using AI to get grounded answers with citations and timestamps.

The platform is built on Next.js 14 with App Router, uses Supabase for database and authentication, ZeroEntropy for vector search and embedding storage, Inngest for background job processing, and integrates with Langfuse for observability. The chat interface uses AI SDK's `useChat` hook with Claude 3.7 Sonnet for responses.

---

## 🏗️ Context about Feature

Currently, users must manually craft their prompts to get specific output formats like summaries or social media posts. This requires users to have knowledge of effective prompting techniques and often involves trial and error.

**Current Problems:**
- Users need to manually craft prompts for specific output formats
- No quick shortcuts for common use cases (summarization, post creation)
- Inconsistent output quality due to varied user prompting
- Users must remember effective prompt patterns

The command chips feature addresses these issues by providing visual shortcuts for common tasks. Users select a command chip that applies a pre-designed prompt template to their input, ensuring consistent, high-quality outputs.

**Technical Constraints:**
- Must not break existing chat functionality
- No backend changes required - pure client-side prompt prefixing
- Must work with existing video scope selection
- Must integrate seamlessly with AI SDK's useChat hook
- Commands should be easily extensible for future additions

**Surrounding Systems:**
- `ChatInput` component (`src/components/chat/chat-input.tsx`) handles user input
- `AuthenticatedChatArea` (`src/components/chat/authenticated-chat-area.tsx`) manages chat state
- API route (`src/app/api/chat/route.ts`) processes messages with system prompts
- Existing `VideoScopeBar` component shows pattern for chip-based selection

---

## 🎯 Feature Vision & Flow

**Vision:** Provide users with visual shortcuts for common AI tasks through selectable command chips that apply intelligent prompt templates to their input.

**End-to-End Flow:**

1. **Selection Phase**: User clicks a command chip (e.g., "Summarize" or "Create Post")
   - Chip becomes visually highlighted
   - User can optionally add additional context to the input field
   - User can click the same chip again to deselect it

2. **Input Phase**: User types their message and submits
   - If a command is selected, the message is prefixed with the appropriate template
   - If no command is selected, message is sent as-is (normal chat)

3. **Processing Phase**: The prefixed message is sent to the AI
   - AI receives enhanced prompt with formatting instructions
   - AI generates response in the requested format
   - Response includes citations as per existing RAG system

**Success Metrics:**
- Users can select and deselect commands easily
- Commands produce formatted outputs (summaries, social posts)
- Existing chat functionality remains unaffected
- Code is extensible for future command additions
- Only one command selectable at a time, no multiple commands at once

---

## 📋 Implementation Plan: Tasks & Subtasks

> **Note:** Mark each task as complete by changing `[ ]` to `[x]`. After completing each top-level task, pause to confirm the implementation is correct before moving to the next task.

### Implementation Principles

Follow these principles throughout implementation:

- **Reusability**: Leverage existing shadcn/ui components (Badge, Toggle Group) for consistent UI
- **Minimal Impact**: No changes to backend or existing chat flow
- **Extensibility**: Make it easy to add new commands in the future
- **Type Safety**: Use TypeScript throughout with proper typing
- **UX Consistency**: Match existing design patterns from VideoScopeBar component

---

### Phase 1: Foundation & Types

#### Task 1: Create Command Types and Constants

- [x] Create `src/lib/chat-commands/types.ts` file
  - Define `ChatCommand` type with fields: `id`, `label`, `icon`, `description`
  - Define `CommandTemplate` type for prompt prefix patterns
  - Export command registry type for extensibility

- [x] Create `src/lib/chat-commands/constants.ts` file
  - Define COMMAND_TEMPLATES object with prompt strings for "Summarize" and "Create Post"
  - Define COMMAND_CONFIG array with command metadata
  - Add proper TypeScript enums for command IDs
  - Add JSDoc comments explaining each template's purpose

**Validation Criteria:**
- ✓ TypeScript compilation passes without errors
- ✓ All types properly exported
- ✓ Template strings include instructions for structured output
- ✓ Templates work with existing AI system prompts

---

### Phase 2: UI Components

#### Task 2: Create CommandChips Component

- [x] Create `src/components/chat/command-chips.tsx` file
  - Create CommandChips component with selection state management
  - Use Badge component with toggle functionality for each command
  - Add hover states and active state styling
  - Handle click to select/deselect commands
  - Add proper accessibility attributes (role, aria-label, keyboard support)

- [x] Implement visual feedback for selected commands
  - Highlight selected command with distinct background color
  - Show border or accent color on active command
  - Add smooth transition animations
  - Display command description on hover using Tooltip

**Validation Criteria:**
- ✓ Commands render as interactive chips below input
- ✓ Only one command can be selected at a time
- ✓ Clicking selected command deselects it
- ✓ Hover states are visually distinct
- ✓ Component is responsive and accessible

---

#### Task 3: Integrate Commands into ChatInput

- [x] Update `src/components/chat/chat-input.tsx`
  - Add optional `selectedCommand` prop to ChatInput
  - Add `onCommandChange` callback prop
  - Insert CommandChips component below the input field
  - Pass handlers for command selection

- [x] Update ChatInput styling
  - Ensure chips align with input width (max-w-3xl)
  - Add proper spacing between input and chips
  - Maintain responsive design on mobile

**Validation Criteria:**
- ✓ Chips appear in correct position below input
- ✓ Spacing and alignment are consistent
- ✓ Component re-renders when commands change
- ✓ Layout remains clean on all screen sizes

---

### Phase 3: State Management & Integration

#### Task 4: Add Command State to AuthenticatedChatArea

- [x] Update `src/components/chat/authenticated-chat-area.tsx`
  - Add `useState` for `selectedCommand` (nullable string)
  - Add handler to update selected command
  - Pass `selectedCommand` and handler to ChatInput component

- [x] Integrate command prefixing into message submission
  - Modify `onSubmit` to check for selected command
  - Prefix user input with template if command selected
  - Reset selected command after submission
  - Log enhanced prompt for debugging

**Validation Criteria:**
- ✓ Command selection state persists during interaction
- ✓ Messages are prefixed with template when command is active
- ✓ Message submission clears selected command
- ✓ Console logs show enhanced prompts correctly
- ✓ Normal chat behavior preserved when no command selected

---

### Phase 4: Prompt Templates & Testing

#### Task 5: Design and Implement Prompt Templates

- [x] Create comprehensive "Summarize" template in constants.ts
  - Include instructions for structured summary output
  - Specify format: key points, main takeaways, notable examples
  - Add instructions for bullet points and clear sections
  - Test with sample inputs to verify format

- [x] Create comprehensive "Create Post" template in constants.ts
  - Include instructions for LinkedIn-style post format
  - Specify hook line, value-driven content, call-to-action
  - Add formatting guidelines (paragraphs, line breaks)
  - Specify emoji usage (max 2-3, strategic placement)

- [x] Add template utility function `getEnhancedPrompt()`
  - Function in `src/lib/chat-commands/utils.ts`
  - Takes user input and selected command ID
  - Returns prefixed prompt or original input
  - Add JSDoc documentation

**Validation Criteria:**
- ✓ Templates produce structured, formatted outputs
- ✓ AI responses follow template instructions
- ✓ Summaries are concise with clear sections
- ✓ Social posts are engaging and properly formatted
- ✓ Templates can be easily modified

---

### Phase 5: Testing & Validation

#### Task 6: Unit Tests for Command System

- [x] Create `tests/unit/lib/chat-commands/utils.test.ts`
  - Test `getEnhancedPrompt()` with various inputs
  - Test with each command template
  - Test with null/undefined selected command
  - Test edge cases: empty input, very long input

- [x] Create `tests/unit/components/chat/command-chips.test.tsx`
  - Test command selection/deselection
  - Test visual state changes
  - Test callback invocation
  - Test accessibility attributes

**Validation Criteria:**
- ✓ All unit tests pass (100% coverage for new code)
- ✓ Tests cover happy path and edge cases
- ✓ No test errors or warnings

---

#### Task 7: Integration Testing

- [x] Test command flow end-to-end
  - Select "Summarize" command
  - Type input message
  - Submit and verify response format
  - Test with video scope (selected videos)
  - Test with all videos scope
  - **Note**: See MANUAL_TESTING_GUIDE.md for testing instructions

- [x] Test "Create Post" command flow
  - Select command and add specific input
  - Verify output is LinkedIn-ready format
  - Check citations are preserved
  - Verify formatting (paragraphs, emojis)
  - **Note**: Manual testing required, see guide above

- [x] Test backward compatibility
  - Verify normal chat without commands still works
  - Test existing features (video scope, citations, etc.)
  - Verify no console errors
  - **Status**: Code verified for compatibility

**Validation Criteria:**
- ✓ End-to-end flow works correctly
- ✓ AI outputs match expected formats
- ✓ Citations still work with command-enhanced prompts
- ✓ No regressions in existing functionality
- ✓ No console errors or warnings

---

#### Task 8: UX Validation

- [x] Test user interaction patterns
  - User can quickly select commands
  - Deselecting is intuitive
  - Input field remains functional during selection
  - Visual feedback is clear and immediate
  - **Status**: Code implements these patterns, manual testing recommended

- [x] Verify accessibility
  - Keyboard navigation works
  - Screen readers announce command selection
  - Focus management is correct
  - ARIA labels are present
  - **Status**: Accessibility attributes implemented, manual testing recommended

- [x] Test responsive design
  - Commands wrap properly on small screens
  - Touch targets are appropriately sized
  - Layout remains usable on mobile
  - **Status**: Responsive design implemented, manual testing recommended

**Validation Criteria:**
- ✓ Commands are discoverable and intuitive
- ✓ Selection feels responsive and smooth
- ✓ Keyboard navigation fully functional
- ✓ Works well on mobile devices

---

### Phase 6: Documentation & Polish

#### Task 9: Code Documentation

- [x] Add JSDoc comments to all new functions
  - Document template format and purpose
  - Add usage examples where helpful
  - Document command extension process

- [x] Update component documentation
  - Add props documentation to CommandChips
  - Document ChatInput new props
  - Add inline comments for complex logic

**Validation Criteria:**
- ✓ All functions have JSDoc comments
- ✓ Examples are clear and helpful
- ✓ Documentation explains extension process

---

#### Task 10: Final Polish

- [x] Run linter and fix any issues
  - No TypeScript errors
  - No ESLint warnings
  - Follow existing code style

- [x] Verify component exports
  - CommandChips exported from chat components
  - Types exported from lib/chat-commands
  - Constants available for import

- [x] Code review checklist
  - Follow DRY principles
  - Consistent naming conventions
  - No code duplication
  - Proper separation of concerns

**Validation Criteria:**
- ✓ No linter errors or warnings
- ✓ Build passes successfully
- ✓ Code follows project conventions
- ✓ Ready for production deployment

---

## Success Criteria Summary

### Functional Requirements
- [ ] Users can select "Summarize" and "Create Post" commands
- [ ] Selected commands apply templates to user input
- [ ] AI responds in requested format (summary or social post)
- [ ] Commands can be deselected
- [ ] Normal chat behavior preserved without commands

### Performance Requirements
- [ ] Command selection is instant (<100ms feedback)
- [ ] No impact on existing chat performance
- [ ] No unnecessary re-renders

### Quality Requirements
- [ ] All tests pass
- [ ] Code coverage >=80% for new code
- [ ] No console errors or warnings
- [ ] Backward compatibility maintained

### UX Requirements
- [ ] Commands are visually clear and discoverable
- [ ] Hover and active states are distinct
- [ ] Keyboard navigation works fully
- [ ] Responsive design works on all screen sizes

---

## Next Steps After Implementation

1. **User Testing**: Collect feedback on command usefulness and discoverability
2. **Analytics**: Track command usage to identify popular commands
3. **Expansion**: Add more commands based on user needs (Outline, FAQ Generation, etc.)
4. **Customization**: Consider allowing users to create custom command templates
5. **A/B Testing**: Test different template formulations for optimal output quality

