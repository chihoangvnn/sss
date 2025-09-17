import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";

export default function ChatbotResponses() {
  const mockIntents = [
    {
      id: 1,
      name: "greeting",
      description: "Chào hỏi, xin chào",
      examples: ["xin chào", "hello", "chào bạn", "hi"],
      responses: ["Xin chào! Tôi có thể giúp gì cho bạn?", "Chào bạn! Tôi là trợ lý ảo của shop."]
    },
    {
      id: 2,
      name: "product_search",
      description: "Tìm kiếm sản phẩm",
      examples: ["tìm điện thoại", "có laptop không", "xem sản phẩm"],
      responses: ["Tôi sẽ tìm sản phẩm cho bạn...", "Để tôi kiểm tra sản phẩm có sẵn."]
    },
    {
      id: 3,
      name: "price_inquiry",
      description: "Hỏi về giá sản phẩm",
      examples: ["giá bao nhiêu", "bao nhiêu tiền", "giá thành"],
      responses: ["Sản phẩm này có giá [PRICE] VNĐ", "Giá hiện tại là [PRICE] VNĐ, bạn có muốn đặt hàng không?"]
    },
    {
      id: 4,
      name: "stock_check",
      description: "Kiểm tra tồn kho",
      examples: ["còn hàng không", "hết hàng chưa", "có sẵn không"],
      responses: ["Để tôi kiểm tra tồn kho...", "Sản phẩm này hiện [STOCK_STATUS]"]
    }
  ];

  return (
    <div className="space-y-6 p-6" data-testid="page-chatbot-responses">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Câu trả lời</h1>
          <p className="text-muted-foreground">
            Chỉnh sửa intents, examples và responses của chatbot
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Intent
        </Button>
      </div>

      <div className="grid gap-6">
        {mockIntents.map((intent) => (
          <Card key={intent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {intent.name}
                    <Badge variant="secondary">{intent.examples.length} examples</Badge>
                  </CardTitle>
                  <CardDescription>{intent.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Training Examples */}
              <div>
                <h4 className="text-sm font-medium mb-2">Training Examples:</h4>
                <div className="flex flex-wrap gap-2">
                  {intent.examples.map((example, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      "{example}"
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Responses */}
              <div>
                <h4 className="text-sm font-medium mb-2">Responses:</h4>
                <div className="space-y-2">
                  {intent.responses.map((response, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md text-sm">
                      {response}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for new users */}
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Thêm Intent mới</h3>
          <p className="text-muted-foreground mb-4">
            Tạo intent mới để dạy bot hiểu và trả lời các câu hỏi khác
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Intent đầu tiên
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}