import React from "react";
import { SocialMediaPanel } from "@/components/SocialMediaPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.242 6.242 0 0 1-1.137-.966c-.849-.849-1.347-2.143-1.347-3.416C16.394.482 15.912 0 15.372 0h-3.372c-.54 0-.976.436-.976.976v11.405c0 1.47-1.194 2.665-2.665 2.665s-2.665-1.194-2.665-2.665c0-1.47 1.194-2.665 2.665-2.665.273 0 .537.041.786.117.54.166 1.119-.138 1.285-.678s-.138-1.119-.678-1.285a4.647 4.647 0 0 0-1.393-.203c-2.551 0-4.617 2.066-4.617 4.617s2.066 4.617 4.617 4.617 4.617-2.066 4.617-4.617V6.853c1.346.713 2.88 1.097 4.464 1.097.54 0 .976-.436.976-.976s-.436-.976-.976-.976c-1.346 0-2.64-.524-3.608-1.436z"/>
  </svg>
);

export default function TikTokBusiness() {
  return (
    <div className="p-6 space-y-6">
      {/* Platform Banner */}
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center">
              <TikTokIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-pink-900">TikTok Business</CardTitle>
              <p className="text-sm text-pink-700 mt-1">
                Quản lý tài khoản TikTok Business và nội dung video
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-pink-100 text-pink-700">
              Business Platform
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* TikTok Business Panel */}
      <SocialMediaPanel />
    </div>
  );
}