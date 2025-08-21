import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { resizeImageForProfile, validateImageFile, blobToBase64 } from '@/utils/image-utils';

interface ProfileImageUploadProps {
  userType: 'admin' | 'student';
  currentImageUrl?: string | null;
  userName?: string;
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
}

export function ProfileImageUpload({ 
  userType, 
  currentImageUrl, 
  userName, 
  onImageUpdate,
  className = ""
}: ProfileImageUploadProps) {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);



  // Sync imagePreview with currentImageUrl prop changes
  useEffect(() => {
    setImagePreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file using utility function
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Resize image for optimal circular display
      const resizedBlob = await resizeImageForProfile(file, {
        width: 200,
        height: 200,
        quality: 0.85,
        cropToCircle: true
      });

      // Convert to base64 for preview
      const base64Preview = await blobToBase64(resizedBlob);
      setImagePreview(base64Preview);

      // Create a new file from the resized blob
      const resizedFile = new File([resizedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Upload the resized file
      await uploadImage(resizedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Image processing failed",
        description: "Unable to process the selected image. Please try a different image.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const endpoint = userType === 'student' 
        ? '/api/student/profile/upload-image'
        : '/api/profile/upload-image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImagePreview(data.imageUrl);
        
        // Update user context
        if (user && setUser) {
          setUser({ ...user, profileImage: data.imageUrl });
        }
        
        // Call the callback if provided
        onImageUpdate?.(data.imageUrl);

        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      
      // Reset preview on error
      setImagePreview(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async () => {
    setIsUploading(true);

    try {
      const endpoint = userType === 'student' 
        ? '/api/student/profile/delete-image'
        : '/api/profile/delete-image';

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImagePreview(null);
        
        // Update user context
        if (user && setUser) {
          setUser({ ...user, profileImage: null });
        }
        
        // Call the callback if provided
        onImageUpdate?.(null);

        toast({
          title: "Success",
          description: "Profile image deleted successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`border shadow-sm bg-white dark:bg-[#030711] ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {(() => {
            // Determine what to render based on state
            if (imagePreview) {
              // Show image with overlay when image exists
              return (
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview} alt={userName || 'Profile'} />
                  </Avatar>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={triggerFileSelect}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              );
            }
            
            // No image - check if admin or student
            if (userType === 'admin') {
              // Show initials for admin when no image exists
              const initials = getInitials();
              return (
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xl text-gray-800 dark:text-white font-semibold">{initials}</span>
                  </div>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={triggerFileSelect}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
              );
            }
            
            // Student upload area
            return (
              <div 
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white"
                onClick={triggerFileSelect}
              >
                <Upload className="h-5 w-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-medium">Upload</span>
              </div>
            );
          })()}

          <div className="flex gap-2">
            <Button
              onClick={triggerFileSelect}
              disabled={isUploading}
              size="sm"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : imagePreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
            
            {imagePreview && (
              <Button
                onClick={deleteImage}
                disabled={isUploading}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-sm text-muted-foreground text-center">
            Upload a profile picture (JPEG, PNG, WebP, or GIF)<br />
            Maximum file size: 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}