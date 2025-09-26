import React from 'react';
import { useLocation } from 'wouter';
import { FullScreenLunarCalendar } from '@/components/FullScreenLunarCalendar';

export default function FullLunarCalendarPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Điều hướng về storefront
    setLocation('/mobile');
  };

  return (
    <FullScreenLunarCalendar onBack={handleBack} />
  );
}