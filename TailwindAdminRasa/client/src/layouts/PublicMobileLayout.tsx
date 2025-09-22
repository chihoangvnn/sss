interface PublicMobileLayoutProps {
  children: React.ReactNode;
}

export function PublicMobileLayout({ children }: PublicMobileLayoutProps) {
  return (
    <div className="shopee-mobile-app min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Full-screen mobile layout - no admin sidebar or navigation */}
      <div className="w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}