import React from 'react';
import AppLayout from '@/components/AppLayout';
import AdminPanelContent from './components/AdminPanelContent';

export default function AdminPanelPage() {
  return (
    <AppLayout activeRoute="/admin-panel">
      <AdminPanelContent />
    </AppLayout>
  );
}