'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AppLayout from '@/components/AppLayout';
import AdminPanelContent from './components/AdminPanelContent';

export default function AdminPanelPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Check karein ki user logged in hai aur wahi email hai jo aapki hai
      if (!user || user.email !== 'raushankr10102004@gmail.com') {
        alert('Access Denied: Aapke paas admin panel ki permission nahi hai!');
        router.push('/'); // Unauthorized hone par home page par bhej dega
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout activeRoute="/admin-panel">
      <AdminPanelContent />
    </AppLayout>
  );
}