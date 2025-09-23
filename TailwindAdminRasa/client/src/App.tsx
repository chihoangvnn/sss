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
import { AnalyticsDashboard as Analytics } from "@/pages/AnalyticsDashboard";
import Chatbot from "@/pages/Chatbot";
import SocialMedia from "@/pages/SocialMedia";
import LandingPage from "@/pages/LandingPage";
import ProductLandingPageManager from "@/pages/ProductLandingPageManager";
import LandingPageEditor from "@/pages/LandingPageEditor";
import PublicLandingPage from "@/pages/PublicLandingPage";
import PublicStorefront from "@/pages/PublicStorefront";
import StorefrontManager from "@/pages/StorefrontManager";
import CategoryManager from "@/pages/CategoryManager";
import TagManagement from "@/pages/TagManagement";
import IndustryManager from "@/pages/IndustryManager";
import ShopSettings from "@/pages/ShopSettings";
import { ContentLibrary } from "@/pages/ContentLibrary";
import { PostScheduler } from "@/pages/PostScheduler";
import FacebookAppsManager from "@/pages/FacebookAppsManager";
import GroupsManager from "@/pages/GroupsManager";
import TikTokBusiness from "@/pages/TikTokBusiness";
import TikTokShop from "@/pages/TikTokShop";
import Shopee from "@/pages/Shopee";
import Satellites from "@/pages/Satellites";
import ApiManagement from "@/pages/ApiManagement";
import WorkerManagement from "@/components/WorkerManagement";
import NotFound from "@/pages/not-found";
import ProductPage from "@/pages/ProductPage";
import ReviewManagement from "@/pages/ReviewManagement";
import ShopeeHomePage from "@/pages/ShopeeHomePage";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SocialMediaHub } from "@/components/SocialMediaHub";
import { TemplateBuilder } from "@/components/template-builder/TemplateBuilder";
import RasaDashboard from "@/pages/RasaDashboard";

// Admin Routes (inside sidebar layout)
function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/store" component={LandingPage} />
      <Route path="/landing-page-manager" component={ProductLandingPageManager} />
      <Route path="/landing-page-editor" component={LandingPageEditor} />
      <Route path="/landing-page-editor/:id" component={LandingPageEditor} />
      <Route path="/storefront-manager" component={StorefrontManager} />
      <Route path="/products" component={Products} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetails} />
      <Route path="/customers" component={Customers} />
      <Route path="/customers/:id" component={CustomerDetails} />
      <Route path="/categories" component={CategoryManager} />
      <Route path="/tag-management" component={TagManagement} />
      <Route path="/industries" component={IndustryManager} />
      <Route path="/shop-settings" component={ShopSettings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/review-management" component={ReviewManagement} />
      <Route path="/chatbot" component={Chatbot} />
      <Route path="/content-library" component={ContentLibrary} />
      <Route path="/post-scheduler" component={PostScheduler} />
      <Route path="/facebook-apps" component={FacebookAppsManager} />
      <Route path="/groups-manager" component={GroupsManager} />
      <Route path="/facebook" component={SocialMedia} />
      <Route path="/instagram" component={() => { window.location.href = '/social-media'; return null; }} />
      <Route path="/twitter" component={() => { window.location.href = '/social-media'; return null; }} />
      <Route path="/social-media" component={SocialMediaHub} />
      <Route path="/tiktok-business" component={TikTokBusiness} />
      <Route path="/tiktok-shop" component={TikTokShop} />
      <Route path="/shopee" component={Shopee} />
      <Route path="/satellites" component={Satellites} />
      <Route path="/api-management" component={ApiManagement} />
      <Route path="/worker-management" component={WorkerManagement} />
      <Route path="/rasa-dashboard" component={RasaDashboard} />
      <Route path="/template-builder" component={() => <TemplateBuilder className="h-screen" />} />
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
        {/* Public Routes (outside admin layout) */}
        <Switch>
          <Route path="/shopee" component={ShopeeHomePage} />
          <Route path="/lp/:slug" component={PublicLandingPage} />
          <Route path="/sf/:name" component={PublicStorefront} />
          <Route path="/product/:slug" component={ProductPage} />
          <Route>
            {/* Admin Routes (inside sidebar layout) */}
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <main className="flex-1 overflow-auto bg-background mobile-content-padding">
                  <AdminRouter />
                </main>
              </div>
            </SidebarProvider>
            
            {/* Modern Mobile Bottom Navigation - only for admin routes */}
            <MobileBottomNav />
          </Route>
        </Switch>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
