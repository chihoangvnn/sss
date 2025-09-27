'use client'

import React from 'react';
import { VipProgress, formatCurrency, formatCurrencyShort, getMotivationalMessage } from '@/utils/vipCalculator';
import { ChevronRight, Gift, Zap, Crown } from 'lucide-react';

interface VipTierCardProps {
  vipProgress: VipProgress;
}

export function VipTierCard({ vipProgress }: VipTierCardProps) {
  const { currentTier, totalSpent, nextTier, progressToNext, amountToNext } = vipProgress;

  return (
    <div className="bg-white rounded-xl p-6 mb-4 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-100 to-transparent"></div>
      </div>

      {/* Tier Header */}
      <div className={`relative bg-gradient-to-r ${currentTier.bgGradient} rounded-lg p-4 mb-4 overflow-hidden`}>
        {/* Shimmer Effect for Diamond */}
        {currentTier.id === 'diamond' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow"></div>
        )}
        
        {/* Glow Effect for Gold */}
        {currentTier.id === 'gold' && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-transparent to-yellow-300/20 animate-pulse"></div>
        )}

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${currentTier.textColor}`}>
              KHÁCH HÀNG {currentTier.name.toUpperCase()}
            </h3>
            <p className={`text-sm ${currentTier.textColor} opacity-90 mb-3`}>
              Tổng chi tiêu: {formatCurrency(totalSpent)}
            </p>
            <div className={`text-sm font-bold ${currentTier.textColor} leading-tight mb-1`}>
              {currentTier.motivationalTitle}
            </div>
            <div className={`text-xs ${currentTier.textColor} opacity-90 leading-tight`}>
              {currentTier.motivationalSubtitle}
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            <span className="text-4xl animate-bounce">{currentTier.emoji}</span>
          </div>
        </div>
      </div>

      {/* Current Benefits */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
          <Gift className="w-4 h-4 mr-2 text-green-600" />
          Ưu đãi hiện tại
        </h4>
        <div className="grid grid-cols-1 gap-1">
          {currentTier.benefits.slice(0, 3).map((benefit: string, index: number) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
              {benefit}
            </div>
          ))}
          {currentTier.benefits.length > 3 && (
            <div className="text-sm text-gray-500 ml-4">
              +{currentTier.benefits.length - 3} ưu đãi khác
            </div>
          )}
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-orange-500" />
              Tiến độ lên {nextTier.name}
            </h4>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progressToNext)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progressToNext}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Progress Details */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {getMotivationalMessage(vipProgress)}
            </span>
            <span className="font-medium text-gray-900">
              Còn {formatCurrencyShort(amountToNext)}đ
            </span>
          </div>

          {/* Next Tier Preview */}
          <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{nextTier.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    Cấp {nextTier.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Giảm giá {nextTier.discount}% • {nextTier.benefits[0]}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Max Tier Achievement */}
      {!nextTier && (
        <div className="border-t pt-4">
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <Crown className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-bold text-purple-900 mb-1">
              🎉 Chúc mừng VIP Kim Cương!
            </h4>
            <p className="text-sm text-purple-700">
              Bạn đã đạt cấp độ cao nhất với những ưu đãi độc quyền
            </p>
          </div>
        </div>
      )}
    </div>
  );
}