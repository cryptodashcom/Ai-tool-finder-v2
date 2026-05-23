import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgentsDash Automation',
  description: 'AI Agent Discovery & Publishing Automation System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#040b14' }}>{children}</body>
    </html>
  );
}
