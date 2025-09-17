import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, TrendingUp, Clock } from "lucide-react";

export default function ChatbotAnalytics() {
  const mockStats = {
    totalConversations: 1247,
    activeUsers: 423,
    avgResponseTime: 1.2,
    successRate: 87
  };

  const mockTopIntents = [
    { name: "product_search", count: 324, percentage: 45 },
    { name: "price_inquiry", count: 189, percentage: 26 },
    { name: "greeting", count: 156, percentage: 22 },
    { name: "stock_check", count: 78, percentage: 11 }
  ];

  const mockRecentConversations = [
    {
      id: 1,
      userId: "user123",
      message: "iPhone 15 giá bao nhiêu?",
      response: "iPhone 15 Pro Max giá 29.999.000 VNĐ",
      timestamp: "2 phút trước",
      resolved: true
    },
    {
      id: 2,
      userId: "user456", 
      message: "Còn Samsung S24 không?",
      response: "Samsung S24 hiện còn 5 chiếc trong kho",
      timestamp: "5 phút trước",
      resolved: true
    },
    {
      id: 3,
      userId: "user789",
      message: "Laptop Dell XPS có tốt không?",
      response: "Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể nói rõ hơn?",
      timestamp: "8 phút trước",
      resolved: false
    }
  ];

  return (
    <div className="space-y-6 p-6" data-testid="page-chatbot-analytics">
      <div>
        <h1 className="text-3xl font-bold">Thống kê Chatbot</h1>
        <p className="text-muted-foreground">
          Phân tích hiệu suất và số liệu hoạt động của chatbot
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng cuộc hội thoại</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% từ tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng tương tác</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% từ tuần trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian phản hồi TB</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              Tốt hơn 0.3s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              +3% từ tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Intents */}
        <Card>
          <CardHeader>
            <CardTitle>Intents phổ biến</CardTitle>
            <CardDescription>
              Các loại câu hỏi được hỏi nhiều nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopIntents.map((intent) => (
                <div key={intent.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{intent.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {intent.count} lần
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${intent.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {intent.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Cuộc hội thoại gần đây</CardTitle>
            <CardDescription>
              Tương tác mới nhất với khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentConversations.map((conv) => (
                <div key={conv.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{conv.userId}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={conv.resolved ? "default" : "destructive"} className="text-xs">
                        {conv.resolved ? "Đã giải quyết" : "Chưa hiểu"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.timestamp}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm bg-blue-50 p-2 rounded">
                      <strong>Khách:</strong> {conv.message}
                    </p>
                    <p className="text-sm bg-green-50 p-2 rounded">
                      <strong>Bot:</strong> {conv.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}