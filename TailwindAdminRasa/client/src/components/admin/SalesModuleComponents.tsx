import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, Plus, AlertTriangle, Users, Target, MessageCircle, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import type { UrgencyData, SocialProofData, PersonalizationData, LeadingQuestionsData, ObjectionHandlingData } from '@shared/schema';

// Sales Module Section Wrapper - Collapsible container
interface SalesModuleSectionProps {
  title: string;
  icon: React.ReactNode;
  moduleKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: (moduleKey: string) => void;
}

function SalesModuleSection({ 
  title, 
  icon, 
  moduleKey, 
  defaultOpen = false, 
  children,
  isOpen,
  onToggle 
}: SalesModuleSectionProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <Collapsible open={isOpen} onOpenChange={() => onToggle(moduleKey)}>
        <CollapsibleTrigger asChild>
          <button 
            type="button"
            className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-left"
            aria-expanded={isOpen}
            aria-controls={`module-content-${moduleKey}`}
          >
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {icon}
              {title}
            </h4>
            <div className="transition-transform duration-200" aria-hidden="true">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent 
          id={`module-content-${moduleKey}`}
          className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden"
        >
          <div className="pt-4">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// 🚨 1. URGENCY DATA - Tạo cảm giác khẩn cấp
interface UrgencyDataFormProps {
  data: UrgencyData;
  onChange: (data: UrgencyData) => void;
}

export { SalesModuleSection };

export function UrgencyDataForm({ data, onChange }: UrgencyDataFormProps) {
  const updateField = (field: keyof UrgencyData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addUrgencyMessage = () => {
    onChange({
      ...data,
      urgency_messages: [...data.urgency_messages, '']
    });
  };

  const removeUrgencyMessage = (index: number) => {
    onChange({
      ...data,
      urgency_messages: data.urgency_messages.filter((_: string, i: number) => i !== index)
    });
  };

  const updateUrgencyMessage = (index: number, value: string) => {
    const messages = [...data.urgency_messages];
    messages[index] = value;
    onChange({ ...data, urgency_messages: messages });
  };

  return (
    <div className="space-y-4">
        {/* Demand Level */}
        <div>
          <Label htmlFor="demandLevel">Mức độ cầu</Label>
          <Select value={data.demand_level} onValueChange={(value) => updateField('demand_level', value as "low" | "medium" | "high")}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn mức độ cầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Velocity */}
        <div>
          <Label htmlFor="salesVelocity">Tốc độ bán hàng (số lượng/ngày)</Label>
          <Input
            id="salesVelocity"
            type="number"
            value={data.sales_velocity}
            onChange={(e) => updateField('sales_velocity', parseInt(e.target.value) || 0)}
            placeholder="VD: 50"
          />
        </div>

        {/* Limited Edition */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isLimitedEdition"
            checked={data.is_limited_edition}
            onChange={(e) => updateField('is_limited_edition', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isLimitedEdition">Phiên bản giới hạn</Label>
        </div>

        {/* Low Stock Threshold */}
        <div>
          <Label htmlFor="lowStockThreshold">Ngưỡng hàng sắp hết</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            value={data.low_stock_threshold}
            onChange={(e) => updateField('low_stock_threshold', parseInt(e.target.value) || 10)}
            placeholder="VD: 10"
          />
        </div>

        {/* Urgency Messages */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Thông điệp khẩn cấp</Label>
            <Button type="button" onClick={addUrgencyMessage} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Thêm
            </Button>
          </div>
          <div className="space-y-2">
            {data.urgency_messages.map((message: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => updateUrgencyMessage(index, e.target.value)}
                  placeholder="VD: Chỉ còn 5 sản phẩm cuối cùng!"
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeUrgencyMessage(index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

// 👥 2. SOCIAL PROOF DATA - Bằng chứng xã hội
interface SocialProofDataFormProps {
  data: SocialProofData;
  onChange: (data: SocialProofData) => void;
}

export function SocialProofDataForm({ data, onChange }: SocialProofDataFormProps) {
  const updateField = (field: keyof SocialProofData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addArrayItem = (field: keyof SocialProofData, defaultValue: string = '') => {
    const currentArray = data[field] as string[];
    onChange({
      ...data,
      [field]: [...currentArray, defaultValue]
    });
  };

  const removeArrayItem = (field: keyof SocialProofData, index: number) => {
    const currentArray = data[field] as string[];
    onChange({
      ...data,
      [field]: currentArray.filter((_: string, i: number) => i !== index)
    });
  };

  const updateArrayItem = (field: keyof SocialProofData, index: number, value: string) => {
    const currentArray = [...(data[field] as string[])];
    currentArray[index] = value;
    onChange({ ...data, [field]: currentArray });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        👥 Social Proof Data - Bằng Chứng Xã Hội
      </h4>
      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalSold">Tổng đã bán</Label>
            <Input
              id="totalSold"
              type="number"
              value={data.total_sold}
              onChange={(e) => updateField('total_sold', parseInt(e.target.value) || 0)}
              placeholder="VD: 1500"
            />
          </div>
          <div>
            <Label htmlFor="totalReviews">Số lượt đánh giá</Label>
            <Input
              id="totalReviews"
              type="number"
              value={data.total_reviews}
              onChange={(e) => updateField('total_reviews', parseInt(e.target.value) || 0)}
              placeholder="VD: 450"
            />
          </div>
          <div>
            <Label htmlFor="averageRating">Đánh giá trung bình</Label>
            <Input
              id="averageRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={data.average_rating}
              onChange={(e) => updateField('average_rating', parseFloat(e.target.value) || 0)}
              placeholder="VD: 4.8"
            />
          </div>
          <div>
            <Label htmlFor="repurchaseRate">Tỷ lệ mua lại (%)</Label>
            <Input
              id="repurchaseRate"
              type="number"
              min="0"
              max="100"
              value={data.repurchase_rate}
              onChange={(e) => updateField('repurchase_rate', parseInt(e.target.value) || 0)}
              placeholder="VD: 75"
            />
          </div>
        </div>

        <Tabs defaultValue="media" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="media">Truyền thông</TabsTrigger>
            <TabsTrigger value="celebrity">Người nổi tiếng</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Đề cập truyền thông</Label>
              <Button type="button" onClick={() => addArrayItem('media_mentions')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.media_mentions.map((mention: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={mention}
                  onChange={(e) => updateArrayItem('media_mentions', index, e.target.value)}
                  placeholder="VD: Báo VnExpress, Tạp chí Phụ Nữ..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('media_mentions', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="celebrity" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Người nổi tiếng sử dụng</Label>
              <Button type="button" onClick={() => addArrayItem('celebrity_users')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.celebrity_users.map((celebrity: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={celebrity}
                  onChange={(e) => updateArrayItem('celebrity_users', index, e.target.value)}
                  placeholder="VD: Hoa hậu Tiểu Vy, Ca sĩ Hồ Ngọc Hà..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('celebrity_users', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Đánh giá nổi bật (text simple)</Label>
              <Button type="button" onClick={() => addArrayItem('expert_endorsements')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.expert_endorsements.map((review: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={review}
                  onChange={(e) => updateArrayItem('expert_endorsements', index, e.target.value)}
                  placeholder="VD: Dùng 2 tuần da mịn hơn hẳn, rất hài lòng - Mrs. Lan, 35 tuổi"
                  rows={3}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('expert_endorsements', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="trending" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Hashtags trending</Label>
              <Button type="button" onClick={() => addArrayItem('trending_hashtags')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.trending_hashtags.map((hashtag: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={hashtag}
                  onChange={(e) => updateArrayItem('trending_hashtags', index, e.target.value)}
                  placeholder="VD: #skincare #vietnam #beauty"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('trending_hashtags', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 🎯 3. PERSONALIZATION DATA - Cá nhân hóa cực cao
interface PersonalizationDataFormProps {
  data: PersonalizationData;
  onChange: (data: PersonalizationData) => void;
}

export function PersonalizationDataForm({ data, onChange }: PersonalizationDataFormProps) {
  const updateField = (field: keyof PersonalizationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateTargetDemographics = (field: keyof PersonalizationData['target_demographics']['primary'], value: any) => {
    onChange({
      ...data,
      target_demographics: {
        ...data.target_demographics,
        primary: {
          ...data.target_demographics.primary,
          [field]: value
        }
      }
    });
  };

  const addArrayItem = (field: keyof PersonalizationData, defaultValue: string = '') => {
    const currentArray = data[field] as string[];
    onChange({
      ...data,
      [field]: [...currentArray, defaultValue]
    });
  };

  const removeArrayItem = (field: keyof PersonalizationData, index: number) => {
    const currentArray = data[field] as string[];
    onChange({
      ...data,
      [field]: currentArray.filter((_: string, i: number) => i !== index)
    });
  };

  const updateArrayItem = (field: keyof PersonalizationData, index: number, value: string) => {
    const currentArray = [...(data[field] as string[])];
    currentArray[index] = value;
    onChange({ ...data, [field]: currentArray });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Target className="h-5 w-5 text-green-600" />
        🎯 Personalization Data - Cá Nhân Hóa Cực Cao
      </h4>
      <div className="space-y-4">
        {/* Income Bracket */}
        <div>
          <Label htmlFor="incomeBracket">Khung thu nhập</Label>
          <Select value={data.income_bracket} onValueChange={(value) => updateField('income_bracket', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn khung thu nhập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-500k">Dưới 500k</SelectItem>
              <SelectItem value="500k-1m">500k - 1 triệu</SelectItem>
              <SelectItem value="1m-3m">1 - 3 triệu</SelectItem>
              <SelectItem value="3m-5m">3 - 5 triệu</SelectItem>
              <SelectItem value="5m-10m">5 - 10 triệu</SelectItem>
              <SelectItem value="above-10m">Trên 10 triệu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target Demographics */}
        <div className="border rounded-lg p-4 bg-white">
          <Label className="text-sm font-semibold mb-3 block">👥 Nhân khẩu học mục tiêu</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ageRange">Độ tuổi</Label>
              <Input
                id="ageRange"
                value={data.target_demographics.primary.age_range}
                onChange={(e) => updateTargetDemographics('age_range', e.target.value)}
                placeholder="VD: 25-35 tuổi"
              />
            </div>
            <div>
              <Label htmlFor="incomeLevel">Mức thu nhập</Label>
              <Select 
                value={data.target_demographics.primary.income_level} 
                onValueChange={(value) => updateTargetDemographics('income_level', value as "low" | "middle" | "high" | "premium")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức thu nhập" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="middle">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="premium">Cao cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="lifestyle" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lifestyle">Phong cách sống</TabsTrigger>
            <TabsTrigger value="profession">Nghề nghiệp</TabsTrigger>
            <TabsTrigger value="scenarios">Tình huống sử dụng</TabsTrigger>
          </TabsList>

          <TabsContent value="lifestyle" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags phong cách sống</Label>
              <Button type="button" onClick={() => addArrayItem('lifestyle_tags')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.lifestyle_tags.map((tag: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={tag}
                  onChange={(e) => updateArrayItem('lifestyle_tags', index, e.target.value)}
                  placeholder="VD: bận rộn, yêu thiên nhiên, hiện đại..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('lifestyle_tags', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="profession" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nghề nghiệp phù hợp</Label>
              <Button type="button" onClick={() => addArrayItem('profession_fit')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.profession_fit.map((profession: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={profession}
                  onChange={(e) => updateArrayItem('profession_fit', index, e.target.value)}
                  placeholder="VD: nhân viên văn phòng, mẹ bỉm sữa, freelancer..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('profession_fit', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tình huống sử dụng</Label>
              <Button type="button" onClick={() => addArrayItem('usage_scenarios')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.usage_scenarios.map((scenario: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={scenario}
                  onChange={(e) => updateArrayItem('usage_scenarios', index, e.target.value)}
                  placeholder="VD: buổi sáng trước khi đi làm, tối trước khi ngủ..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeArrayItem('usage_scenarios', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// For Leading Questions and Objection Handling, I'll create simplified versions that work with arrays for now
// since the schema defines them as complex objects, but for the admin UI we can start with simple arrays

// 💬 4. LEADING QUESTIONS DATA - Câu hỏi gợi mở (Simplified)
interface LeadingQuestionsDataFormProps {
  data: LeadingQuestionsData;
  onChange: (data: LeadingQuestionsData) => void;
}

export function LeadingQuestionsDataForm({ data, onChange }: LeadingQuestionsDataFormProps) {
  const addStringItem = (field: 'discovery_prompts' | 'comparison_triggers' | 'emotional_hooks' | 'closing_questions') => {
    onChange({
      ...data,
      [field]: [...data[field], '']
    });
  };

  const removeStringItem = (field: 'discovery_prompts' | 'comparison_triggers' | 'emotional_hooks' | 'closing_questions', index: number) => {
    onChange({
      ...data,
      [field]: data[field].filter((_: string, i: number) => i !== index)
    });
  };

  const updateStringItem = (field: 'discovery_prompts' | 'comparison_triggers' | 'emotional_hooks' | 'closing_questions', index: number, value: string) => {
    const currentArray = [...data[field]];
    currentArray[index] = value;
    onChange({ ...data, [field]: currentArray });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-purple-600" />
        💬 Leading Questions Data - Câu Hỏi Gợi Mở
      </h4>
      <div className="space-y-4">
        <Tabs defaultValue="emotional" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emotional">Cảm xúc</TabsTrigger>
            <TabsTrigger value="discovery">Khám phá</TabsTrigger>
            <TabsTrigger value="comparison">So sánh</TabsTrigger>
            <TabsTrigger value="closing">Chốt sale</TabsTrigger>
          </TabsList>

          <TabsContent value="emotional" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Câu móc cảm xúc</Label>
                <Button type="button" onClick={() => addStringItem('emotional_hooks')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {data.emotional_hooks.map((hook: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={hook}
                      onChange={(e) => updateStringItem('emotional_hooks', index, e.target.value)}
                      placeholder="VD: Bạn có từng cảm thấy tự tin với làn da của mình?"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeStringItem('emotional_hooks', index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Gợi ý khám phá</Label>
                <Button type="button" onClick={() => addStringItem('discovery_prompts')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {data.discovery_prompts.map((prompt: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={prompt}
                      onChange={(e) => updateStringItem('discovery_prompts', index, e.target.value)}
                      placeholder="VD: Kể về routine skincare hiện tại của bạn?"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeStringItem('discovery_prompts', index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Câu hỏi so sánh</Label>
                <Button type="button" onClick={() => addStringItem('comparison_triggers')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {data.comparison_triggers.map((trigger: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={trigger}
                      onChange={(e) => updateStringItem('comparison_triggers', index, e.target.value)}
                      placeholder="VD: So với serum bạn đang dùng, điều gì quan trọng nhất?"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeStringItem('comparison_triggers', index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="closing" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Câu hỏi chốt sale</Label>
                <Button type="button" onClick={() => addStringItem('closing_questions')} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {data.closing_questions.map((question: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => updateStringItem('closing_questions', index, e.target.value)}
                      placeholder="VD: Bạn sẵn sàng đầu tư cho làn da đẹp của mình chứ?"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeStringItem('closing_questions', index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 🛡️ 5. OBJECTION HANDLING DATA - Xử lý phản đối (Simplified)
interface ObjectionHandlingDataFormProps {
  data: ObjectionHandlingData;
  onChange: (data: ObjectionHandlingData) => void;
}

export function ObjectionHandlingDataForm({ data, onChange }: ObjectionHandlingDataFormProps) {
  const updatePriceJustification = (field: keyof ObjectionHandlingData['price_justification'], value: any) => {
    onChange({
      ...data,
      price_justification: {
        ...data.price_justification,
        [field]: value
      }
    });
  };

  const updateEffectivenessGuarantee = (field: keyof ObjectionHandlingData['effectiveness_guarantee'], value: any) => {
    onChange({
      ...data,
      effectiveness_guarantee: {
        ...data.effectiveness_guarantee,
        [field]: value
      }
    });
  };

  const addStringArrayItem = (field: 'quality_proof_points' | 'safety_assurance' | 'risk_mitigation' | 'trust_builders') => {
    onChange({
      ...data,
      [field]: [...data[field], '']
    });
  };

  const removeStringArrayItem = (field: 'quality_proof_points' | 'safety_assurance' | 'risk_mitigation' | 'trust_builders', index: number) => {
    onChange({
      ...data,
      [field]: data[field].filter((_: string, i: number) => i !== index)
    });
  };

  const updateStringArrayItem = (field: 'quality_proof_points' | 'safety_assurance' | 'risk_mitigation' | 'trust_builders', index: number, value: string) => {
    const currentArray = [...data[field]];
    currentArray[index] = value;
    onChange({ ...data, [field]: currentArray });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-red-600" />
        🛡️ Objection Handling Data - Xử Lý Phản Đối
      </h4>
      <div className="space-y-4">
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="price">Giá cả</TabsTrigger>
            <TabsTrigger value="trust">Tin cậy</TabsTrigger>
            <TabsTrigger value="quality">Chất lượng</TabsTrigger>
            <TabsTrigger value="guarantee">Bảo hành</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <Label className="text-sm font-semibold mb-3 block">💰 Biện minh về giá</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyCost">Chi phí hàng ngày</Label>
                  <Input
                    id="dailyCost"
                    value={data.price_justification.daily_cost}
                    onChange={(e) => updatePriceJustification('daily_cost', e.target.value)}
                    placeholder="VD: Chỉ 15.000đ/ngày"
                  />
                </div>
                <div>
                  <Label htmlFor="valueProposition">Giá trị đề xuất</Label>
                  <Input
                    id="valueProposition"
                    value={data.price_justification.value_proposition}
                    onChange={(e) => updatePriceJustification('value_proposition', e.target.value)}
                    placeholder="VD: Đầu tư cho sức khỏe là vô giá"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Điểm so sánh</Label>
                  <Button type="button" onClick={() => {
                    const newComparisons = [...data.price_justification.comparison_points, ''];
                    updatePriceJustification('comparison_points', newComparisons);
                  }} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                {data.price_justification.comparison_points.map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      value={point}
                      onChange={(e) => {
                        const newComparisons = [...data.price_justification.comparison_points];
                        newComparisons[index] = e.target.value;
                        updatePriceJustification('comparison_points', newComparisons);
                      }}
                      placeholder="VD: Rẻ hơn 1 ly cafe mỗi ngày"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const newComparisons = data.price_justification.comparison_points.filter((_: string, i: number) => i !== index);
                        updatePriceJustification('comparison_points', newComparisons);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trust" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Xây dựng lòng tin</Label>
              <Button type="button" onClick={() => addStringArrayItem('trust_builders')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.trust_builders.map((trust: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={trust}
                  onChange={(e) => updateStringArrayItem('trust_builders', index, e.target.value)}
                  placeholder="VD: Được chứng nhận FDA, hơn 10 năm kinh nghiệm..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeStringArrayItem('trust_builders', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="quality" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Điểm chứng minh chất lượng</Label>
              <Button type="button" onClick={() => addStringArrayItem('quality_proof_points')} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {data.quality_proof_points.map((proof: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={proof}
                  onChange={(e) => updateStringArrayItem('quality_proof_points', index, e.target.value)}
                  placeholder="VD: Nguồn gốc thiên nhiên 100%, không chất bảo quản..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => removeStringArrayItem('quality_proof_points', index)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="guarantee" className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <Label className="text-sm font-semibold mb-3 block">🛡️ Bảo đảm hiệu quả</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeline">Thời gian</Label>
                  <Input
                    id="timeline"
                    value={data.effectiveness_guarantee.timeline}
                    onChange={(e) => updateEffectivenessGuarantee('timeline', e.target.value)}
                    placeholder="VD: 30 ngày"
                  />
                </div>
                <div>
                  <Label htmlFor="successRate">Tỷ lệ thành công</Label>
                  <Input
                    id="successRate"
                    value={data.effectiveness_guarantee.success_rate}
                    onChange={(e) => updateEffectivenessGuarantee('success_rate', e.target.value)}
                    placeholder="VD: 95%"
                  />
                </div>
                <div>
                  <Label htmlFor="guaranteeText">Cam kết bảo hành</Label>
                  <Input
                    id="guaranteeText"
                    value={data.effectiveness_guarantee.guarantee_text}
                    onChange={(e) => updateEffectivenessGuarantee('guarantee_text', e.target.value)}
                    placeholder="VD: Hoàn tiền 100%"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Re-export consultation forms
export {
  SmartFAQForm,
  NeedsAssessmentForm,
  BotPersonalityForm,
  ConsultationScenariosForm,
  CompetitorComparisonForm,
  CrossSellDataForm,
  ConsultationTrackingForm
} from "./ConsultationForms";
