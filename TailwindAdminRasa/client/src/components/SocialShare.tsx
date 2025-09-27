import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, MessageCircle, Copy, Gift } from 'lucide-react';

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  title, 
  text, 
  url = window.location.href,
  imageUrl,
  hashtags = []
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareData = {
    title,
    text,
    url,
    ...(imageUrl && { image: imageUrl })
  };

  const hashtagString = hashtags.length > 0 ? ' ' + hashtags.map(tag => `#${tag}`).join(' ') : '';
  const fullText = `${text}${hashtagString}\n\n${url}`;

  const shareOptions = [
    {
      id: 'native',
      name: 'Chia sẻ',
      icon: <Share2 className="w-4 h-4" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: async () => {
        try {
          if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
          } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(fullText);
            alert('✅ Đã copy link để chia sẻ!');
          }
        } catch (error) {
          await navigator.clipboard.writeText(fullText);
          alert('✅ Đã copy link để chia sẻ!');
        }
        setShowShareMenu(false);
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
      }
    },
    {
      id: 'zalo',
      name: 'Zalo',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(zaloUrl, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
      }
    },
    {
      id: 'copy',
      name: 'Copy link',
      icon: <Copy className="w-4 h-4" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: async () => {
        try {
          await navigator.clipboard.writeText(fullText);
          alert('✅ Đã copy link chia sẻ!');
        } catch (error) {
          alert('❌ Không thể copy link');
        }
        setShowShareMenu(false);
      }
    }
  ];

  return (
    <div className="relative">
      {/* Main Share Button */}
      <Button
        onClick={() => setShowShareMenu(!showShareMenu)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
      >
        <Share2 className="w-4 h-4" />
        Chia sẻ
      </Button>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]">
          <div className="text-xs text-gray-500 mb-2 px-2">Chia sẻ đến:</div>
          <div className="space-y-1">
            {shareOptions.map((option) => (
              <Button
                key={option.id}
                onClick={option.action}
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-left ${option.color} text-white hover:scale-105 transition-transform`}
              >
                {option.icon}
                <span className="ml-2">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
};

export default SocialShare;