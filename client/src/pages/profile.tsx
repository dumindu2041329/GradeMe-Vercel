import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Upload } from "lucide-react";
import { PhotoGuidelines } from "@/components/photo-guidelines";
import { ProfileImageUpload } from "@/components/profile-image-upload";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  profileImage: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(false),
  smsNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(false),
  emailUpcomingExams: z.boolean().default(false),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(1, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Type definitions
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  // Authentication state
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  
  // File upload reference and state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.emailNotifications || false,
      smsNotifications: user?.smsNotifications || false,
      emailExamResults: user?.emailExamResults || false,
      emailUpcomingExams: user?.emailUpcomingExams || false,
      smsExamResults: user?.smsExamResults || false,
      smsUpcomingExams: user?.smsUpcomingExams || false,
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update form when user changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        profileImage: user.profileImage || "",
      });
      
      notificationForm.reset({
        emailNotifications: user.emailNotifications || false,
        smsNotifications: user.smsNotifications || false,
        emailExamResults: user.emailExamResults || false,
        emailUpcomingExams: user.emailUpcomingExams || false,
        smsExamResults: user.smsExamResults || false,
        smsUpcomingExams: user.smsUpcomingExams || false,
      });
    }
  }, [user, profileForm, notificationForm]);
  
  // Handle file selection for profile photo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setImageLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      
      // Update the form
      profileForm.setValue('profileImage', base64Image);
      
      // Call the mutation
      profileImageMutation.mutate(base64Image);
    };
    
    reader.onerror = () => {
      setImageLoading(false);
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your image.",
        variant: "destructive",
      });
    };
    
    reader.readAsDataURL(file);
  };
  
  // Profile image update mutation
  const profileImageMutation = useMutation({
    mutationFn: async (profileImage: string) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setImageLoading(false);
      
      // Update the user in the auth context with the new profile image
      if (user) {
        setUser({
          ...user,
          profileImage: profileForm.getValues().profileImage ?? null,
        });
      }
      
      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      setImageLoading(false);
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your profile image.",
        variant: "destructive",
      });
    }
  });
  
  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // If user auth state needs to be updated
      if (user) {
        setUser({
          ...user,
          name: data.name,
          email: data.email,
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    }
  });
  
  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const response = await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update notification settings');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user with the returned notification settings
      if (user) {
        setUser({
          ...user,
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          emailExamResults: data.emailExamResults,
          emailUpcomingExams: data.emailUpcomingExams,
          smsExamResults: data.smsExamResults,
          smsUpcomingExams: data.smsUpcomingExams
        });
      }
      
      // Make sure UI stays in sync
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      toast({
        title: "Settings Updated",
        description: "Your notification settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your notification settings.",
        variant: "destructive",
      });
    }
  });
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    // Log the data to ensure it's correct
    console.log("Submitting notification settings:", data);
    notificationMutation.mutate(data);
  };

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      // Reset the form
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your password.",
        variant: "destructive",
      });
    }
  });
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };

  return (
    <AppShell title="My Profile" sidebar={user?.role === "admin" ? "admin" : undefined}>
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications & Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            {/* Profile Photo */}
            <ProfileImageUpload
              userType={user?.role === 'admin' ? 'admin' : 'student'}
              currentImageUrl={user?.profileImage}
              userName={user?.name}
              onImageUpdate={(imageUrl) => {
                if (user && setUser) {
                  setUser({ ...user, profileImage: imageUrl });
                }
              }}
            />
            
            {/* User Info Card */}
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <h3 className="text-xl font-semibold">{user?.name || 'No name available'}</h3>
                  <Badge variant="outline" className="mb-1">
                    {user?.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                  {user?.role !== 'admin' && (
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  )}
                  {user?.role === 'student' && user?.studentId && (
                    <p className="text-sm text-muted-foreground">
                      Student ID: {user.studentId}
                    </p>
                  )}
                  {user?.id && user?.role !== 'admin' && (
                    <p className="text-xs text-muted-foreground">
                      User ID: {user.id}
                    </p>
                  )}
                  {user?.createdAt && user?.role !== 'admin' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Member since: {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  {user?.role === 'student' && (
                    <p className="text-sm text-muted-foreground">
                      Class: Not specified
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Profile Form */}
            <Card className="border shadow-sm">
              <CardContent className="p-6" aria-describedby="profile-description">
                <h3 className="text-lg font-medium mb-2">
                  <span className="inline-flex items-center">
                    <span className="mr-2">Profile Information</span>
                  </span>
                </h3>
                <p id="profile-description" className="text-sm text-muted-foreground mb-4">
                  Update your basic profile information.
                </p>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={profileMutation.isPending}>
                        {profileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          profileForm.reset({
                            name: "",
                            email: "",
                            profileImage: "",
                          });
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Settings Form */}
            <Card className="border shadow-sm mb-6">
              <CardContent className="p-6" aria-describedby="notification-settings-desc">
                <h3 className="text-lg font-medium mb-2">
                  <span className="inline-flex items-center">
                    <span className="mr-2">Notification Settings</span>
                  </span>
                </h3>
                <p id="notification-settings-desc" className="text-sm text-muted-foreground mb-4">
                  Configure how you receive notifications about exams and results.
                </p>
                
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Receive exam submission notifications via email
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
                    
                    {/* SMS Notifications removed */}
                    
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
              <CardContent className="p-6" aria-describedby="password-settings-desc">
                <h3 className="text-lg font-medium mb-2">
                  <span className="inline-flex items-center">
                    <span className="mr-2">Change Password</span>
                  </span>
                </h3>
                <p id="password-settings-desc" className="text-sm text-muted-foreground mb-4">
                  Update your password to keep your account secure.
                </p>
                
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
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={passwordMutation.isPending}>
                        {passwordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          passwordForm.reset({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}