# Read Current Branch Issue

Analyze the GitHub issue associated with the current branch.

Follow these steps:

1. Use `git branch --show-current` to get the current branch name
2. Extract the issue number from the branch name (if it follows a pattern like `issue-123` or `123-feature-name`)
3. Use `gh issue view <issue-number>` to fetch the issue title and description
4. Display the issue details including:
   - Issue number
   - Title
   - Description
   - Status (open/closed)
   - Labels
   - Assignees
5. Provide a brief summary of what needs to be implemented

If no issue number is found in the branch name, ask the user to provide the issue number or check if the branch follows the expected naming convention.

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.

