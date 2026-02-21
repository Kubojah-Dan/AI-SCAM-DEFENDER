import React from 'react';
import AppShell from '../Components/AppShell';
import SandboxAnalysis from '../Components/SandboxAnalysis';

export default function SandboxPage() {
  return (
    <AppShell title="Secure Sandbox Analysis">
      <SandboxAnalysis />
    </AppShell>
  );
}
