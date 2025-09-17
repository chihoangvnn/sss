import { ChatbotInterface } from "@/components/ChatbotInterface";

export default function ChatbotTest() {
  return (
    <div className="space-y-6 p-6" data-testid="page-chatbot-test">
      <div>
        <h1 className="text-3xl font-bold">Test Chatbot</h1>
        <p className="text-muted-foreground">
          Chat trực tiếp với bot để kiểm tra tính năng và phản hồi
        </p>
      </div>
      
      <div className="border border-border rounded-lg p-4 bg-background">
        <ChatbotInterface />
      </div>
    </div>
  );
}