import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-500/20 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold">Email Sent!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check your email for password reset instructions
          </p>
        </div>
        <div className="space-y-4">
          <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-sm text-blue-200">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-blue-300 mt-2">
              The link will expire in 1 hour for security reasons.
            </p>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full glass-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <Mail className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold">Forgot Password?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="glass-input"
          />
        </div>
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full glass-button"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Link
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full glass-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </form>
    </div>
  );
}