import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileImagePopupProps {
  imageUrl?: string | null;
  userName?: string;
  userRole?: 'admin' | 'student';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileImagePopup({ 
  imageUrl, 
  userName, 
  userRole = 'admin',
  size = 'md',
  className = "" 
}: ProfileImagePopupProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const getInitials = (name?: string) => {
    if (!name) return userRole === 'admin' ? 'A' : 'S';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}>
          <Avatar className={sizeClasses[size]}>
            <AvatarImage 
              src={imageUrl || undefined} 
              alt={`${userName || 'User'} profile`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {imageUrl ? (
                getInitials(userName)
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {userName ? `${userName}'s Profile Picture` : `${userRole === 'admin' ? 'Admin' : 'Student'} Profile Picture`}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4">
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt={`${userName || 'User'} profile picture`}
                className="w-64 h-64 rounded-full object-cover shadow-lg"
              />
            </div>
          ) : (
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <div className="text-center text-white">
                <User className="h-16 w-16 mx-auto mb-2" />
                <p className="text-sm font-medium">No profile picture</p>
              </div>
            </div>
          )}
        </div>
        {!imageUrl && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Upload a profile picture to personalize your account</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}