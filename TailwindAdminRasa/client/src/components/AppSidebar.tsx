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
  Globe,
  Palette,
  Tags,
  Building2
} from "lucide-react";

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

const integrationItems = [
  {
    title: "Chatbot RASA",
    url: "/chatbot",
    icon: Bot,
    status: "online",
  },
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
                  isActive={location === "/store"}
                  data-testid="nav-landing-preview"
                >
                  <Link href="/store">
                    <Globe className="h-4 w-4" />
                    <span>Xem Landing Page</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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