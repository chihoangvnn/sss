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
  Calendar
} from "lucide-react";

// TikTok Icon Component
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

const mainMenuItems = [
  {
    title: "Tổng quan",
    url: "/",
    icon: Home,
  },
  {
    title: "Sản phẩm",
    url: "/products",
    icon: Package2,
    badge: "24",
  },
  {
    title: "Ngành hàng",
    url: "/industries",
    icon: Building2,
  },
  {
    title: "Danh mục",
    url: "/categories",
    icon: Tags,
  },
  {
    title: "🏷️ Quản lý Tag",
    url: "/tag-management",
    icon: Hash,
  },
  {
    title: "Đơn hàng",
    url: "/orders",
    icon: ShoppingCart,
    badge: "12",
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Kho hàng",
    url: "/inventory",
    icon: Store,
  },
  {
    title: "Báo cáo",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "📷 Thư viện Nội dung",
    url: "/content-library", 
    icon: Image,
  },
  {
    title: "📅 Lịch Đăng Bài",
    url: "/post-scheduler",
    icon: Calendar,
  },
  {
    title: "Quản lý Storefront",
    url: "/storefront-manager",
    icon: Store,
  },
  {
    title: "Cài đặt Shop",
    url: "/shop-settings",
    icon: Settings,
  },
];

// Chatbot management menu items (temporarily pointing to existing route)
const chatbotMenuItems = [
  {
    title: "Test Bot",
    url: "/chatbot",
    icon: MessageSquare,
    description: "Chat và test bot trực tiếp"
  },
  {
    title: "Cài đặt Bot",
    url: "/chatbot",
    icon: Settings,
    description: "Cấu hình bot, tên, avatar, ngôn ngữ"
  },
  {
    title: "Quản lý Câu trả lời",
    url: "/chatbot",
    icon: FileText,
    description: "Chỉnh sửa intents và responses"
  },
  {
    title: "Thống kê Bot",
    url: "/chatbot",
    icon: BarChart3,
    description: "Analytics cuộc hội thoại và hiệu suất"
  },
];

const integrationItems = [
  {
    title: "Facebook",
    url: "/facebook",
    icon: Facebook,
    status: "online",
  },
  {
    title: "Instagram",
    url: "/instagram", 
    icon: Instagram,
    status: "away",
  },
  {
    title: "Twitter",
    url: "/twitter",
    icon: Twitter,
    status: "offline",
  },
  {
    title: "TikTok Business",
    url: "/tiktok-business",
    icon: TikTokIcon,
    status: "online",
  },
  {
    title: "TikTok Shop",
    url: "/tiktok-shop",
    icon: TikTokIcon,
    status: "online",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "online": return "bg-green-500";
    case "away": return "bg-yellow-500";
    case "offline": return "bg-gray-400";
    default: return "bg-gray-400";
  }
};

export function AppSidebar() {
  const [location] = useLocation();
  
  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">SAM Admin</h2>
            <p className="text-sm text-muted-foreground">Quản lý bán hàng</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
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

        <SidebarGroup>
          <SidebarGroupLabel>Quản lý Chatbot</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatbotMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`chatbot-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tích hợp mạng xã hội</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {integrationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`integration-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      <div className={`ml-auto h-2 w-2 rounded-full ${getStatusColor(item.status)}`} />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Landing Page</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === "/landing-page-manager"}
                  data-testid="nav-landing-manager"
                >
                  <Link href="/landing-page-manager">
                    <Palette className="h-4 w-4" />
                    <span>Quản lý Landing Page</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@eshop.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}