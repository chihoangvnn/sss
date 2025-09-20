import { Link, useLocation } from "wouter";
import {
  Package2,
  ShoppingCart,
  Users,
  BarChart3,
  Facebook,
  Instagram,
  Twitter,
  Settings,
  Home,
  Zap,
  Store,
  Tags,
  Hash,
  Palette,
  Image,
  Calendar,
  Activity,
  Share2
} from "lucide-react";

// TikTok Icon Component with enhanced styling
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.242 6.242 0 0 1-1.137-.966c-.849-.849-1.347-2.143-1.347-3.416C16.394.482 15.912 0 15.372 0h-3.372c-.54 0-.976.436-.976.976v11.405c0 1.47-1.194 2.665-2.665 2.665s-2.665-1.194-2.665-2.665c0-1.47 1.194-2.665 2.665-2.665.273 0 .537.041.786.117.54.166 1.119-.138 1.285-.678s-.138-1.119-.678-1.285a4.647 4.647 0 0 0-1.393-.203c-2.551 0-4.617 2.066-4.617 4.617s2.066 4.617 4.617 4.617 4.617-2.066 4.617-4.617V6.853c1.346.713 2.88 1.097 4.464 1.097.54 0 .976-.436.976-.976s-.436-.976-.976-.976c-1.346 0-2.64-.524-3.608-1.436z"/>
  </svg>
);

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Core Business Menu Items - Most used daily operations
const coreBusinessItems = [
  {
    title: "Tổng quan",
    url: "/",
    icon: Home,
    gradient: "gradient-teal",
    description: "Dashboard và thống kê tổng quát"
  },
  {
    title: "Sản phẩm",
    url: "/products",
    icon: Package2,
    badge: "24",
    gradient: "gradient-pink",
    description: "Quản lý sản phẩm và kho hàng"
  },
  {
    title: "Đơn hàng",
    url: "/orders",
    icon: ShoppingCart,
    badge: "12",
    gradient: "gradient-pink",
    description: "Theo dõi và xử lý đơn hàng"
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
    gradient: "gradient-purple",
    description: "Quản lý thông tin khách hàng"
  },
  {
    title: "Danh mục",
    url: "/categories",
    icon: Tags,
    gradient: "gradient-mint",
    description: "Tổ chức danh mục sản phẩm"
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    gradient: "gradient-mint",
    description: "Real-time monitoring & insights"
  },
];

// Social Management - Combined social platforms and content tools
const socialManagementItems = [
  {
    title: "Social Media",
    url: "/social-media",
    icon: Share2,
    gradient: "gradient-mint",
    description: "Quản lý các tài khoản mạng xã hội"
  },
  {
    title: "Facebook",
    url: "/facebook-apps",
    icon: Facebook,
    status: "online",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    description: "Quản lý Facebook Pages & Ads"
  },
  {
    title: "Instagram",
    url: "/social-media", 
    icon: Instagram,
    status: "away",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    description: "Instagram Business Account"
  },
  {
    title: "Twitter",
    url: "/social-media",
    icon: Twitter,
    status: "offline",
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    description: "Twitter/X Management"
  },
  {
    title: "TikTok Business",
    url: "/tiktok-business",
    icon: TikTokIcon,
    status: "online",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    description: "TikTok For Business"
  },
  {
    title: "TikTok Shop",
    url: "/tiktok-shop",
    icon: TikTokIcon,
    status: "online",
    color: "text-pink-700",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    description: "TikTok Shop Management"
  },
  {
    title: "Lịch Đăng Bài",
    url: "/post-scheduler",
    icon: Calendar,
    gradient: "gradient-pink",
    description: "Schedule posts across platforms"
  },
  {
    title: "Thư viện Nội dung",
    url: "/content-library", 
    icon: Image,
    gradient: "gradient-teal",
    description: "Quản lý media và nội dung"
  },
];

// Content & Design - Creative and design tools
const contentDesignItems = [
  {
    title: "Storefront",
    url: "/storefront-manager",
    icon: Store,
    gradient: "gradient-purple",
    description: "Quản lý cửa hàng trực tuyến"
  },
  {
    title: "Landing Pages",
    url: "/landing-page-manager",
    icon: Palette,
    gradient: "gradient-teal",
    description: "Tạo và quản lý landing pages"
  },
  {
    title: "Quản lý Tag",
    url: "/tag-management",
    icon: Hash,
    gradient: "gradient-teal",
    description: "Tag cho nội dung và sản phẩm"
  },
];

// Admin & Technical - System administration and configuration
const adminTechnicalItems = [
  {
    title: "Quản lý API",
    url: "/api-management",
    icon: Zap,
    description: "Giám sát và quản lý API endpoints",
    gradient: "gradient-purple"
  },
  {
    title: "Facebook Apps",
    url: "/facebook-apps",
    icon: Settings,
    description: "Quản lý Facebook Apps và webhook",
    gradient: "gradient-mint"
  },
  {
    title: "Groups Manager",
    url: "/groups-manager",
    icon: Users,
    description: "Quản lý groups và posting limits",
    gradient: "gradient-purple"
  },
  {
    title: "Cài đặt Shop",
    url: "/shop-settings",
    icon: Settings,
    description: "Cấu hình cửa hàng",
    gradient: "gradient-pink"
  },
];

// Helper for social platform styling  
const getSocialPlatformClasses = (item: any, location: string) => {
  const isActive = location === item.url;
  
  // Predefined platform color classes to ensure Tailwind generates them
  const platformColors = {
    'text-blue-600': { hover: 'hover:bg-blue-50', active: 'bg-blue-50 text-blue-600 border-blue-200' },
    'text-pink-600': { hover: 'hover:bg-pink-50', active: 'bg-pink-50 text-pink-600 border-pink-200' }, 
    'text-sky-600': { hover: 'hover:bg-sky-50', active: 'bg-sky-50 text-sky-600 border-sky-200' },
    'text-pink-700': { hover: 'hover:bg-pink-50', active: 'bg-pink-50 text-pink-700 border-pink-200' }
  };
  
  const colorConfig = platformColors[item.color as keyof typeof platformColors];
  
  if (item.color && colorConfig) {
    return {
      container: isActive ? colorConfig.active : colorConfig.hover + ' hover:shadow-sm',
      icon: isActive ? item.color : 'text-muted-foreground group-hover:' + item.color
    };
  }
  
  return {
    container: isActive ? 'bg-primary/10 text-primary border-primary/20 border shadow-sm' : 'hover:bg-card/80 hover:shadow-sm',
    icon: isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
  };
};

export function AppSidebar() {
  const [location] = useLocation();
  
  return (
    <Sidebar className="modern-sidebar border-r border-border/50 bg-surface/80 backdrop-blur-xl">
      {/* Modern Header với activity branding */}
      <SidebarHeader className="p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Social Admin
            </h2>
            <p className="text-sm text-muted-foreground/80">Activity Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {/* Main Activity Dashboard */}
        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            📊 CORE BUSINESS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {coreBusinessItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                      location === item.url 
                        ? 'bg-primary/10 text-primary border-primary/20 border shadow-sm' 
                        : 'hover:bg-card/80 hover:shadow-sm'
                    }`}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <div className={`
                        relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                        ${location === item.url 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }
                      `}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{item.title}</span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content & Social Management */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            📱 SOCIAL MANAGEMENT
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {socialManagementItems.map((item) => {
                const styling = getSocialPlatformClasses(item, location);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${styling.container}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 p-3">
                        <div className={`
                          relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                          ${location === item.url 
                            ? (item.color ? `bg-current/10 ${item.color}` : 'bg-primary text-primary-foreground shadow-sm')
                            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }
                        `}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{item.title}</span>
                          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        {item.status && (
                          <div className={`
                            relative w-3 h-3 rounded-full ${
                              item.status === 'online' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse shadow-emerald-500/50' :
                              item.status === 'away' ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-amber-500/50' :
                              'bg-gradient-to-r from-gray-300 to-gray-400'
                            } shadow-sm
                          `}>
                            {item.status === 'online' && (
                              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                            )}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Content & Design - Creative and design tools */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            🎨 CONTENT & DESIGN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {contentDesignItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                      location === item.url 
                        ? 'bg-primary/10 text-primary border-primary/20 border shadow-sm' 
                        : 'hover:bg-card/80 hover:shadow-sm'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <div className={`
                        relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                        ${location === item.url 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }
                      `}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{item.title}</span>
                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin & Settings */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            ⚙️ ADMIN & TECHNICAL
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {adminTechnicalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                      location === item.url 
                        ? 'bg-primary/10 text-primary border-primary/20 border shadow-sm' 
                        : 'hover:bg-card/80 hover:shadow-sm'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <div className={`
                        relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                        ${location === item.url 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }
                      `}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{item.title}</span>
                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Modern Footer với user profile */}
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-all duration-200">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Admin" />
              <AvatarFallback className="bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold">
                SA
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Social Admin</p>
            <p className="text-xs text-muted-foreground/70 truncate">admin@social-manager.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}