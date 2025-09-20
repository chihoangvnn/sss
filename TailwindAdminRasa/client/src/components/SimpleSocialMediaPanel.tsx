import React, { useState } from "react";
import { Facebook, MessageSquare, Settings, Users, Activity, Zap } from "lucide-react";
import { FacebookChatManager } from "./FacebookChatManager";
import { FacebookConnectButton } from "./FacebookConnectButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SocialAccount } from "@shared/schema";

interface SimpleSocialMediaPanelProps {
  onConnectAccount?: (platform: string) => void;
  onToggleAccount?: (accountId: string, enabled: boolean) => void;
}

export function SimpleSocialMediaPanel({ 
  onConnectAccount, 
  onToggleAccount 
}: SimpleSocialMediaPanelProps) {
  const [activeTab, setActiveTab] = useState("chat");

  // Fetch Facebook accounts
  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
  });

  const facebookAccounts = accounts.filter(acc => acc.platform === 'facebook');

  const handleFacebookConnect = () => {
    window.location.href = '/api/facebook/auth';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Modern Activity Manager Header */}
      <div className="activity-card relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--activity-teal))]/10 via-[hsl(var(--activity-pink))]/5 to-[hsl(var(--activity-purple))]/10 pointer-events-none" />
        
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            {/* Left side - Main info */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--activity-teal))] to-[hsl(var(--activity-mint))] rounded-2xl flex items-center justify-center shadow-lg">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
                {/* Activity indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-[hsl(var(--activity-mint))] to-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--activity-teal))] to-[hsl(var(--activity-mint))] bg-clip-text text-transparent">
                  Social Media Manager
                </h1>
                <p className="text-foreground/70 text-lg font-medium">
                  Quản lý tất cả kênh truyền thông xã hội
                </p>
                <p className="text-foreground/50 text-sm">
                  Trò chuyện với khách hàng và quản lý pipeline bán hàng
                </p>
              </div>
            </div>
            
            {/* Right side - Activity stats */}
            <div className="flex items-center gap-4">
              <div className="text-center p-4 rounded-2xl bg-[hsl(var(--activity-teal))]/10 border border-[hsl(var(--activity-teal))]/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-[hsl(var(--activity-teal))]" />
                  <span className="text-2xl font-bold text-[hsl(var(--activity-teal))]">{facebookAccounts.length}</span>
                </div>
                <p className="text-xs font-medium text-foreground/60">Tài khoản</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-[hsl(var(--activity-pink))]/10 border border-[hsl(var(--activity-pink))]/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-[hsl(var(--activity-pink))]" />
                  <span className="text-2xl font-bold text-[hsl(var(--activity-pink))]">
                    {facebookAccounts.filter(acc => acc.connected).length}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground/60">Kết nối</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Activity Manager Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-surface/50 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-sm">
          <TabsTrigger 
            value="chat" 
            className="flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--activity-teal))]/20 data-[state=active]:to-[hsl(var(--activity-mint))]/10 data-[state=active]:border data-[state=active]:border-[hsl(var(--activity-teal))]/30 data-[state=active]:shadow-lg hover:scale-105"
          >
            <div className="p-2 rounded-lg bg-[hsl(var(--activity-teal))]/10">
              <MessageSquare className="w-4 h-4 text-[hsl(var(--activity-teal))]" />
            </div>
            <span className="font-semibold">Tin nhắn</span>
          </TabsTrigger>
          <TabsTrigger 
            value="accounts" 
            className="flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--activity-purple))]/20 data-[state=active]:to-[hsl(var(--activity-pink))]/10 data-[state=active]:border data-[state=active]:border-[hsl(var(--activity-purple))]/30 data-[state=active]:shadow-lg hover:scale-105"
          >
            <div className="p-2 rounded-lg bg-[hsl(var(--activity-purple))]/10">
              <Settings className="w-4 h-4 text-[hsl(var(--activity-purple))]" />
            </div>
            <span className="font-semibold">Kết nối</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab Content - Main Focus */}
        <TabsContent value="chat" className="mt-6">
          <FacebookChatManager />
        </TabsContent>

        {/* Modern Accounts Tab */}
        <TabsContent value="accounts" className="space-y-8 mt-8">
          <div className="activity-card relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--activity-purple))]/5 via-transparent to-[hsl(var(--activity-pink))]/5 pointer-events-none" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--activity-purple))]/20 to-[hsl(var(--activity-pink))]/10">
                  <Facebook className="w-5 h-5 text-[hsl(var(--activity-purple))]" />
                </div>
                <span className="bg-gradient-to-r from-[hsl(var(--activity-purple))] to-[hsl(var(--activity-pink))] bg-clip-text text-transparent font-bold">
                  Tài khoản Social Media
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-12 h-12 mb-6">
                    <div className="absolute inset-0 border-4 border-[hsl(var(--activity-teal))]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[hsl(var(--activity-teal))] rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-foreground/60 font-medium">Đang tải tài khoản...</p>
                </div>
              ) : facebookAccounts.length > 0 ? (
                <div className="grid gap-4">
                  {facebookAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className="group relative p-6 rounded-2xl bg-gradient-to-br from-surface/50 to-surface/80 border border-border/50 hover:border-[hsl(var(--activity-teal))]/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Connected status glow */}
                      {account.connected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--activity-mint))]/5 to-[hsl(var(--activity-teal))]/5 rounded-2xl pointer-events-none" />
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Profile Icon */}
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${account.connected 
                              ? 'bg-gradient-to-br from-[hsl(var(--activity-teal))] to-[hsl(var(--activity-mint))]' 
                              : 'bg-gradient-to-br from-muted/50 to-muted/80'
                            } shadow-lg`}>
                              <Facebook className={`w-7 h-7 ${account.connected ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>
                            {/* Status indicator */}
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-surface ${account.connected 
                              ? 'bg-[hsl(var(--activity-mint))] animate-pulse' 
                              : 'bg-muted-foreground/50'
                            }`}></div>
                          </div>
                          
                          {/* Account Info */}
                          <div className="space-y-1">
                            <h4 className="font-bold text-foreground/90">{account.name}</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-foreground/60">
                                {account.followers ? `${account.followers.toLocaleString()} người theo dõi` : 'Facebook Page'}
                              </span>
                              {account.engagement && (
                                <span className="text-[hsl(var(--activity-pink))] font-medium">
                                  {account.engagement}% tương tác
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all duration-300 ${account.connected
                          ? 'bg-[hsl(var(--activity-mint))]/10 text-[hsl(var(--activity-mint))] border-[hsl(var(--activity-mint))]/30 shadow-sm' 
                          : 'bg-[hsl(var(--activity-coral))]/10 text-[hsl(var(--activity-coral))] border-[hsl(var(--activity-coral))]/30'
                        }`}>
                          {account.connected ? "✓ Đã kết nối" : "○ Chưa kết nối"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[hsl(var(--activity-teal))]/10 to-[hsl(var(--activity-mint))]/5 rounded-2xl flex items-center justify-center border-2 border-[hsl(var(--activity-teal))]/20">
                        <Facebook className="w-10 h-10 text-[hsl(var(--activity-teal))]/60" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground/90 mb-3">Facebook Account Management</h3>
                    <p className="text-foreground/60 mb-6 max-w-md mx-auto">
                      Connect and manage multiple Facebook accounts for comprehensive social media automation
                    </p>
                  </div>
                  
                  <FacebookConnectButton 
                    accounts={facebookAccounts}
                    onSuccess={() => {
                      // Refresh accounts after successful connection
                      window.location.reload();
                    }}
                    onDisconnect={(accountId) => {
                      console.log('Account disconnected:', accountId);
                    }}
                    compact={false}
                    showAccountDetails={true}
                  />
                </div>
              )}
            </CardContent>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}