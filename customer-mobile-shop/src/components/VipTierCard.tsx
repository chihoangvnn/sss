'use client'

import React from 'react';
import { VipProgress, formatCurrency, formatCurrencyShort } from '@/utils/vipCalculator';
import { Crown } from 'lucide-react';

interface VipTierCardProps {
  vipProgress: VipProgress;
}

export function VipTierCard({ vipProgress }: VipTierCardProps) {
  const { currentTier, totalSpent, nextTier, progressToNext, amountToNext } = vipProgress;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 overflow-hidden relative">
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

      {/* Compact Progress & Benefits */}
      <div className="pt-3 border-t border-gray-100">
        {/* Top Benefits Preview */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <span>✓ {currentTier.benefits[0]}</span>
            {currentTier.benefits[1] && <span>✓ {currentTier.benefits[1]}</span>}
          </div>
          {currentTier.id === 'diamond' && (
            <Crown className="w-4 h-4 text-purple-600" />
          )}
        </div>

        {/* Compact Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Lên {nextTier.name}</span>
              <span className="font-medium text-gray-900">
                Còn {formatCurrencyShort(amountToNext)}đ
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}