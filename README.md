# AI Decision Flow ⚡

A visual, durable AI workflow system where each node represents a binary AI decision step that evaluates input context and routes execution along a **YES** or **NO** path. Workflow orchestration and step execution are powered by **Inngest**, while the graph is visualized and manipulated using **React Flow**.

---

## 🌟 Key Features Across All 4 Phases

### Phase 1: Setup & Architecture
- **Framework**: Next.js 16 (App Router) with TypeScript & React 19.
- **Orchestration**: Inngest SDK (`inngest`) & Inngest CLI dev server integration (`npx inngest dev`).
- **Graph Engine**: `@xyflow/react` with custom styled nodes, edges, handles, background grid, and minimap.
- **AI Engine**: OpenAI SDK (`openai`) with automatic fallback to an intelligent semantic simulator when an API key is not supplied, allowing zero-friction instant testing.
- **Design System**: Dark mode UI with glassmorphism, glowing status badges, vibrant emerald/rose edge lines, and sleek micro-animations.

### Phase 2: Visual Flow Editor & Graph Foundations
- **Interactive React Flow Canvas**: Pan, zoom, multi-select, fit-view, and minimap.
- **Custom AI Decision Node**:
  - Single input handle on top.
  - Dedicated **YES** output handle (Emerald green).
  - Dedicated **NO** output handle (Rose red).
  - In-place editable prompts and titles.
  - Per-node test button to evaluate prompts independently.
- **Custom Terminal Action Node**: Represents end actions (e.g., paging on-call engineers, routing to VIP sales).
- **Custom Decision Edges**:
  - Color-coded paths (YES in emerald, NO in rose).
  - Center badges indicating branch condition.
  - Auto-assigned branch types when connecting handles.
- **State Persistence**: Graph state, custom nodes, edges, and test inputs auto-save to `localStorage`.

### Phase 3: Core Durable Inngest Execution
- **Step-Mapped Execution**: Each node in the workflow corresponds to an Inngest step (`step.run`), ensuring durable, auditable, and replayable execution.
- **Binary Decision Logic**: Prompts are evaluated against the current test input, returning strictly `YES` or `NO` with a 1–2 sentence reasoning statement.
- **Dynamic Branch Traversal**: Follows the active edge corresponding to the AI's decision to route to the next node.
- **Execution Tracking**: Complete record of step index, node ID, prompt, decision, reasoning, duration (ms), and timestamp.

### Phase 4: Polish & Developer Experience
- **Visual Execution State**: Real-time glow, pulse animations on active nodes, and glowing emerald/rose badges upon evaluation.
- **Animated Active Edges**: When an edge is traversed, it triggers a glowing dashed flow animation while untaken paths dim smoothly.
- **Live Logs Panel & Drawer**: Bottom drawer showing real-time step timelines, execution latencies, raw JSON payloads, and collapsible reasoning cards.
- **Save/Load & Preset Workflows**:
  - *Customer Support vs Sales Triage*: Outage check → P1 On-Call vs Tier 1 Support; Enterprise check → VIP Sales vs Self-Serve.
  - *Content Moderation & Spam Filter*: Toxic speech → Ban; Spam links → Quarantine; Clean → Publish.
  - *Blank Flow*: Start building from scratch.
- **JSON Import / Export**: Instant backup, export, and import of workflow graph definitions.
- **Execution History & Replay**: Review past runs and replay their execution paths directly on the visual canvas.
- **Speed Control**: Toggle between Fast (0.4s), Normal (1s), and Slow (2s) step delays for demonstrations.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Optional)* Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=sk-...
```
> **Note**: If `OPENAI_API_KEY` is not provided, the application automatically uses an intelligent semantic decision simulator with reasoning so you can test all workflows immediately out of the box!

### 3. Start the Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Start the Inngest Dev Server
In a separate terminal window, run:
```bash
npm run inngest:dev
```
Open [http://localhost:8288](http://localhost:8288) to access the Inngest Dev Server dashboard. It will automatically detect your registered function:
- `execute-ai-workflow` (`workflow/execute`)

---

## 🛠️ Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/decision/route.ts            # Single prompt AI evaluation API
│   │   │   ├── inngest/route.ts                # Inngest HTTP serve endpoint
│   │   │   ├── workflows/execute-interactive/  # Interactive step-by-step runner
│   │   │   ├── workflows/run/route.ts          # Dispatches execution event to Inngest
│   │   │   └── workflows/runs/                 # Run status & history APIs
│   │   ├── globals.css                         # Tailwind CSS, glow & React Flow animations
│   │   ├── layout.tsx                          # Root layout with dark mode
│   │   └── page.tsx                            # Main page rendering WorkflowCanvas
│   ├── components/
│   │   └── flow/
│   │       ├── edges/
│   │       │   └── DecisionEdge.tsx            # Custom YES/NO edge with animated pulse
│   │       ├── nodes/
│   │       │   ├── ActionNode.tsx              # Terminal action endpoint node
│   │       │   └── DecisionNode.tsx            # Dual-handle AI decision step node
│   │       ├── HeaderToolbar.tsx               # Preset selector, Run button, JSON export
│   │       ├── InputPanel.tsx                  # Workflow test input & quick sample chips
│   │       ├── LogsPanel.tsx                   # Live execution steps & history drawer
│   │       └── WorkflowCanvas.tsx              # React Flow main canvas orchestrator
│   ├── lib/
│   │   ├── ai/
│   │   │   └── decide.ts                       # OpenAI API & semantic evaluator fallback
│   │   ├── inngest/
│   │   │   ├── client.ts                       # Inngest client initialization
│   │   │   └── functions.ts                    # Inngest durable step execution function
│   │   ├── execution-store.ts                  # In-memory execution state store
│   │   └── presets.ts                          # Pre-built workflow templates
│   └── types/
│       └── workflow.ts                         # Complete TypeScript definitions
```

---

## 🧪 Testing the Workflow

1. Open [http://localhost:3000](http://localhost:3000).
2. Select a preset (e.g. **Customer Support vs Sales Triage**).
3. Choose a quick sample input chip or enter your own:
   - *Example 1*: `"Our production database crashed with 500 errors! Production is completely down."`
     - Evaluates: Support Request? → **YES**
     - Evaluates: Critical Outage? → **YES**
     - Routes to: **P1 Incident Escalation**
   - *Example 2*: `"We are looking to buy 350 enterprise licenses with custom SLA and security review."`
     - Evaluates: Support Request? → **NO**
     - Evaluates: Sales Intent? → **YES**
     - Routes to: **Enterprise Sales VIP**
4. Click **Run Workflow**:
   - Watch the nodes illuminate and pulse as Inngest steps execute.
   - Watch the active edges glow with animated dashed flow lines.
   - Open the **Execution Logs** panel at the bottom to inspect AI reasoning, execution times, and raw payloads.

---

## 📄 License
MIT
