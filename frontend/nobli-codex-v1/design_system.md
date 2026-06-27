# Frontend Design System

## 0. Purpose

This document defines the frontend visual and interaction system for an agentic paper-writing automation tool for researchers.

The product helps researchers write, revise, structure, review, and prepare academic papers with AI agents. The interface must support long-form academic work, file-based context, iterative revision, voice/text interaction, visible agent progress, and stage-specific research artifacts.

This product is not a generic AI chatbot, not a SaaS admin dashboard, not an AI playground, and not a marketing landing page. The interface should clearly show the actual research-writing workflow: conversation, agent progress, and stage-specific work output.

The desired visual direction is a modern scholar workspace: calm, precise, readable, and minimal, with subtle pastel accents, grainy noise, layered glassmorphism, and soft micro-interactions.

---

## 1. Product Context

The product is an automated agent workspace for researchers writing papers.

It should help users move through an academic writing workflow such as:

1. Upload research materials.
2. Parse papers, notes, figures, datasets, BibTeX, or LaTeX files.
3. Understand the research goal.
4. Build a paper roadmap.
5. Draft or revise sections.
6. Check argument structure.
7. Add or verify citations.
8. Simulate reviewer feedback.
9. Format and export the final artifact.

The UI must make the agent process visible and trustworthy. Users should understand what the agent is doing, which files it is using, and how each output relates to the paper-writing task.

---

## 2. Design Principles

### 2.1 Scholar-Centric Minimalism

Use a clean, solid-color canvas as the foundation. Avoid large full-page gradients.

The interface should feel like a restrained scholar’s studio: calm, readable, and focused, but not sterile. Use Material 3-inspired large rounded corners, subtle pastel accents, and occasional local gradients to create a sense of intelligence and creative research work.

Core rules:

* Use a solid warm gray-white canvas in light mode.
* Use a solid deep black-gray canvas in dark mode.
* Use gradients only as local accents.
* Keep functional icons monochrome unless they are in an active voice or AI-thinking state.
* Prioritize readability of long-form academic text, code, PDFs, and research artifacts.

### 2.2 Context over Clutter

The UI should support dense research work without becoming visually noisy.

Use layered surfaces, semi-transparent glass panels, subtle borders, and soft elevation to separate different work contexts: chat, progress, roadmap, draft, PDF, code, review, and export.

Core rules:

* Separate information by spatial zones, not by heavy decoration.
* Use glassmorphism only for cards, drawers, and floating components.
* Avoid stacking too many shadows or borders.
* Use whitespace to make the workspace breathable.
* Long text must remain highly readable.

### 2.3 Whispering Interactions

Interactions should feel subtle, soft, and intelligent.

Avoid harsh neon glows, aggressive animations, or flashy AI effects. During voice input, AI listening, or active reasoning, use a very soft pastel aurora glow with fine grainy noise. The effect should feel like breathing, not flashing.

Core rules:

* Use slow, smooth, low-amplitude motion.
* Prefer opacity, blur, glow, and tiny translation over large movement.
* Use grainy noise only as a subtle texture layer.
* Never let visual effects reduce text readability.

---

## 3. Core Product Areas

The interface is organized around three primary areas:

1. **AI Conversation Area**

   * Chat history
   * Drag-and-drop file upload
   * Writing / revision mode selector
   * Voice input
   * Text input
   * AI response cards
   * Pop-up choice drawer
   * Clarification questions
   * User instruction editing

2. **Top Progress Bar**

   * Shows the current paper-writing stage
   * Indicates agent execution progress
   * Makes the automation process visible and trustworthy
   * Should be thin, elegant, and persistent

3. **Main Work Area**

   * Displays different content depending on the current writing stage
   * May show roadmap, outline, PDF preview, paper draft, LaTeX/code block, citation plan, review comments, or export preview
   * Should prioritize readability, revision clarity, and artifact confidence

---

## 4. Product-Specific Layout System

### 4.1 Overall Structure

Use a focused research-writing workspace instead of a generic dashboard.

Recommended layout:

```css
.app-shell {
  display: grid;
  grid-template-columns: minmax(280px, 30%) 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
}
```

The layout contains:

* Left side: AI Conversation Area
* Top of main area: Progress Bar
* Main area: Stage-specific Workspace

Do not force all modules into equal-width cards. The AI conversation area and main writing workspace should have clear hierarchy.

---

### 4.2 AI Conversation Area

The AI Conversation Area is the control center of the product.

It should support:

* File upload
* Chat history
* Writing mode selection
* Voice input
* Text input
* Pop-up choice drawers
* Agent clarification questions

Visual rules:

* Keep this area compact but highly usable.
* Use rounded glass or white cards for chat messages.
* Keep the input box sticky at the bottom.
* Use one calm visual rhythm for the chat flow.
* Do not turn every message into an oversized decorative card.
* Do not use chatbot mascots, robots, sparkles, or magic wand icons as the main visual identity.

Recommended structure:

```css
.chat-lane {
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
}

.chat-input-zone {
  position: sticky;
  bottom: 0;
  padding: 16px;
}
```

---

### 4.3 File Upload Area

File upload is a core research interaction, not a secondary decoration.

It should support:

* Drag-and-drop paper PDFs
* Uploading notes, figures, datasets, BibTeX, LaTeX, or reference files
* Showing uploaded file state clearly
* Letting the user understand which files the agent is using

Visual rules:

* Use a compact drop zone inside or near the chat input.
* Avoid large empty upload cards unless it is the onboarding state.
* Uploaded files should appear as small document chips or file cards.
* Each file chip should show filename, type, and status if available.

Example file states:

* Uploaded
* Being parsed
* Used as context
* Needs review
* Failed to read

---

### 4.4 Writing Mode Selector

The writing mode selector helps researchers control the agent.

Possible modes:

* Brainstorm
* Outline
* Draft
* Rewrite
* Polish
* Shorten
* Expand
* Check logic
* Add citations
* Format for conference
* Rebuttal response
* Reviewer simulation

Visual rules:

* Use compact pill buttons or a small segmented control.
* Do not create a large feature-card grid for modes.
* Active mode may use `--brand-blue` or a subtle pastel background.
* Avoid flashy “AI magic” labels.
* Prefer precise academic wording over marketing language.

Example:

```css
.mode-pill {
  border-radius: var(--radius-pill);
  padding: 6px 12px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
}

.mode-pill.is-active {
  background: rgba(172, 206, 234, 0.28);
}
```

---

### 4.5 Voice and Text Input

The input area supports both text and voice.

Default state:

* Text input remains the primary stable interaction.
* Voice input appears as a compact icon button.
* Icons remain monochrome by default.

Voice active state:

* Only the microphone / stop button may use gradient.
* The input container may show subtle pastel aurora glow.
* Use grainy noise only in the glow layer.
* The animation should feel like soft listening, not a flashy AI effect.

Do not use:

* Sparkle effects
* Large soundwave animations
* Neon audio bars
* Robot listening indicators

---

### 4.6 Pop-up Choice Drawer

The choice drawer appears when the agent needs researcher input.

Examples:

* “Which conference format should I target?”
* “Do you want a conservative rewrite or a stronger storytelling version?”
* “Should I prioritize clarity, novelty, or technical rigor?”
* “Which section should I revise first?”
* “Which citation style should I use?”

Visual rules:

* Use a compact glassmorphism drawer.
* It can slide upward from the chat input or appear beside the current AI message.
* Choices should be readable and specific.
* Avoid generic option cards with equal visual weight.
* Hover states should be soft and pastel.

---

## 5. Top Progress Bar

The top progress bar is essential because agent automation must be visible and trustworthy.

It should show the current writing stage and progress.

Possible stages:

1. Upload / Parse
2. Understand Research Goal
3. Build Paper Roadmap
4. Draft Sections
5. Revise Argument
6. Check Citations
7. Format Output
8. Final Review / Export

Visual rules:

* The progress bar should be thin and persistent.
* Use pale gray for inactive steps.
* Use the pastel gradient only for active or completed progress.
* The progress bar should not look like a generic SaaS onboarding tracker.
* Each stage should map to actual product behavior.

Recommended style:

```css
.progress-bar {
  height: 4px;
  border-radius: var(--radius-pill);
  background: rgba(0, 0, 0, 0.06);
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-progress);
}
```

---

## 6. Main Work Area

The Main Work Area changes depending on the current paper-writing stage.

It should not be a static dashboard. It should behave like an active research-writing canvas.

Possible stage views:

### 6.1 Roadmap View

Shows the paper-writing plan.

Content may include:

* Paper structure
* Section-by-section writing plan
* Agent task queue
* Research argument map
* Missing evidence
* Citation TODOs

Visual rules:

* Roadmap should use hierarchy, indentation, and status markers.
* Avoid equal-weight generic cards.
* Show why each step exists.
* Keep the roadmap connected to actual writing progress.

### 6.2 PDF + Draft View

Shows source paper / uploaded document alongside the generated draft or rewritten section.

Content may include:

* PDF preview
* Extracted claims
* Current draft
* Suggested revision
* Citation anchors
* Highlighted source evidence

Visual rules:

* Prioritize reading comfort.
* PDF area should be clean and minimally framed.
* Draft area should use strong typography and enough line height.
* Avoid decorative UI around the PDF.

### 6.3 Code / LaTeX View

Shows code, LaTeX, BibTeX, formulas, or experiment-related snippets.

Visual rules:

* Use a dark code block for strong contrast.
* Use low-saturation pastel syntax colors.
* Do not use harsh neon syntax highlighting.
* Keep copy, export, and edit actions visible but understated.

### 6.4 Review View

Shows critique, reviewer simulation, or final paper checks.

Content may include:

* Logic gaps
* Weak claims
* Missing citations
* Redundant paragraphs
* Formatting problems
* Reviewer-style comments

Visual rules:

* Use clear severity levels.
* Do not rely only on color.
* Make comments actionable.
* Avoid generic “AI score” cards unless the scoring mechanism is shown.

---

## 7. Typography

### 7.1 Font Families

Use the following font system:

```css
--font-ui: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace;
```

### 7.2 Usage

Use Poppins for:

* Navigation labels
* Section titles
* Main UI headings
* CTA buttons
* Status labels

Use Inter or system sans-serif for:

* Paper summaries
* Research explanations
* Chat message body text
* Report content
* PDF-adjacent text

Use JetBrains Mono or Fira Code for:

* Code blocks
* Terminal-like output
* Inline code
* Formula variables
* Experiment parameters

### 7.3 Type Scale

```css
--text-xs: 12px;
--text-sm: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 22px;
--text-2xl: 28px;

--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-reading: 1.65;
```

Rules:

* Academic and report text should use `line-height: 1.6–1.7`.
* UI text should remain compact but not cramped.
* Avoid overly large marketing-style titles inside the product UI.

---

## 8. Color Tokens

### 8.1 Light Mode

```css
:root {
  --bg-main: #F7F7F7;
  --surface-card: rgba(255, 255, 255, 0.85);
  --surface-card-solid: #FFFFFF;
  --border-subtle: rgba(0, 0, 0, 0.04);

  --brand-blue: #ACCEEA;
  --brand-orange: #FF9270;
  --brand-yellow: #FFE989;
  --brand-mint: #E0F2F1;

  --gradient-progress: linear-gradient(
    to right,
    #ACCEEA,
    #FF9270,
    #FFE989,
    #E0F2F1
  );

  --text-main: #010101;
  --text-muted: #64748B;
  --text-soft: #94A3B8;

  --code-bg: #010101;
  --code-text: #F8FAFC;
}
```

Usage rules:

* `--bg-main` is the main canvas background.
* `--surface-card` is used for glass cards, drawers, and floating containers.
* `--brand-blue` is the default soft active color.
* `--brand-orange` is used for secondary emphasis, highlights, and warm alerts.
* `--brand-yellow` is used for exploration tags or soft metadata backgrounds.
* `--gradient-progress` is reserved for progress bars, active voice states, and subtle AI glow effects.
* Do not use the gradient as a full-page background.

### 8.2 Dark Mode

```css
[data-theme="dark"] {
  --bg-main: #0D1117;
  --surface-card: rgba(22, 27, 34, 0.8);
  --surface-card-solid: #161B22;
  --border-subtle: rgba(255, 255, 255, 0.06);

  --brand-blue: #689FC7;
  --brand-orange: #D67657;
  --brand-yellow: #CBB45B;
  --brand-mint: #6B8F8A;

  --gradient-progress: linear-gradient(
    to right,
    #689FC7,
    #D67657,
    #CBB45B
  );

  --text-main: #E6EDF3;
  --text-muted: #8B949E;
  --text-soft: #6E7681;

  --code-bg: #010101;
  --code-text: #E6EDF3;
}
```

Usage rules:

* Dark mode should feel calm and immersive, not cyberpunk.
* Use low-saturation pastel-neon colors only for meaningful active states.
* Avoid pure white text on pure black backgrounds unless inside code blocks.

---

## 9. Surface, Radius, Border, and Shadow

### 9.1 Radius Tokens

```css
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-pill: 999px;
```

Usage:

* Small chips: `10px`
* Cards and panels: `16px–24px`
* Input containers: `24px`
* CTA buttons: `999px`

### 9.2 Glass Surface

```css
.glass-surface {
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
}
```

Rules:

* Use glass surfaces for chat cards, drawers, floating panels, and side containers.
* Do not use glass effects on every element.
* Maintain enough opacity for text readability.

### 9.3 Shadows

```css
--shadow-soft: 0 12px 40px rgba(15, 23, 42, 0.06);
--shadow-floating: 0 20px 60px rgba(15, 23, 42, 0.10);
--shadow-dark-soft: 0 16px 48px rgba(0, 0, 0, 0.28);
```

Rules:

* Shadows should be soft and subtle.
* Avoid hard drop shadows.
* Use elevation sparingly.

---

## 10. Reusable Components

### 10.1 Chat Container

The chat container lives in the AI Conversation Area.

Base style:

```css
.chat-container {
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
}
```

Rules:

* Use soft rounded message cards.
* Keep text readable and compact.
* Avoid strong borders between every message.
* AI messages may use a slightly tinted surface.
* User messages may use solid white or soft brand-blue tint.

### 10.2 Voice Input and Listening Mode

The voice input is one of the few places where the system may use gradient and glow.

Default state:

* Icon should be monochrome.
* Input border should be subtle.
* No strong glow.

Listening state:

* Microphone or stop icon switches to a pastel gradient.
* The input container receives a very soft aurora glow.
* A grainy noise layer may animate slowly.
* The state label may display `Listening...`.

Example:

```css
.voice-input.is-listening {
  position: relative;
  border-radius: var(--radius-lg);
}

.voice-input.is-listening::before {
  content: "";
  position: absolute;
  inset: -8px;
  z-index: -1;
  border-radius: inherit;
  background: var(--gradient-progress);
  filter: blur(24px);
  opacity: 0.28;
  animation: aurora-breathe 3.6s ease-in-out infinite;
}

.voice-input.is-listening::after {
  content: "";
  position: absolute;
  inset: -8px;
  z-index: -1;
  border-radius: inherit;
  opacity: 0.12;
  pointer-events: none;
  background-image: url("/noise.svg");
  mix-blend-mode: soft-light;
  animation: grain-shift 4s steps(6) infinite;
}
```

Animation:

```css
@keyframes aurora-breathe {
  0%, 100% {
    opacity: 0.18;
    transform: scale(0.98);
  }
  50% {
    opacity: 0.32;
    transform: scale(1.015);
  }
}

@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-1%, 1%); }
  50% { transform: translate(1%, -1%); }
  75% { transform: translate(-0.5%, -1%); }
  100% { transform: translate(0, 0); }
}
```

Important:

* The glow must remain soft.
* Do not use bright neon.
* Do not animate too quickly.
* Do not apply this effect to normal buttons.

### 10.3 Choice Drawer

Used when the AI asks for user choices, such as paper mode, writing priority, citation style, output format, or experiment direction.

Style:

```css
.choice-drawer {
  background: var(--surface-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-floating);
  transform-origin: bottom left;
}
```

Interaction:

```css
.choice-card {
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.choice-card:hover {
  transform: translateY(-2px);
  background: rgba(172, 206, 234, 0.22);
}
```

Rules:

* Drawers should slide smoothly upward or leftward.
* Options should stay mostly solid and readable.
* Hover effects should be subtle.
* Do not use heavy modal overlays unless the action is blocking.

### 10.4 Code Block Workspace

Code blocks should provide strong contrast while still fitting the pastel scholar aesthetic.

Style:

```css
.code-block {
  background: var(--code-bg);
  color: var(--code-text);
  font-family: var(--font-mono);
  border-radius: var(--radius-lg);
  padding: 20px;
  line-height: 1.6;
  overflow: auto;
}
```

Syntax color guidance:

```css
.token.keyword {
  color: var(--brand-blue);
}

.token.string {
  color: var(--brand-yellow);
}

.token.function {
  color: var(--brand-orange);
}

.token.comment {
  color: var(--text-soft);
}
```

Rules:

* Use dark code blocks in light mode for contrast.
* Avoid harsh neon syntax colors.
* Keep code blocks spacious and readable.
* Use copy buttons with monochrome icons.

### 10.5 Buttons

Primary CTA:

```css
.button-primary {
  border-radius: var(--radius-pill);
  background: var(--text-main);
  color: var(--bg-main);
  padding: 10px 18px;
  font-family: var(--font-ui);
  font-weight: 500;
  transition:
    transform 160ms ease,
    opacity 160ms ease,
    box-shadow 160ms ease;
}

.button-primary:hover {
  transform: translateY(-1px);
  opacity: 0.92;
}
```

Secondary button:

```css
.button-secondary {
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
}
```

Rules:

* Use pill-shaped buttons.
* Default primary CTA should be solid, not gradient.
* Use gradients only for active voice or active progress states.

### 10.6 Icons

Rules:

* Icons should be monochrome by default.
* Use `--text-main`, `--text-muted`, or `--brand-blue`.
* Only active voice, listening, or AI-thinking states may use gradient icons.
* Avoid mixed-color icon sets.
* Avoid generic glowing AI icons.

---

## 11. Motion System

### 11.1 Duration Tokens

```css
--motion-fast: 140ms;
--motion-normal: 220ms;
--motion-slow: 420ms;
--motion-breathing: 3600ms;
```

### 11.2 Easing

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-soft: cubic-bezier(0.16, 1, 0.3, 1);
```

Rules:

* Use short transitions for hover states.
* Use slower motion for AI-thinking and voice-listening states.
* Prefer small movement and opacity changes.
* Avoid bouncing or playful elastic effects.

---

## 12. Noise and Aurora Glow

### 12.1 Noise Texture

Use an SVG noise texture or CSS-generated noise layer.

Rules:

* Noise should be almost invisible.
* Use only inside glow, glass, or active AI states.
* Do not apply strong noise across the entire page.
* Noise should add texture, not visual dirt.

### 12.2 Aurora Glow

Use aurora glow only for:

* Listening mode
* AI thinking mode
* Active progress state
* Important agent execution state

Do not use aurora glow for:

* Normal cards
* Static headings
* Every hover state
* Page background

---

## 13. Accessibility

The visual system must remain accessible and readable.

Rules:

* Maintain sufficient contrast for text.
* Do not rely on color alone to indicate status.
* Use labels, icons, or text status alongside color.
* Respect reduced motion preferences.

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

Focus states:

```css
:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 3px;
}
```

---

## 14. Banned Patterns

The following patterns should be avoided.

### 14.1 Generic AI Visual Identity

Avoid:

* Purple-blue neon gradients as the main visual identity
* Abstract glowing spheres, particles, or 3D blobs
* Magic wand, sparkle, robot, rocket, or brain icons as primary symbols
* Full-screen aurora or rainbow gradient backgrounds
* “AI magic” visual effects that do not explain the product behavior

Allowed alternative:

* Solid calm canvas
* Local pastel accents
* Subtle aurora glow only for active voice or agent-thinking states
* Monochrome functional icons
* Document, text, citation, progress, file, and review-related symbols

---

### 14.2 Generic AI Copywriting

Avoid empty slogans such as:

* “Unlock the power of AI”
* “Supercharge your research”
* “Write smarter with AI”
* “Your AI copilot for everything”
* “Revolutionize your workflow”

Allowed alternative:

Use specific, task-based language:

* “Revise the related work section”
* “Check whether this claim needs a citation”
* “Generate a conference-format outline”
* “Compare reviewer-style critique with current draft”
* “Extract missing evidence from uploaded PDFs”
* “Convert this section to LaTeX”

---

### 14.3 Fake Dashboard Patterns

Avoid:

* Fake dashboards that do not show the actual demo
* Metrics cards without real relation to the workflow
* Generic analytics panels
* Equal-weight modules placed side by side
* Large card grids that make every feature look equally important
* Overly large rounded cards used as the main visual structure

Allowed alternative:

* Show the actual chat, progress, and writing workspace.
* Use the main area for stage-specific output.
* Give visual priority to the current writing task.
* Show real uploaded files, real paper sections, real roadmap steps, and real agent states.

---

### 14.4 Generic AI Playground Patterns

Avoid:

* A plain prompt box plus random output panel
* Side-by-side modules with equal visual weight
* Playground-style controls that do not map to research-writing tasks
* Random model settings as the primary UI
* Unexplained temperature/top-p controls exposed to researchers by default

Allowed alternative:

* Use writing modes instead of raw model parameters.
* Use paper-stage progress instead of generic generation status.
* Use citation/source visibility instead of unexplained output confidence.
* Use editable drafts and reviewer comments instead of static AI output.

---

### 14.5 Generic SaaS Admin Dashboard Patterns

Avoid:

* KPI cards as the main screen
* Large admin-style tables as the default view
* Navigation-heavy sidebars with unrelated sections
* Overuse of generic cards and widgets
* Equal-weight layouts on every screen

Allowed alternative:

* AI Conversation Area + Progress Bar + Stage Workspace
* Minimal navigation
* Contextual controls
* Writing-stage-specific panels
* Clear relationship between user input, agent action, and generated artifact

---

### 14.6 AI-Generated Slide / Pitch Mockup Patterns

Avoid:

* Generic SaaS pitch deck structure
* Repeated three-card layouts
* Equal-weight layouts on every slide or screen
* Fake dashboard mockups that do not show the actual demo
* Visual styles disconnected from the product mechanism
* Generic icons such as rockets, brains, sparkles, and magic wands

Allowed alternative:

* Show a real workflow: upload paper → choose writing mode → roadmap → draft/revision → citation check → export.
* Use screenshots or mockups that reflect the actual product UI.
* Highlight one core interaction per screen.
* Make the agent process visible through progress, comments, and artifacts.

---

## 15. Product-Specific Anti-Patterns

### 15.1 Hiding the Agent Process

Avoid:

* A single loading spinner
* “Generating...” with no detail
* Final text output with no reasoning trail
* No indication of which file or section was used

Use instead:

* Stage progress
* Current agent task
* Source file chips
* Section-level status
* “Used as context” indicators
* Roadmap updates

---

### 15.2 Treating Paper Writing as One-Step Generation

Avoid:

* “Generate full paper” as the main action
* One-click paper creation as the product’s core promise
* Hiding revision stages

Use instead:

* Outline
* Section drafting
* Argument revision
* Citation check
* Reviewer simulation
* Formatting/export

The product should communicate academic responsibility and iterative authorship.

---

### 15.3 Weak Source Visibility

Avoid:

* Claims without source anchors
* Citation suggestions with no reason
* PDF preview disconnected from generated text
* No distinction between user-provided source and AI-generated suggestion

Use instead:

* Source-linked highlights
* Citation TODOs
* Evidence chips
* “Based on uploaded PDF” labels
* Clear distinction between draft text and AI comment

---

### 15.4 Over-Decorated Research Artifacts

Avoid:

* Decorative frames around PDF previews
* Heavy gradients inside paper content
* Floating animated elements over documents
* Motion effects while reading long text

Use instead:

* Clean document surfaces
* High line-height
* Strong text hierarchy
* Minimal borders
* Stable reading state

---

### 15.5 Chat-Only Product Illusion

Avoid making the whole product look like only a chatbot.

The chat is important, but the product must also show:

* Paper roadmap
* Active writing stage
* Draft artifact
* PDF/source context
* Citation review
* Export state

The product should feel like a writing workspace powered by agents, not a chat app with file upload.

---

## 16. Implementation Rules for AI Coding Agents

When generating or modifying frontend code, follow these rules strictly:

1. Preserve the AI Conversation Area + Top Progress Bar + Main Work Area structure.
2. Do not replace the layout with a generic card dashboard.
3. Do not introduce large full-page gradients.
4. Do not use abstract glowing spheres, 3D blobs, particles, robots, rockets, sparkles, or magic wands as primary symbols.
5. Keep the main canvas solid and calm.
6. Use pastel gradients only for the progress bar, voice activation, and AI active states.
7. Keep icons monochrome by default.
8. Use glassmorphism only for cards, drawers, and floating surfaces.
9. Protect long-text readability above all decorative effects.
10. Use Poppins for UI headings and labels, Inter for body text, and JetBrains Mono or Fira Code for code.
11. Respect light and dark mode tokens.
12. Implement responsive behavior without destroying the core writing workflow.
13. Do not change product logic or agent behavior unless explicitly requested.
14. Do not invent new visual languages without updating this file first.
15. Prioritize real demo interaction over decorative mockups.
16. Always show the relationship between user input, agent action, source context, and generated artifact.

---

## 17. Visual Direction Summary

The final interface should feel like:

* A focused academic writing cockpit
* A calm research studio
* A structured paper-production workspace
* A trustworthy agent automation system
* Minimal and precise, but not cold
* Intelligent and modern, but not generic AI SaaS
* Designed for long-form academic work, not short marketing demos
