import { WorkflowCanvas } from '@/components/flow/WorkflowCanvas';

export const metadata = {
  title: 'AI Decision Flow | Visual Inngest & LLM Decision System',
  description:
    'Visual AI workflow execution engine where nodes represent binary AI decision steps (YES/NO) executed with Inngest and visualized using React Flow.',
};

export default function Home() {
  return <WorkflowCanvas />;
}
