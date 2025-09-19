import React, { useState } from "react";
import { Facebook, MessageSquare, Settings } from "lucide-react";
import { FacebookChatManager } from "./FacebookChatManager";
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
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Facebook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý Tin nhắn Facebook</h1>
            <p className="text-blue-100">Trò chuyện với khách hàng và quản lý pipeline bán hàng</p>
          </div>
        </div>
      </div>

      {/* Simple Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tin nhắn Facebook
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Kết nối
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab Content - Main Focus */}
        <TabsContent value="chat" className="mt-6">
          <FacebookChatManager />
        </TabsContent>

        {/* Simplified Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                Tài khoản Facebook
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Đang tải tài khoản...</p>
                </div>
              ) : facebookAccounts.length > 0 ? (
                <div className="space-y-4">
                  {facebookAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-gray-600">
                            {account.followers ? `${account.followers.toLocaleString()} người theo dõi` : 'Facebook Page'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={account.connected ? "default" : "secondary"}
                        className={account.connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {account.connected ? "Đã kết nối" : "Chưa kết nối"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Facebook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tài khoản Facebook</h3>
                  <p className="text-gray-500 mb-6">Kết nối tài khoản Facebook để bắt đầu quản lý tin nhắn</p>
                  <Button onClick={handleFacebookConnect} className="bg-blue-600 hover:bg-blue-700">
                    <Facebook className="w-4 h-4 mr-2" />
                    Kết nối Facebook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}