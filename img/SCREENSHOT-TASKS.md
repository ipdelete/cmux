# Screenshot Task List

Capture these screenshots for docs and README. Save each as the filename listed below in this `img/` folder.

**Tips:**
- Use a clean window (no clutter in terminals)
- Dark theme is the default — capture as-is
- Aim for ~1200px wide window for consistency
- Crop to the app window (no desktop background)

---

## README.md Screenshots

These replace the existing screenshots referenced in the repo root README.

### 1. `hero-demo.gif`
**NEW — replaces static hero screenshot**
**README section:** Hero image (line 12)
**Shows:** Animated GIF of the core workflow (~15-20 seconds)
**Capture flow:**
1. Click `+` to create a workspace → pick a project directory
2. Terminal appears, type `copilot` (or a few commands)
3. Click a file in the Explorer → file opens with syntax highlighting
4. Click back to the workspace in Navigator → terminal reappears
**Tool:** Use [ScreenToGif](https://www.screentogif.com/) or [LICEcap](https://www.cockos.com/licecap/) on Windows
**Tips:** Keep it tight, 800-1000px wide, optimize to <5MB

### 2. `workspace-overview.png`
**Replaces:** `agent-screenshot.png`
**README section:** Below hero GIF (fallback/alternate view)
**Shows:** Full three-pane layout with a workspace active
**Setup:**
- Open 2–3 workspaces in the Navigator (e.g., "api", "frontend", "docs")
- Have one selected with some terminal output visible in Main View
- Explorer on the right showing a file tree with a few expanded folders
- Bonus: one workspace with a worktree badge visible

### 2. `agent-activity.png`
**NEW**
**README section:** 🤖 Chat-Driven Agents
**Shows:** An agent's activity feed in Main View
**Setup:**
- Create an agent from chat (e.g., "Create an agent for ~/src/my-project")
- Click the agent in the Navigator
- Activity feed should show a few tool cards (some expanded) and an assistant message
- Status dot should be visible (green = idle, or yellow = working)
- Navigator should show both workspaces and the agent to contrast the two

### 3. `copilot-chat.png`
**Replaces:** `agent-chat.png`
**README section:** 💬 Copilot Chat (line 32)
**Shows:** Copilot Chat in Main View with Conversations in the right pane
**Setup:**
- Click "Copilot Chat" in the Navigator
- Have 2–3 conversations in the Conversations pane on the right
- Show a short exchange (user message + assistant response) in Main View
- Model picker visible at the bottom

### 4. `file-view.png`
**Replaces:** `agent-file-screenshot.png`
**README section:** ✨ Monaco Editor Integration (line 44)
**Shows:** A file open in Main View with syntax highlighting
**Setup:**
- Click a `.ts` or `.tsx` file in the Explorer
- File should be visible in Main View with Monaco syntax highlighting
- The file should appear nested under its workspace in the Navigator
- Explorer still showing the workspace's directory tree

### 5. `git-status.png`
**NEW**
**README section:** 🔀 Git Integration
**Shows:** Git status indicators in the Explorer and a worktree badge in the Navigator
**Setup:**
- Open a workspace in a git repo with some modified/untracked files
- Explorer should show colored file status indicators
- If possible, have a worktree workspace to show the badge in Navigator

### 6. `scratch-pad.png`
**NEW**
**README section:** 📝 Scratch Pad
**Shows:** Scratch Pad open at the bottom of a workspace
**Setup:**
- Press `Ctrl+J` to open the Scratch Pad
- Type a few lines of notes in it
- Terminal should be visible above it

---

## docs/ Screenshots

These go in the how-to guides.

### 7. `getting-started-first-workspace.png`
**Shows:** A fresh workspace just created — empty terminal, file tree loaded
**Setup:**
- Single workspace in the Navigator, just created via `+`
- Empty or near-empty terminal in Main View
- Explorer showing the directory tree
**Used in:** docs/getting-started.md

### 8. `workspace-navigator.png`
**Shows:** Navigator with multiple workspaces, one with nested open files
**Setup:**
- 3+ workspaces in the Navigator
- One workspace expanded with 1–2 open files nested underneath
- Active workspace highlighted
**Used in:** docs/managing-workspaces.md

### 9. `workspace-context-menu.png`
**Shows:** Right-click context menu on a workspace in the Navigator
**Setup:**
- Right-click a workspace in the Navigator
- Context menu visible with Rename / Close options
**Used in:** docs/managing-workspaces.md

### 10. `workspace-scratch-pad.png`
**Shows:** Scratch Pad open with notes (close-up, docs version)
**Setup:**
- Same as #6 but can be a tighter crop focused on the Scratch Pad area
- A few lines of realistic notes visible
**Used in:** docs/managing-workspaces.md

### 11. `agent-created-from-chat.png`
**Shows:** Chat message that created an agent + the agent appearing in the Navigator
**Setup:**
- In Chat, send "Create an agent for ~/src/some-project"
- The agent should now appear in the Navigator with copilot icon + status dot
- Chat response confirming creation visible in Main View
**Used in:** docs/working-with-agents.md

### 12. `agent-activity-feed.png`
**Shows:** Close-up of an agent's activity feed with various card types
**Setup:**
- Agent with some completed work — mix of tool cards (success/failure), assistant message, and done card
- At least one tool card expanded to show results
**Used in:** docs/working-with-agents.md

### 13. `chat-conversations.png`
**Shows:** Conversations pane with multiple conversations listed
**Setup:**
- Have 3+ conversations with different names
- One selected/highlighted
- Main View showing that conversation's messages
**Used in:** docs/using-copilot-chat.md

### 14. `chat-model-picker.png`
**Shows:** Model picker dropdown open
**Setup:**
- Click the model picker in Chat
- Dropdown showing available models
**Used in:** docs/using-copilot-chat.md

### 15. `explorer-file-tree.png`
**Shows:** Explorer with expanded folders and various file types
**Setup:**
- A workspace with a non-trivial project open
- Several folders expanded in the Explorer
- Mix of file types visible (.ts, .json, .md, etc.)
- Git status colors visible on modified files
**Used in:** docs/browsing-files.md

### 16. `file-nested-in-navigator.png`
**Shows:** A file open in Main View with the file visible nested under its workspace in Navigator
**Setup:**
- Click a file in the Explorer to open it
- Navigator should show the file as a child of the workspace
- Main View showing the file content
**Used in:** docs/browsing-files.md

---

## Checklist

**README (replace old screenshots):**
- [ ] 1. `hero-demo.gif` — Animated hero GIF (~15-20s workflow demo)
- [ ] 2. `workspace-overview.png` — Static fallback hero
- [ ] 3. `agent-activity.png` — Chat-Driven Agents section
- [ ] 4. `copilot-chat.png` — Copilot Chat section
- [ ] 5. `file-view.png` — Monaco Editor section
- [ ] 6. `git-status.png` — Git Integration section
- [ ] 7. `scratch-pad.png` — Scratch Pad section

**docs/:**
- [ ] 8. `getting-started-first-workspace.png`
- [ ] 9. `workspace-navigator.png`
- [ ] 10. `workspace-context-menu.png`
- [ ] 11. `workspace-scratch-pad.png`
- [ ] 12. `agent-created-from-chat.png`
- [ ] 13. `agent-activity-feed.png`
- [ ] 14. `chat-conversations.png`
- [ ] 15. `chat-model-picker.png`
- [ ] 16. `explorer-file-tree.png`
- [ ] 17. `file-nested-in-navigator.png`

Once screenshots are captured, tell me and I'll wire them into the docs and README.
