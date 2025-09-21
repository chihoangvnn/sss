import React from 'react';
import BaseSatelliteTemplate, { SatelliteConfig } from './BaseSatelliteTemplate';

// 🌸 Beauty Content Satellite
export const BeautyContentSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'beauty-content-satellite',
    name: 'Beauty Content Hub',
    description: 'Automated content management for beauty, skincare, and cosmetics',
    category: 'content',
    tag: {
      id: '160d937b-43b7-48d2-88d8-15d409c73ad3', // Làm Đẹp tag ID from our data
      name: 'Làm Đẹp',
      slug: 'làm-đẹp',
      color: '#EC4899',
      icon: '💄',
    },
    theme: {
      primaryColor: '#EC4899', // Pink
      secondaryColor: '#F97316', // Orange
      accentColor: '#8B5CF6', // Purple
      gradient: 'from-pink-500 to-orange-500'
    },
    status: 'active',
    metrics: {
      totalContent: 45,
      totalAccounts: 12,
      scheduledPosts: 8,
      activeAccounts: 10,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-pink-200"
    />
  );
};

// 🏃‍♀️ Fitness & Sports Satellite
export const FitnessSportsSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'fitness-sports-satellite',
    name: 'Fitness & Sports Hub',
    description: 'Automated content for fitness, gym, yoga, and sports activities',
    category: 'content',
    tag: {
      id: 'e4220bdf-7490-4a25-9dea-fe464d32c349', // Gym tag ID from our data
      name: 'Gym',
      slug: 'gym',
      color: '#059669',
      icon: '💪',
    },
    theme: {
      primaryColor: '#059669', // Emerald
      secondaryColor: '#10B981', // Emerald light
      accentColor: '#06B6D4', // Cyan
      gradient: 'from-emerald-500 to-cyan-500'
    },
    status: 'active',
    metrics: {
      totalContent: 32,
      totalAccounts: 8,
      scheduledPosts: 15,
      activeAccounts: 7,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-emerald-200"
    />
  );
};

// 🍃 Healthy Living Satellite  
export const HealthyLivingSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'healthy-living-satellite',
    name: 'Healthy Living Hub',
    description: 'Content management for healthy lifestyle, wellness, and nutrition',
    category: 'content',
    tag: {
      id: '41082ffe-3d7d-407f-977d-7ce323c9296f', // Sống Khỏe tag ID from our data
      name: 'Sống Khỏe',
      slug: 'sống-khỏe',
      color: '#10B981',
      icon: '🌱',
    },
    theme: {
      primaryColor: '#10B981', // Emerald
      secondaryColor: '#059669', // Emerald dark
      accentColor: '#06D6A0', // Mint
      gradient: 'from-emerald-400 to-teal-500'
    },
    status: 'active',
    metrics: {
      totalContent: 28,
      totalAccounts: 6,
      scheduledPosts: 5,
      activeAccounts: 5,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-emerald-200"
    />
  );
};

// 🧘‍♀️ Meditation & Mindfulness Satellite
export const MeditationSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'meditation-satellite',
    name: 'Mindfulness Hub',
    description: 'Peaceful content for meditation, mindfulness, and spiritual wellness',
    category: 'content',
    tag: {
      id: '5f77ea79-650f-495f-9764-86f460a7015c', // Thiền tag ID from our data
      name: 'Thiền',
      slug: 'thiền',
      color: '#8B5CF6',
      icon: '🧘‍♀️',
    },
    theme: {
      primaryColor: '#8B5CF6', // Purple
      secondaryColor: '#A855F7', // Purple light
      accentColor: '#EC4899', // Pink
      gradient: 'from-purple-500 to-pink-500'
    },
    status: 'paused',
    metrics: {
      totalContent: 15,
      totalAccounts: 4,
      scheduledPosts: 2,
      activeAccounts: 3,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-purple-200"
    />
  );
};

// 🎯 Customer Pipeline Satellite (VIP Customers)
export const VIPCustomerSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'vip-customer-satellite',
    name: 'VIP Customer Hub',
    description: 'Personalized content and engagement for VIP customers',
    category: 'customer_pipeline',
    tag: {
      id: '0b608b2d-29d3-41d5-9129-6337974639d4', // Khách VIP tag ID from our data
      name: 'Khách VIP',
      slug: 'khach-vip',
      color: '#8B5CF6',
      icon: '⭐',
    },
    theme: {
      primaryColor: '#8B5CF6', // Purple
      secondaryColor: '#A855F7', // Purple light
      accentColor: '#F59E0B', // Amber
      gradient: 'from-purple-500 to-amber-500'
    },
    status: 'active',
    metrics: {
      totalContent: 18,
      totalAccounts: 15,
      scheduledPosts: 12,
      activeAccounts: 13,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-purple-200"
    />
  );
};

// 🔄 Follow-up Pipeline Satellite
export const FollowUpSatellite: React.FC<{
  onStatusChange?: (status: 'active' | 'paused') => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
}> = ({ onStatusChange, onRefresh, onConfigure }) => {
  const config: SatelliteConfig = {
    id: 'follow-up-satellite',
    name: 'Follow-up Hub',
    description: 'Automated follow-up sequences for customer engagement',
    category: 'customer_pipeline',
    tag: {
      id: '8160f2e7-507d-4a18-8cbe-69489cd4ed71', // Cần follow-up tag ID from our data
      name: 'Cần follow-up',
      slug: 'can-follow-up',
      color: '#EF4444',
      icon: '🔄',
    },
    theme: {
      primaryColor: '#EF4444', // Red
      secondaryColor: '#F97316', // Orange
      accentColor: '#F59E0B', // Amber
      gradient: 'from-red-500 to-orange-500'
    },
    status: 'active',
    metrics: {
      totalContent: 22,
      totalAccounts: 18,
      scheduledPosts: 25,
      activeAccounts: 16,
    },
    lastUpdated: new Date().toISOString(),
  };

  return (
    <BaseSatelliteTemplate
      config={config}
      onStatusChange={onStatusChange}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      className="border-red-200"
    />
  );
};

// 🎨 Export all satellite instances for easy access
export const SatelliteInstances = {
  Beauty: BeautyContentSatellite,
  Fitness: FitnessSportsSatellite,
  HealthyLiving: HealthyLivingSatellite,
  Meditation: MeditationSatellite,
  VIPCustomer: VIPCustomerSatellite,
  FollowUp: FollowUpSatellite,
};

// Helper function to get satellite config by category
export const getSatelliteConfigsByCategory = () => {
  return {
    content: [
      {
        name: 'Beauty Content Hub',
        description: 'Beauty, skincare, and cosmetics content',
        component: BeautyContentSatellite,
        color: '#EC4899',
        icon: '💄',
      },
      {
        name: 'Fitness & Sports Hub',
        description: 'Fitness, gym, yoga, and sports content',
        component: FitnessSportsSatellite,
        color: '#059669',
        icon: '💪',
      },
      {
        name: 'Healthy Living Hub',
        description: 'Healthy lifestyle, wellness, and nutrition',
        component: HealthyLivingSatellite,
        color: '#10B981',
        icon: '🌱',
      },
      {
        name: 'Mindfulness Hub',
        description: 'Meditation, mindfulness, and spiritual wellness',
        component: MeditationSatellite,
        color: '#8B5CF6',
        icon: '🧘‍♀️',
      },
    ],
    customer_pipeline: [
      {
        name: 'VIP Customer Hub',
        description: 'Personalized content for VIP customers',
        component: VIPCustomerSatellite,
        color: '#8B5CF6',
        icon: '⭐',
      },
      {
        name: 'Follow-up Hub',
        description: 'Automated follow-up sequences',
        component: FollowUpSatellite,
        color: '#EF4444',
        icon: '🔄',
      },
    ],
  };
};