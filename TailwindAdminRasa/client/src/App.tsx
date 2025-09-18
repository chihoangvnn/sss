import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Pages
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import Analytics from "@/pages/Analytics";
import Chatbot from "@/pages/Chatbot";
import SocialMedia from "@/pages/SocialMedia";
import LandingPage from "@/pages/LandingPage";
import ProductLandingPageManager from "@/pages/ProductLandingPageManager";
import LandingPageEditor from "@/pages/LandingPageEditor";
import PublicLandingPage from "@/pages/PublicLandingPage";
import PublicStorefront from "@/pages/PublicStorefront";
import StorefrontManager from "@/pages/StorefrontManager";
import CategoryManager from "@/pages/CategoryManager";
import IndustryManager from "@/pages/IndustryManager";
import ShopSettings from "@/pages/ShopSettings";
import { ContentLibrary } from "@/pages/ContentLibrary";
import { PostScheduler } from "@/pages/PostScheduler";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/store" component={LandingPage} />
      <Route path="/landing-page-manager" component={ProductLandingPageManager} />
      <Route path="/landing-page-editor" component={LandingPageEditor} />
      <Route path="/landing-page-editor/:id" component={LandingPageEditor} />
      <Route path="/lp/:slug" component={PublicLandingPage} />
      <Route path="/sf/:name" component={PublicStorefront} />
      <Route path="/storefront-manager" component={StorefrontManager} />
      <Route path="/products" component={Products} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetails} />
      <Route path="/customers" component={Customers} />
      <Route path="/customers/:id" component={CustomerDetails} />
      <Route path="/categories" component={CategoryManager} />
      <Route path="/industries" component={IndustryManager} />
      <Route path="/shop-settings" component={ShopSettings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/chatbot" component={Chatbot} />
      <Route path="/content-library" component={ContentLibrary} />
      <Route path="/post-scheduler" component={PostScheduler} />
      <Route path="/facebook" component={SocialMedia} />
      <Route path="/instagram" component={SocialMedia} />
      <Route path="/twitter" component={SocialMedia} />
      <Route path="/tiktok-business" component={SocialMedia} />
      <Route path="/tiktok-shop" component={SocialMedia} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Custom sidebar width for e-commerce admin
  const style = {
    "--sidebar-width": "20rem",       // 320px for better navigation
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div>
                    <h1 className="text-lg font-semibold">E-Commerce Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Hệ thống quản lý bán hàng thông minh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
