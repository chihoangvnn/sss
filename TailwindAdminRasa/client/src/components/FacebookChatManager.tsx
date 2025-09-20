import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Facebook, 
  Send, 
  Search, 
  Filter, 
  MoreVertical,
  Circle,
  Clock,
  Star,
  Tag,
  CheckCircle2,
  UserCircle,
  Reply,
  Image,
  Paperclip,
  Smile
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FacebookConversation, FacebookMessage } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types for conversation and message data
interface ConversationData extends FacebookConversation {
  participantAvatar: string | null;
}

interface FacebookChatManagerProps {
  className?: string;
}

export function FacebookChatManager({ className }: FacebookChatManagerProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending" | "resolved">("all");
  const [filterPipeline, setFilterPipeline] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery<ConversationData[]>({
    queryKey: ["/api/facebook/conversations"],
  });

  // Fetch pipeline tags
  const { data: pipelineTags = [] } = useQuery({
    queryKey: ["/api/tags"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tags");
      const tags = await response.json();
      return tags.filter((tag: any) => tag.category === 'customer_pipeline');
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<FacebookMessage[]>({
    queryKey: ["/api/facebook/conversations", selectedConversation, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest("GET", `/api/facebook/conversations/${selectedConversation}/messages`);
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return apiRequest("POST", `/api/facebook/conversations/${conversationId}/send`, { content });
    },
    onSuccess: () => {
      // Refresh messages for the conversation
      queryClient.invalidateQueries({
        queryKey: ["/api/facebook/conversations", selectedConversation, "messages"],
      });
      // Refresh conversations to update last message preview
      queryClient.invalidateQueries({
        queryKey: ["/api/facebook/conversations"],
      });
      setNewMessage("");
      toast({
        title: "Tin nhắn đã gửi",
        description: "Tin nhắn của bạn đã được gửi thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi gửi tin nhắn",
        description: error.message || "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ conversationId, updates }: { conversationId: string; updates: Partial<FacebookConversation> }) => {
      return apiRequest("PATCH", `/api/facebook/conversations/${conversationId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/facebook/conversations"],
      });
      toast({
        title: "Cập nhật thành công",
        description: "Cuộc trò chuyện đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Không thể cập nhật cuộc trò chuyện",
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("POST", `/api/facebook/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/facebook/conversations"],
      });
    },
  });

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set initial selected conversation when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation && conversations.find(c => c.id === selectedConversation && !c.isRead)) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation, conversations]);

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Chưa có tin nhắn";
    
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Handle invalid date
    if (isNaN(dateObj.getTime())) return "Thời gian không hợp lệ";
    
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "normal": return "text-blue-600 bg-blue-50";
      case "low": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600";
      case "pending": return "text-yellow-600";
      case "resolved": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || conv.status === filterStatus;
    const matchesPipeline = filterPipeline === "all" || (conv.tagIds && conv.tagIds.includes(filterPipeline));
    return matchesSearch && matchesFilter && matchesPipeline;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Handle send message
  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim()
    });
  };

  // Handle tag updates with pipeline stage exclusivity
  const handleUpdateTags = (conversationId: string, tagIds: string[]) => {
    updateConversationMutation.mutate({
      conversationId,
      updates: { tagIds }
    });
  };

  // Handle pipeline stage assignment (exclusive)
  const handleAssignPipelineStage = (conversationId: string, newStageId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const currentTagIds = conversation.tagIds || [];
    const pipelineTagIds = pipelineTags.map((tag: any) => tag.id);
    
    // Remove all existing pipeline stage tags and add the new one
    const nonPipelineTagIds = currentTagIds.filter((tagId: string) => !pipelineTagIds.includes(tagId));
    const newTagIds = [...nonPipelineTagIds, newStageId];
    
    handleUpdateTags(conversationId, newTagIds);
  };

  // Handle pipeline stage removal
  const handleRemovePipelineStage = (conversationId: string, stageId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const currentTagIds = conversation.tagIds || [];
    const newTagIds = currentTagIds.filter((tagId: string) => tagId !== stageId);
    
    handleUpdateTags(conversationId, newTagIds);
  };

  // Handle priority updates
  const handleUpdatePriority = (conversationId: string, priority: string) => {
    updateConversationMutation.mutate({
      conversationId,
      updates: { priority }
    });
  };

  // Show loading state
  if (conversationsLoading) {
    return (
      <div className={cn("flex h-[800px] bg-white rounded-xl border shadow-lg overflow-hidden", className)}>
        <div className="w-1/3 border-r bg-gray-50/30 p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Đang tải cuộc trò chuyện...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (conversationsError) {
    return (
      <div className={cn("flex h-[800px] bg-white rounded-xl border shadow-lg overflow-hidden", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tải cuộc trò chuyện</h3>
            <p className="text-gray-500">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-[800px] bg-white rounded-xl border shadow-lg overflow-hidden", className)}>
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r bg-gray-50/30 flex flex-col">

        {/* Search and Filter */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
          

        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md border-0",
                  selectedConversation === conversation.id 
                    ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm" 
                    : "bg-white hover:bg-gray-50"
                )}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.participantAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {conversation.participantName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {!conversation.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {conversation.participantName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(conversation.lastMessageAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {conversation.pageName}
                        </Badge>
                        <Circle className={cn("w-2 h-2 fill-current", getStatusColor(conversation.status))} />
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {conversation.lastMessagePreview}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {(conversation.tags || []).slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs px-1.5 py-0.5", getPriorityColor(conversation.priority))}
                        >
                          {conversation.priority === "high" ? "Cao" : 
                           conversation.priority === "normal" ? "Bình thường" : "Thấp"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Pipeline Filter - Full Width Top */}
            <div className="p-3 border-b bg-gray-50/50">
              <div className="flex flex-wrap gap-1 justify-center">
                <Button
                  variant={filterPipeline === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPipeline("all")}
                  className="text-xs h-7"
                >
                  Tất cả
                </Button>
                {pipelineTags.map((tag: any) => (
                  <Button
                    key={tag.id}
                    variant={filterPipeline === tag.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPipeline(tag.id)}
                    className="text-xs h-7"
                    style={{
                      backgroundColor: filterPipeline === tag.id ? tag.color : 'transparent',
                      borderColor: tag.color,
                      color: filterPipeline === tag.id ? 'white' : tag.color
                    }}
                  >
                    {tag.icon} {tag.name.replace(/🎯|💬|⏰|⭐|🔄/g, '').trim()}
                  </Button>
                ))}
              </div>
            </div>

            {/* User Info Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <h3 className="font-semibold text-gray-900">{selectedConv.participantName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 justify-end">
                    <span>{selectedConv.pageName}</span>
                    <Circle className={cn("w-2 h-2 fill-current", getStatusColor(selectedConv.status))} />
                    <span className="capitalize">{selectedConv.status}</span>
                  </div>
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConv.participantAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {selectedConv.participantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Pipeline Assignment for Current Conversation */}
            <div className="px-4 py-2 border-b bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Lưu pipeline cho cuộc trò chuyện này</span>
              </div>
              <div className="space-y-2">
                {/* Current Tags */}
                <div className="flex flex-wrap gap-1">
                  {selectedConv.tagIds && selectedConv.tagIds.length > 0 && 
                    pipelineTags.filter((tag: any) => selectedConv.tagIds?.includes(tag.id)).map((tag: any) => (
                      <Badge 
                        key={tag.id} 
                        variant="secondary" 
                        className="text-xs px-2 py-1"
                        style={{ backgroundColor: tag.color, color: 'white' }}
                      >
                        {tag.icon} {tag.name.replace(/🎯|💬|⏰|⭐|🔄/g, '').trim()}
                      </Badge>
                    ))
                  }
                </div>

                {/* Quick Pipeline Stage Assignment */}
                <div className="flex flex-wrap gap-1">
                  {pipelineTags.map((tag: any) => {
                    const isAssigned = selectedConv.tagIds && selectedConv.tagIds.includes(tag.id);
                    return (
                      <Button
                        key={tag.id}
                        variant={isAssigned ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isAssigned) {
                            handleRemovePipelineStage(selectedConv.id, tag.id);
                          } else {
                            handleAssignPipelineStage(selectedConv.id, tag.id);
                          }
                        }}
                        className="text-xs h-6 px-2"
                        style={{
                          backgroundColor: isAssigned ? tag.color : 'transparent',
                          borderColor: tag.color,
                          color: isAssigned ? 'white' : tag.color
                        }}
                      >
                        {tag.icon}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 max-w-md">
                          <div className="h-16 bg-gray-200 rounded-xl"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 max-w-[80%]",
                        message.senderType === "page" ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback 
                          className={cn(
                            "text-white text-xs",
                            message.senderType === "page" 
                              ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                              : "bg-gradient-to-br from-gray-400 to-gray-500"
                          )}
                        >
                          {message.senderName?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={cn("flex flex-col", message.senderType === "page" ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-xl px-4 py-2 max-w-md",
                            message.senderType === "page"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {message.senderType === "page" && (
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50/30">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="pr-20 bg-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Paperclip className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Image className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
              <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}