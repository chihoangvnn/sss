import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Upload } from "lucide-react";

export default function ChatbotSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [botName, setBotName] = useState("SAM Assistant");
  const [language, setLanguage] = useState("vietnamese");

  return (
    <div className="space-y-6 p-6" data-testid="page-chatbot-settings">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt Chatbot</h1>
        <p className="text-muted-foreground">
          Cấu hình tên, avatar, ngôn ngữ và các thiết lập chung của chatbot
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Enable/Disable Bot */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái Bot</CardTitle>
            <CardDescription>
              Bật/tắt chatbot trên website và storefront
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bot-enabled">Kích hoạt Chatbot</Label>
                <p className="text-sm text-muted-foreground">
                  Hiển thị chatbot widget cho khách hàng
                </p>
              </div>
              <Switch
                id="bot-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
            <div className={`p-3 rounded-md ${isEnabled ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${isEnabled ? 'text-green-700' : 'text-red-700'}`}>
                {isEnabled ? '✅ Chatbot đang hoạt động' : '❌ Chatbot đã bị tắt'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bot Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Bot</CardTitle>
            <CardDescription>
              Tùy chỉnh tên và avatar của chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Avatar Bot</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt="Bot Avatar" />
                  <AvatarFallback>
                    <Bot className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Tải ảnh lên
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Khuyến nghị: 64x64px, định dạng PNG/JPG
              </p>
            </div>

            {/* Bot Name */}
            <div className="space-y-2">
              <Label htmlFor="bot-name">Tên Bot</Label>
              <Input
                id="bot-name"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Tên hiển thị của bot"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Ngôn ngữ chính</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="both">Cả hai ngôn ngữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bot Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Hành vi Bot</CardTitle>
            <CardDescription>
              Cấu hình cách bot tương tác với khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Tin nhắn chào</Label>
              <Input
                id="greeting"
                defaultValue="Xin chào! Tôi có thể giúp gì cho bạn?"
                placeholder="Tin nhắn chào đầu tiên"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fallback">Tin nhắn mặc định</Label>
              <Input
                id="fallback"
                defaultValue="Xin lỗi, tôi chưa hiểu. Bạn có thể nói rõ hơn không?"
                placeholder="Khi bot không hiểu"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline">Hủy</Button>
          <Button>Lưu cài đặt</Button>
        </div>
      </div>
    </div>
  );
}