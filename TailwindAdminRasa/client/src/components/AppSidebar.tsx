import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Package2,
  ShoppingCart,
  Users,
  BarChart3,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Settings,
  Home,
  Zap,
  Store,
  Bot,
  Tags,
  Hash,
  Building2,
  FileText,
  Palette,
  Image,
  Calendar,
  Activity,
  TrendingUp
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

// Modern Activity Manager Menu Items with enhanced styling
const mainMenuItems = [
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
    title: "Ngành hàng",
    url: "/industries",
    icon: Building2,
    gradient: "gradient-purple",
    description: "Phân loại ngành hàng kinh doanh"
  },
  {
    title: "Danh mục",
    url: "/categories",
    icon: Tags,
    gradient: "gradient-mint",
    description: "Tổ chức danh mục sản phẩm"
  },
  {
    title: "Quản lý Tag",
    url: "/tag-management",
    icon: Hash,
    gradient: "gradient-teal",
    description: "Tag cho nội dung và sản phẩm"
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
    title: "Báo cáo",
    url: "/analytics",
    icon: BarChart3,
    gradient: "gradient-mint",
    description: "Analytics và insights chi tiết"
  },
];

// Content & Social Menu with activity styling
const contentMenuItems = [
  {
    title: "Thư viện Nội dung",
    url: "/content-library", 
    icon: Image,
    gradient: "gradient-teal",
    description: "Quản lý media và nội dung"
  },
  {
    title: "Lịch Đăng Bài",
    url: "/post-scheduler",
    icon: Calendar,
    gradient: "gradient-pink",
    description: "Schedule posts across platforms"
  },
  {
    title: "Storefront",
    url: "/storefront-manager",
    icon: Store,
    gradient: "gradient-purple",
    description: "Quản lý cửa hàng trực tuyến"
  },
];

// Chatbot management với modern styling
const chatbotMenuItems = [
  {
    title: "Test Bot",
    url: "/chatbot",
    icon: MessageSquare,
    description: "Chat và test bot trực tiếp",
    gradient: "gradient-teal"
  },
  {
    title: "Cài đặt Bot",
    url: "/chatbot",
    icon: Bot,
    description: "Cấu hình bot, tên, avatar",
    gradient: "gradient-pink"
  },
  {
    title: "Thống kê Bot",
    url: "/chatbot",
    icon: TrendingUp,
    description: "Analytics cuộc hội thoại",
    gradient: "gradient-purple"
  },
];

// Integration items với activity status
const integrationItems = [
  {
    title: "Facebook",
    url: "/facebook",
    icon: Facebook,
    status: "online",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20"
  },
  {
    title: "Instagram",
    url: "/instagram", 
    icon: Instagram,
    status: "away",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20"
  },
  {
    title: "Twitter",
    url: "/twitter",
    icon: Twitter,
    status: "offline",
    color: "text-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/20"
  },
  {
    title: "TikTok Business",
    url: "/tiktok-business",
    icon: TikTokIcon,
    status: "online",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20"
  },
  {
    title: "TikTok Shop",
    url: "/tiktok-shop",
    icon: TikTokIcon,
    status: "online",
    color: "text-pink-700",
    bgColor: "bg-pink-50 dark:bg-pink-950/20"
  },
];

// Admin items
const adminItems = [
  {
    title: "Facebook Apps",
    url: "/facebook-apps",
    icon: Settings,
    description: "Quản lý Facebook Apps và webhook",
    gradient: "gradient-mint"
  },
  {
    title: "Landing Pages",
    url: "/landing-page-manager",
    icon: Palette,
    description: "Tạo và quản lý landing pages",
    gradient: "gradient-teal"
  },
  {
    title: "Cài đặt Shop",
    url: "/shop-settings",
    icon: Settings,
    description: "Cấu hình cửa hàng",
    gradient: "gradient-pink"
  },
];

// Modern status indicator với activity colors
const getStatusConfig = (status: string) => {
  switch (status) {
    case "online": 
      return {
        color: "bg-gradient-to-r from-emerald-400 to-emerald-500",
        pulse: "animate-pulse",
        glow: "shadow-emerald-500/50"
      };
    case "away": 
      return {
        color: "bg-gradient-to-r from-amber-400 to-amber-500", 
        pulse: "",
        glow: "shadow-amber-500/50"
      };
    case "offline": 
      return {
        color: "bg-gradient-to-r from-gray-300 to-gray-400",
        pulse: "",
        glow: ""
      };
    default: 
      return {
        color: "bg-gradient-to-r from-gray-300 to-gray-400",
        pulse: "",
        glow: ""
      };
  }
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
            📊 Hoạt động chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item) => (
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
            📱 Nội dung & Social
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {contentMenuItems.map((item) => (
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

        {/* AI Chatbot Section */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            🤖 AI Assistant
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {chatbotMenuItems.map((item) => (
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

        {/* Social Platforms với live status */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            🌐 Tích hợp Social
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {integrationItems.map((item) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                        location === item.url 
                          ? `${item.bgColor} ${item.color} border border-current/20 shadow-sm` 
                          : `hover:${item.bgColor} hover:shadow-sm`
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 p-3">
                        <div className={`
                          relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                          ${location === item.url 
                            ? `bg-current/10 ${item.color}` 
                            : `bg-muted/50 text-muted-foreground group-hover:${item.color} group-hover:bg-current/10`
                          }
                        `}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm flex-1">{item.title}</span>
                        <div className={`
                          relative w-3 h-3 rounded-full ${statusConfig.color} ${statusConfig.pulse} 
                          shadow-sm ${statusConfig.glow}
                        `}>
                          {item.status === 'online' && (
                            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin & Settings */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3">
            ⚙️ Quản trị
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {adminItems.map((item) => (
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