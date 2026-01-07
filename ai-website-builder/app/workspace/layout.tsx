"use client";
import { SidebarProvider } from '@/components/ui/sidebar';
import React, { useState } from 'react';
import { AppSidebar } from './_components/AppSidebar';
import AppHeader from './_components/AppHeader';
import { UserDetailContext } from '@/context/UserDetailContext';

function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize state to hold the user details
  const [userDetail, setUserDetail] = useState<any>();

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <SidebarProvider>
        <AppSidebar />
        <div className='w-full'>
          <AppHeader />
          {children}
        </div>
      </SidebarProvider>
    </UserDetailContext.Provider>
  );
}

export default WorkspaceLayout;