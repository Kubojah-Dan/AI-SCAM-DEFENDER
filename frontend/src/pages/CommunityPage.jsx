import React from 'react';
import AppShell from '../Components/AppShell';
import CommunityThreatFeed from '../Components/CommunityThreatFeed';

export default function CommunityPage() {
  return (
    <AppShell title="Community Threat Feed">
      <CommunityThreatFeed />
    </AppShell>
  );
}
