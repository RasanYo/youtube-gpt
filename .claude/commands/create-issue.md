# Generate AI-Friendly Issue

When I ask you to "create an issue for [feature description]", follow this workflow:

## Step 1: Generate Issue

Create a GitHub issue draft with:

**Issue Title:**
A clear, action-oriented title (max 30 chars) starting with a verb

**Issue Description:**
```
## Overview
Brief 3-4 sentence summary of what needs to be built and why it matters

## Requirements
- Bullet points of core functionality (3-7 items)
- Focus on WHAT, not HOW

## Technical Context
- Relevant libraries or tools to consider
- Documentation references if applicable
- Integration points with existing system

## Acceptance Criteria
- Clear, testable conditions for completion (2-4 items)
- User-facing outcomes

## Notes
- Any constraints, dependencies, or architectural considerations
```

## Step 2: Review

After generating the issue, ask me:
"Does this look good? Reply with:
- 'yes' or 'create' to create the GitHub issue
- 'edit [feedback]' to revise
- 'cancel' to abort"

## Step 3: Create Issue

If I approve, use the GitHub CLI to create the issue:
```bash
gh issue create --title "TITLE" --body "DESCRIPTION"
```

If I provide feedback, revise the issue and show it again for review.

## Guidelines:
- Keep description under 20 lines total
- Use clear, jargon-free language
- Focus on outcomes, not implementation
- Assume the reader is an AI agent that needs context, not code
- Include links to official docs for suggested libraries
- Mention relevant files/components by name if they exist

## Example Workflow:

**Me:** "Create an issue for adding video preview thumbnails"

**You:** 
```
**Title:** Add YouTube video thumbnail previews to chat messages

**Description:**
## Overview
Display video thumbnails when users share YouTube links in the chat area. This provides visual context for shared videos without requiring users to click the link. Thumbnails should appear inline within chat messages as interactive cards. This enhances the user experience by making video content more discoverable and engaging.

## Requirements
- Extract video ID from YouTube URLs
- Fetch thumbnail from YouTube API or oEmbed
- Show thumbnail as a card in the chat message
- Handle loading and error states

## Technical Context
- Use YouTube oEmbed API (no key required): https://oembed.com/
- Consider react-player for future video playback
- Integrate with existing ChatArea.tsx component

## Acceptance Criteria
- Thumbnails appear for valid YouTube URLs
- Broken/invalid links show graceful fallback
- Responsive sizing in chat messages

## Notes
- Should work with both youtube.com and youtu.be URLs

---
Does this look good? Reply with 'yes'/'create' to create the issue, 'edit [feedback]' to revise, or 'cancel' to abort.
```

**Me:** "yes"

**You:** *[Creates the issue using gh CLI and confirms with issue number/URL]*

---

## Prerequisites:
Make sure GitHub CLI (`gh`) is installed and authenticated in your terminal.

## Usage:
Add this command to your `.cursorrules` file or reference it when working with Cursor AI.