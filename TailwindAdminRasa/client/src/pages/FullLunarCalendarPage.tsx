import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { FullScreenLunarCalendar } from '@/components/FullScreenLunarCalendar';
import { StorefrontBottomNav } from '@/components/StorefrontBottomNav';

export default function FullLunarCalendarPage() {
  const [, setLocation] = useLocation();
  const [cartCount] = useState(0); // Can be integrated with cart context later

  const handleBack = () => {
    // Điều hướng về storefront
    setLocation('/mobile');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'calendar') {
      // Stay on current page
      return;
    }
    // Navigate back to mobile storefront with selected tab
    setLocation('/mobile', { state: { activeTab: tab } });
  };

  return (
    <div className="relative min-h-screen">
      {/* Calendar component with padding bottom to avoid bottom nav overlap */}
      <div className="pb-20">
        <FullScreenLunarCalendar onBack={handleBack} />
      </div>
      
      {/* Bottom Navigation */}
      <StorefrontBottomNav
        activeTab="calendar"
        onTabChange={handleTabChange}
        cartCount={cartCount}
        wishlistCount={0}
      />
    </div>
  );
}