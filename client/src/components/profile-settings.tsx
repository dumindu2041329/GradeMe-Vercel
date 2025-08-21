import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowUpFromLine } from 'lucide-react';
import { resizeImageForProfile, validateImageFile, blobToBase64 } from '@/utils/image-utils';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';
import { PhotoGuidelines } from '@/components/photo-guidelines';

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  profileImage: z.any().optional(),
  // Student-specific fields removed - now read-only
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(false),
  emailUpcomingExams: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  newPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ProfileSettings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Determine user role from context
  const userRole = user?.role || 'student';
  
  // Initialize profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });
  
  // Initialize notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.emailNotifications || false,
      emailExamResults: user?.emailExamResults || false,
      emailUpcomingExams: user?.emailUpcomingExams || false,
    },
  });
  
  // Initialize password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const endpoint = userRole === 'student' ? '/api/students/profile' : '/api/users/profile';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUser({ ...user!, ...data });
      toast({
        title: 'Profile updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Resize the image
      const resizedBlob = await resizeImageForProfile(file);
      const base64 = await blobToBase64(resizedBlob);
      
      // Set the preview
      setUploadedImage(base64);
      setSelectedFile(new File([resizedBlob], file.name, { type: resizedBlob.type }));
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error processing image",
        description: "Please try another image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Upload profile image mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      
      const formData = new FormData();
      formData.append('profileImage', selectedFile);
      
      const endpoint = userRole === 'student' 
        ? '/api/student/profile/upload-image' 
        : '/api/profile/upload-image';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (user && data.imageUrl) {
        setUser({ ...user, profileImage: data.imageUrl });
        setUploadedImage(null);
        setSelectedFile(null);
        toast({
          title: 'Profile image uploaded successfully',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to upload image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete profile image mutation
  const deleteProfileImageMutation = useMutation({
    mutationFn: async () => {
      const endpoint = userRole === 'student' 
        ? '/api/student/profile/delete-image' 
        : '/api/profile/delete-image';
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      if (user) {
        setUser({ ...user, profileImage: null });
        toast({
          title: 'Profile image deleted successfully',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Failed to delete image',
        variant: 'destructive',
      });
    },
  });
  
  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      // Prepare request body based on user role
      const requestBody = {
        emailNotifications: data.emailNotifications,
        emailExamResults: data.emailExamResults,
        emailUpcomingExams: data.emailUpcomingExams,
      };
      
      const endpoint = userRole === 'student' ? '/api/student/notifications' : '/api/users/notifications';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user state with notification preferences
      if (user) {
        setUser({
          ...user,
          emailNotifications: data.emailNotifications,
          emailExamResults: data.emailExamResults,
          emailUpcomingExams: data.emailUpcomingExams
        });
      }
      
      toast({
        title: 'Notification settings updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update notification settings',
        variant: 'destructive',
      });
    },
  });
  
  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const endpoint = userRole === 'student' ? '/api/student/change-password' : '/api/users/change-password';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: 'Password changed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to change password',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Form submit handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Image Upload */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Profile Image</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-800 dark:text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              {user?.profileImage && !uploadedImage && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => deleteProfileImageMutation.mutate()}
                  disabled={deleteProfileImageMutation.isPending}
                >
                  <span className="text-xs">×</span>
                </Button>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <PhotoGuidelines />
              
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Button type="button" variant="outline" disabled={isUploading} asChild>
                    <span>
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                      {isUploading ? "Processing..." : "Choose Image"}
                    </span>
                  </Button>
                </label>
                
                {uploadedImage && selectedFile && (
                  <>
                    <Button
                      type="button"
                      onClick={() => uploadProfileImageMutation.mutate()}
                      disabled={uploadProfileImageMutation.isPending}
                    >
                      {uploadProfileImageMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null);
                        setSelectedFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Form */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Personal Information</span>
            </span>
          </h3>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              {userRole === 'admin' && (
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-row space-x-2">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Notification Settings Form */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Notification Settings</span>
            </span>
          </h3>
          
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Email Notifications</h4>
                
                <FormField
                  control={notificationForm.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Email Notifications</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Receive email notifications
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={notificationForm.control}
                  name="emailExamResults"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Exam Results</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications when exam results are available
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={notificationForm.control}
                  name="emailUpcomingExams"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Upcoming Exams</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Receive reminders about upcoming exams
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-start">
                <Button type="submit" disabled={notificationMutation.isPending}>
                  {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Password Form */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">
            <span className="inline-flex items-center">
              <span className="mr-2">Change Password</span>
            </span>
          </h3>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showCurrentPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showNewPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? "Hide" : "Show"} password
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-row space-x-2">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? "Changing..." : "Change Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => passwordForm.reset()}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}