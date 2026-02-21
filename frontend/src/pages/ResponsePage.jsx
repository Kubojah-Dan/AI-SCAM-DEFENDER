import React from 'react';
import AppShell from '../Components/AppShell';
import IncidentResponse from '../Components/IncidentResponse';

export default function ResponsePage() {
  return (
    <AppShell title="Incident Response">
      <IncidentResponse />
    </AppShell>
  );
}
