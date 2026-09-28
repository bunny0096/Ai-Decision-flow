import { Inngest } from 'inngest';

// Initialize the Inngest client with unique app id
export const inngest = new Inngest({
  id: 'ai-decision-workflow',
  name: 'AI Decision Workflow Engine',
  isDev: process.env.NODE_ENV !== 'production' || process.env.INNGEST_DEV === '1',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
