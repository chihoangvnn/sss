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
    <div className="bg-white rounded-lg p-3 mb-2 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-100 to-transparent"></div>
      </div>

      {/* Tier Header */}
      <div className={`relative bg-gradient-to-r ${currentTier.bgGradient} rounded-lg p-3 mb-2 overflow-hidden`}>
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
            <h3 className={`text-base font-bold ${currentTier.textColor} mb-1`}>
              KHÁCH HÀNG {currentTier.name.toUpperCase()}
            </h3>
            <p className={`text-xs ${currentTier.textColor} opacity-90 mb-2`}>
              Tổng chi tiêu: {formatCurrency(totalSpent)}
            </p>
            <div className={`text-xs font-bold ${currentTier.textColor} leading-tight`}>
              {currentTier.motivationalTitle} • {currentTier.motivationalSubtitle}
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-3">
            <span className="text-3xl animate-bounce">{currentTier.emoji}</span>
          </div>
        </div>
      </div>

      {/* Compact Progress & Benefits */}
      <div className="pt-2 border-t border-gray-100">
        <div className="space-y-1">
          {/* Top 3 Benefits */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
              {currentTier.benefits.slice(0, 3).map((benefit: string, index: number) => (
                <span key={index} className="whitespace-nowrap">✓ {benefit}</span>
              ))}
            </div>
            {currentTier.id === 'diamond' && (
              <Crown className="w-3 h-3 text-purple-600 ml-2 flex-shrink-0" />
            )}
          </div>
          
          {/* Progress line */}
          {nextTier && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Lên {nextTier.name}: {formatCurrencyShort(amountToNext)}đ
              </span>
            </div>
          )}
        </div>
        
        {/* Ultra compact progress bar */}
        {nextTier && (
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
        )}
      </div>

    </div>
  );
}