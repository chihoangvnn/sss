import { Link, useLocation } from "wouter";
import {
  Home,
  ShoppingCart,
  Users,
  BarChart3,
  Facebook,
  Plus,
  Activity,
  Zap,
  MessageSquare,
  Store,
  ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Mobile nav items with activity manager styling
const mobileNavItems = [
  {
    title: "Trang chủ",
    url: "/",
    icon: Home,
    color: "text-[hsl(var(--activity-teal))]",
    activeColor: "text-[hsl(var(--activity-teal))]",
    bgColor: "bg-[hsl(var(--activity-teal))]/10 dark:bg-[hsl(var(--activity-teal))]/20"
  },
  {
    title: "Đơn hàng",
    url: "/orders", 
    icon: ShoppingCart,
    badge: "12",
    color: "text-[hsl(var(--activity-pink))]",
    activeColor: "text-[hsl(var(--activity-pink))]",
    bgColor: "bg-[hsl(var(--activity-pink))]/10 dark:bg-[hsl(var(--activity-pink))]/20"
  },
  {
    title: "Shopee",
    url: "/shopee",
    icon: ShoppingBag,
    color: "text-orange-600", 
    activeColor: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20"
  },
  {
    title: "TikTok Shop",
    url: "/tiktok-shop",
    icon: ShoppingBag,
    color: "text-pink-600", 
    activeColor: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20"
  },
];

// Floating action menu items
const quickActions = [
  {
    title: "Thêm sản phẩm",
    url: "/products",
    icon: Store,
    color: "text-[hsl(var(--activity-teal))]"
  },
  {
    title: "Chat Bot",
    url: "/chatbot",
    icon: MessageSquare,
    color: "text-[hsl(var(--activity-pink))]"
  },
  {
    title: "Content",
    url: "/content-library", 
    icon: Activity,
    color: "text-[hsl(var(--activity-purple))]"
  },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowQuickActions(false)}
        >
          <div className="absolute bottom-24 right-6 space-y-3">
            {quickActions.map((action, index) => (
              <Link 
                key={action.title}
                href={action.url}
                onClick={() => setShowQuickActions(false)}
                aria-label={`Quick action: ${action.title}`}
                className="block"
              >
                <div className="activity-btn group flex items-center gap-3 bg-surface/95 backdrop-blur-lg border border-border/50 px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className={`p-2 rounded-xl bg-muted/50 ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground pr-2">
                    {action.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur */}
        <div className="bg-surface/95 backdrop-blur-xl border-t border-border/50 px-4 py-2">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {/* Navigation Items */}
            {mobileNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location === item.url || 
                (item.url === '/facebook' && location.includes('/facebook')) ||
                (item.url === '/facebook' && location.includes('/instagram')) ||
                (item.url === '/facebook' && location.includes('/twitter')) ||
                (item.url === '/facebook' && location.includes('/tiktok'));

              return (
                <Link key={item.title} href={item.url} aria-label={`Navigate to ${item.title}`}>
                  <div className={`
                    relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300
                    ${isActive 
                      ? `${item.bgColor} ${item.activeColor} shadow-sm scale-110` 
                      : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:scale-105'
                    }
                  `}>
                    {/* Icon with background */}
                    <div className={`
                      relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-current/10' 
                        : 'bg-transparent group-hover:bg-current/5'
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                      )}

                      {/* Badge for notifications */}
                      {item.badge && (
                        <div className="absolute -top-1 -right-1">
                          <Badge 
                            variant="destructive" 
                            className="h-5 w-5 p-0 text-xs rounded-full bg-gradient-to-r from-red-500 to-red-600 border-2 border-background animate-pulse"
                          >
                            {item.badge}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span className={`
                      text-xs font-medium transition-all duration-200 
                      ${isActive ? 'opacity-100' : 'opacity-70'}
                    `}>
                      {item.title}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Floating Action Button */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                aria-label={showQuickActions ? "Close quick actions menu" : "Open quick actions menu"}
                className={`
                  fab relative flex items-center justify-center w-14 h-14 rounded-full 
                  bg-gradient-to-r from-[hsl(var(--activity-teal))] to-[hsl(var(--activity-teal))]/80 text-white shadow-xl hover:shadow-2xl
                  transition-all duration-300 hover:scale-110 active:scale-95
                  ${showQuickActions ? 'rotate-45' : 'rotate-0'}
                `}
              >
                <Plus className="h-6 w-6" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--activity-teal))]/60 to-[hsl(var(--activity-teal))]/80 animate-ping opacity-20"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-surface/95"></div>
      </div>
    </>
  );
}