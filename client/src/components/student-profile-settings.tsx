import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowUpFromLine, Calendar, Phone, MapPin, User, Users } from 'lucide-react';
import { format } from 'date-fns';

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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { PhotoGuidelines } from '@/components/photo-guidelines';
import { Separator } from '@/components/ui/separator';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Form schemas
const personalInfoSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).optional(),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  class: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  profileImage: z.any().optional(),
});

const notificationFormSchema = z.object({
  smsNotifications: z.boolean().default(false),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  newPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  confirmPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

// Type definitions
type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface StudentProfileSettingsProps {
  profileEndpoint?: string;
  notificationEndpoint?: string;
  passwordEndpoint?: string;
}

export function StudentProfileSettings({
  profileEndpoint = '/api/student/profile',
  notificationEndpoint = '/api/student/notifications',
  passwordEndpoint = '/api/auth/reset-password',
}: StudentProfileSettingsProps) {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  
  // State for showing/hiding passwords
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for profile image previewing
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profileImage || null
  );
  
  // Define the student profile data type
  interface StudentProfileData {
    id: number;
    name: string;
    email: string;
    class: string;
    enrollmentDate: string;
    phone?: string | null;
    address?: string | null;
    dateOfBirth?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    profileImage?: string | null;
  }
  
  // Fetch student profile data
  const { data: studentProfile, isLoading: isLoadingProfile } = useQuery<StudentProfileData>({
    queryKey: ["/api/student/profile"],
    enabled: !!user?.studentId,
  });
  
  // Initialize forms with default values
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: null,
      address: null,
      dateOfBirth: null,
      class: '',
      guardianName: '',
      guardianPhone: '',
    },
  });
  
  // Update form values when student profile data is loaded
  React.useEffect(() => {
    if (studentProfile) {
      personalInfoForm.setValue('name', studentProfile.name || user?.name || '');
      personalInfoForm.setValue('email', studentProfile.email || user?.email || '');
      personalInfoForm.setValue('phone', studentProfile.phone || '');
      personalInfoForm.setValue('address', studentProfile.address || '');
      personalInfoForm.setValue('class', studentProfile.class || '');
      personalInfoForm.setValue('guardianName', studentProfile.guardianName || '');
      personalInfoForm.setValue('guardianPhone', studentProfile.guardianPhone || '');
      
      if (studentProfile.dateOfBirth) {
        personalInfoForm.setValue('dateOfBirth', new Date(studentProfile.dateOfBirth));
      }
    }
  }, [studentProfile, user]); // Remove personalInfoForm from dependencies to prevent infinite loop
  
  // Initialize notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      smsNotifications: user?.smsNotifications || false,
      smsExamResults: user?.smsExamResults || false,
      smsUpcomingExams: user?.smsUpcomingExams || false,
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
  
  // Handle profile image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
          personalInfoForm.setValue('profileImage', file);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Personal information update mutation
  const personalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormValues) => {
      // Prepare the request body
      const requestBody = {
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        profileImage: imagePreview
      };
      
      console.log('Submitting profile update:', requestBody);
      
      const response = await fetch(profileEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update error:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update user state with new profile data
      if (user) {
        setUser({
          ...user,
          email: data.email,
          profileImage: data.profileImage,
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      
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
  
  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const response = await fetch(notificationEndpoint, {
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
      // Update user state with notification preferences
      if (user) {
        setUser({
          ...user,
          smsNotifications: data.smsNotifications,
          smsExamResults: data.smsExamResults,
          smsUpcomingExams: data.smsUpcomingExams
        });
      }
      
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
  
  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await fetch(passwordEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear password form
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was a problem updating your password.",
        variant: "destructive",
      });
    }
  });
  
  // Form submit handlers
  const onPersonalInfoSubmit = (data: PersonalInfoFormValues) => {
    personalInfoMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };
  
  return (
    <Tabs defaultValue="personal" className="w-full space-y-6">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="personal">Personal Info</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      {/* Personal Information Tab */}
      <TabsContent value="personal" className="space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your personal details and contact information
              </p>
            </div>
            
            <Form {...personalInfoForm}>
              <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 relative group">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-white">
                        {user?.name?.charAt(0) || 'U'}{user?.name?.split(' ')[1]?.charAt(0) || ''}
                      </span>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageUpload}
                      />
                      <label
                        htmlFor="profile-image"
                        className="cursor-pointer"
                      >
                        <div className="rounded-full p-1 bg-black/30">
                          <ArrowUpFromLine className="h-5 w-5 text-white" />
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Upload a new profile picture
                    </p>
                    <div className="flex items-center justify-center space-x-1">
                      <PhotoGuidelines />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Basic Information</h4>
                    
                    {/* Name (Read-only) */}
                    <FormField
                      control={personalInfoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Full Name</FormLabel>
                            <span className="ml-1 text-xs text-muted-foreground">(Read-only)</span>
                          </div>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Your name can only be changed by an administrator
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Email */}
                    <FormField
                      control={personalInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Phone */}
                    <FormField
                      control={personalInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Date of Birth */}
                    <FormField
                      control={personalInfoForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">School Information</h4>
                    
                    {/* Class (Read-only) */}
                    <FormField
                      control={personalInfoForm.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center">
                            <FormLabel>Class</FormLabel>
                            <span className="ml-1 text-xs text-muted-foreground">(Read-only)</span>
                          </div>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Your class assignment can only be changed by an administrator
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Address */}
                    <FormField
                      control={personalInfoForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 min-h-[80px]" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Guardian Information */}
                    <h4 className="font-medium mt-6">Guardian Information</h4>
                    
                    {/* Guardian Name */}
                    <FormField
                      control={personalInfoForm.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Guardian Phone */}
                    <FormField
                      control={personalInfoForm.control}
                      name="guardianPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="submit" disabled={personalInfoMutation.isPending}>
                    {personalInfoMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Control how and when you receive notifications
              </p>
            </div>
            
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  
                  {/* SMS Notifications section removed */}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={notificationMutation.isPending}>
                    {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage your password and account security
              </p>
            </div>
            
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Change Password</h4>
                  
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
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      passwordForm.reset({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}