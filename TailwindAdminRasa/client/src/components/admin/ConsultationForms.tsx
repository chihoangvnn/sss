import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, HelpCircle } from "lucide-react";
import type {
  SmartFAQData,
  NeedsAssessmentData,
  BotPersonalityData,
  ConsultationScenariosData,
  CompetitorComparisonData,
  CrossSellData,
  ConsultationTrackingData
} from "@shared/schema";

// 6. Smart FAQ Form Component
export function SmartFAQForm({ data, onChange }: { data: SmartFAQData; onChange: (data: SmartFAQData) => void }) {
  const addQuestion = () => {
    const newQuestion = {
      question: "",
      answer: "",
      keywords: [],
      context: "",
      confidence_score: 0.8,
      related_questions: []
    };
    onChange({
      ...data,
      questions: [...data.questions, newQuestion]
    });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...data,
      questions: data.questions.filter((_, i) => i !== index)
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...data.questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, questions: updated });
  };

  const addKeyword = (questionIndex: number, keyword: string) => {
    if (!keyword.trim()) return;
    const updated = [...data.questions];
    updated[questionIndex].keywords = [...updated[questionIndex].keywords, keyword.trim()];
    onChange({ ...data, questions: updated });
  };

  const removeKeyword = (questionIndex: number, keywordIndex: number) => {
    const updated = [...data.questions];
    updated[questionIndex].keywords = updated[questionIndex].keywords.filter((_, i) => i !== keywordIndex);
    onChange({ ...data, questions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Quản lý câu hỏi thường gặp thông minh với AI matching</p>
        <Button onClick={addQuestion} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      {/* Confidence Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ngưỡng tin cậy AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Cao (≥{data.confidence_thresholds.high})</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={data.confidence_thresholds.high}
                onChange={(e) => onChange({
                  ...data,
                  confidence_thresholds: { ...data.confidence_thresholds, high: parseFloat(e.target.value) }
                })}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Trung bình (≥{data.confidence_thresholds.medium})</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={data.confidence_thresholds.medium}
                onChange={(e) => onChange({
                  ...data,
                  confidence_thresholds: { ...data.confidence_thresholds, medium: parseFloat(e.target.value) }
                })}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Thấp (≥{data.confidence_thresholds.low})</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={data.confidence_thresholds.low}
                onChange={(e) => onChange({
                  ...data,
                  confidence_thresholds: { ...data.confidence_thresholds, low: parseFloat(e.target.value) }
                })}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-3">
        {data.questions.map((question, qIndex) => (
          <Card key={qIndex} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">FAQ #{qIndex + 1}</CardTitle>
                <Button
                  onClick={() => removeQuestion(qIndex)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Câu hỏi</Label>
                <Input
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="VD: Sản phẩm này có phù hợp với da nhạy cảm không?"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Câu trả lời</Label>
                <Textarea
                  value={question.answer}
                  onChange={(e) => updateQuestion(qIndex, 'answer', e.target.value)}
                  placeholder="VD: Có, công thức không chứa cồn và paraben, phù hợp cho da nhạy cảm"
                  className="text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ngữ cảnh</Label>
                  <Input
                    value={question.context}
                    onChange={(e) => updateQuestion(qIndex, 'context', e.target.value)}
                    placeholder="VD: skincare_safety"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Điểm tin cậy (0-1)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={question.confidence_score}
                    onChange={(e) => updateQuestion(qIndex, 'confidence_score', parseFloat(e.target.value))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Keywords */}
              <div>
                <Label className="text-xs">Từ khóa liên quan</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {question.keywords.map((keyword, kIndex) => (
                    <Badge key={kIndex} variant="secondary" className="text-xs">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(qIndex, kIndex)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => {
                      const keyword = prompt("Nhập từ khóa:");
                      if (keyword) addKeyword(qIndex, keyword);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Từ khóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chưa có câu hỏi nào. Thêm FAQ đầu tiên!</p>
        </div>
      )}
    </div>
  );
}

// 7. Needs Assessment Form Component
export function NeedsAssessmentForm({ data, onChange }: { data: NeedsAssessmentData; onChange: (data: NeedsAssessmentData) => void }) {
  const addAssessmentQuestion = () => {
    const newQuestion = {
      question: "",
      type: "single_choice" as const,
      options: [],
      weight: 5,
      category: ""
    };
    onChange({
      ...data,
      assessment_questions: [...data.assessment_questions, newQuestion]
    });
  };

  const removeAssessmentQuestion = (index: number) => {
    onChange({
      ...data,
      assessment_questions: data.assessment_questions.filter((_, i) => i !== index)
    });
  };

  const updateAssessmentQuestion = (index: number, field: string, value: any) => {
    const updated = [...data.assessment_questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, assessment_questions: updated });
  };

  const addOption = (questionIndex: number, option: string) => {
    if (!option.trim()) return;
    const updated = [...data.assessment_questions];
    updated[questionIndex].options = [...(updated[questionIndex].options || []), option.trim()];
    onChange({ ...data, assessment_questions: updated });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...data.assessment_questions];
    updated[questionIndex].options = updated[questionIndex].options?.filter((_, i) => i !== optionIndex) || [];
    onChange({ ...data, assessment_questions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Đánh giá nhu cầu khách hàng để gợi ý sản phẩm phù hợp</p>
          <div className="flex items-center gap-3 mt-2">
            <Label className="text-xs">Thuật toán matching:</Label>
            <Select
              value={data.matching_algorithm}
              onValueChange={(value: "weighted_score" | "rule_based" | "ml_based") => 
                onChange({ ...data, matching_algorithm: value })
              }
            >
              <SelectTrigger className="w-48 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weighted_score">Điểm trọng số</SelectItem>
                <SelectItem value="rule_based">Luật logic</SelectItem>
                <SelectItem value="ml_based">Machine Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={addAssessmentQuestion} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      {/* Assessment Questions */}
      <div className="space-y-3">
        {data.assessment_questions.map((question, qIndex) => (
          <Card key={qIndex} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Câu hỏi #{qIndex + 1}</CardTitle>
                <Button
                  onClick={() => removeAssessmentQuestion(qIndex)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Câu hỏi</Label>
                <Input
                  value={question.question}
                  onChange={(e) => updateAssessmentQuestion(qIndex, 'question', e.target.value)}
                  placeholder="VD: Da bạn thuộc loại nào?"
                  className="text-sm"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Loại câu hỏi</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateAssessmentQuestion(qIndex, 'type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_choice">Chọn một</SelectItem>
                      <SelectItem value="multiple_choice">Chọn nhiều</SelectItem>
                      <SelectItem value="text">Văn bản</SelectItem>
                      <SelectItem value="scale">Thang điểm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Danh mục</Label>
                  <Input
                    value={question.category}
                    onChange={(e) => updateAssessmentQuestion(qIndex, 'category', e.target.value)}
                    placeholder="VD: skin_type"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Trọng số (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={question.weight}
                    onChange={(e) => updateAssessmentQuestion(qIndex, 'weight', parseInt(e.target.value))}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Options (for choice questions) */}
              {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                <div>
                  <Label className="text-xs">Lựa chọn</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(question.options || []).map((option, oIndex) => (
                      <Badge key={oIndex} variant="outline" className="text-xs">
                        {option}
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => {
                        const option = prompt("Nhập lựa chọn:");
                        if (option) addOption(qIndex, option);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Lựa chọn
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.assessment_questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chưa có câu hỏi đánh giá nào. Thêm câu hỏi đầu tiên!</p>
        </div>
      )}
    </div>
  );
}

// 8. Bot Personality Form Component  
export function BotPersonalityForm({ data, onChange }: { data: BotPersonalityData; onChange: (data: BotPersonalityData) => void }) {
  const addEmpathyResponse = () => {
    onChange({
      ...data,
      empathy_responses: [...data.empathy_responses, { trigger: "", responses: [] }]
    });
  };

  const addConversationStarter = () => {
    const starter = prompt("Nhập câu mở đầu cuộc trò chuyện:");
    if (starter) {
      onChange({
        ...data,
        conversation_starters: [...data.conversation_starters, starter]
      });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Cấu hình tính cách và cách giao tiếp của chatbot</p>
      
      {/* Basic Personality */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Phong cách giao tiếp</Label>
          <Select
            value={data.tone}
            onValueChange={(value: "friendly" | "professional" | "casual" | "expert" | "caring") => 
              onChange({ ...data, tone: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Thân thiện</SelectItem>
              <SelectItem value="professional">Chuyên nghiệp</SelectItem>
              <SelectItem value="casual">Thoải mái</SelectItem>
              <SelectItem value="expert">Chuyên gia</SelectItem>
              <SelectItem value="caring">Quan tâm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Kiểu trả lời</Label>
          <Select
            value={data.style}
            onValueChange={(value: "concise" | "detailed" | "conversational" | "formal") => 
              onChange({ ...data, style: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Ngắn gọn</SelectItem>
              <SelectItem value="detailed">Chi tiết</SelectItem>
              <SelectItem value="conversational">Đàm thoại</SelectItem>
              <SelectItem value="formal">Trang trọng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vietnamese Cultural Adaptation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🇻🇳 Phù hợp văn hóa Việt Nam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data.cultural_adaptation.vietnamese_context}
              onChange={(e) => onChange({
                ...data,
                cultural_adaptation: {
                  ...data.cultural_adaptation,
                  vietnamese_context: e.target.checked
                }
              })}
            />
            <Label className="text-sm">Áp dụng ngữ cảnh Việt Nam</Label>
          </div>
          
          <div>
            <Label className="text-xs">Cách xưng hô địa phương</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.cultural_adaptation.local_expressions.map((expr, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {expr}
                  <button
                    onClick={() => {
                      const updated = data.cultural_adaptation.local_expressions.filter((_, i) => i !== index);
                      onChange({
                        ...data,
                        cultural_adaptation: { ...data.cultural_adaptation, local_expressions: updated }
                      });
                    }}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => {
                  const expr = prompt("Nhập cách xưng hô (VD: chị ơi, anh ơi, em yêu):");
                  if (expr) {
                    onChange({
                      ...data,
                      cultural_adaptation: {
                        ...data.cultural_adaptation,
                        local_expressions: [...data.cultural_adaptation.local_expressions, expr]
                      }
                    });
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Starters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">💬 Câu mở đầu cuộc trò chuyện</CardTitle>
            <Button onClick={addConversationStarter} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.conversation_starters.map((starter, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={starter}
                  onChange={(e) => {
                    const updated = [...data.conversation_starters];
                    updated[index] = e.target.value;
                    onChange({ ...data, conversation_starters: updated });
                  }}
                  className="text-sm"
                />
                <Button
                  onClick={() => {
                    const updated = data.conversation_starters.filter((_, i) => i !== index);
                    onChange({ ...data, conversation_starters: updated });
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder forms for other consultation features
export function ConsultationScenariosForm({ data, onChange }: { data: ConsultationScenariosData; onChange: (data: ConsultationScenariosData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Quản lý kịch bản tư vấn cho các tình huống khác nhau</p>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm text-blue-700">🚧 Component đang được phát triển. Sẽ có đầy đủ tính năng trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );
}

export function CompetitorComparisonForm({ data, onChange }: { data: CompetitorComparisonData; onChange: (data: CompetitorComparisonData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">So sánh với đối thủ và tạo lợi thế cạnh tranh</p>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm text-blue-700">🚧 Component đang được phát triển. Sẽ có đầy đủ tính năng trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );
}

export function CrossSellDataForm({ data, onChange }: { data: CrossSellData; onChange: (data: CrossSellData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Gợi ý sản phẩm bổ sung và tăng giá trị đơn hàng</p>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm text-blue-700">🚧 Component đang được phát triển. Sẽ có đầy đủ tính năng trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );
}

export function ConsultationTrackingForm({ data, onChange }: { data: ConsultationTrackingData; onChange: (data: ConsultationTrackingData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Theo dõi và phân tích hiệu quả tư vấn của RASA bot</p>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm text-blue-700">🚧 Component đang được phát triển. Sẽ có đầy đủ tính năng trong phiên bản tiếp theo.</p>
      </div>
    </div>
  );
}