import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { User } from '../shared/schema.js';

// Environment variables for Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Service role client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client for client-side operations
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Extend Express Request type to include Supabase
declare global {
  namespace Express {
    interface Request {
      supabase?: typeof supabaseAdmin;
      user?: Omit<User, 'password'>;
    }
  }
}

// Middleware to attach Supabase client to request
export function supabaseMiddleware(req: Request, res: Response, next: NextFunction) {
  req.supabase = supabaseAdmin;
  next();
}

// Authentication middleware using Supabase-style JWT tokens
export async function supabaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check for session-based auth as fallback
      if (req.session?.user) {
        req.user = req.session.user;
        return next();
      }
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Decode the token (in production, use proper JWT verification)
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      // Get user from storage using the token data
      const storage = await import('./storage.js');
      let user;
      
      if (tokenData.role === 'student') {
        user = await storage.storage.getStudentByEmail(tokenData.email);
        if (user) {
          user = {
            ...user,
            role: 'student',
            isAdmin: false
          };
        }
      } else {
        user = await storage.storage.getUserByEmail(tokenData.email);
      }
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Remove password field before assigning to req.user
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      next();
    } catch (decodeError) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user || req.session?.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  // Set req.user for consistency
  req.user = user;
  next();
}

// Middleware to require student role
export function requireStudent(req: Request, res: Response, next: NextFunction) {
  const user = req.user || req.session?.user;
  
  console.log('[requireStudent] Checking user:', user);
  console.log('[requireStudent] User role:', user?.role);
  
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  
  // Set req.user for consistency
  req.user = user;
  next();
}

// General authentication middleware - requires any authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.user || req.session?.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Set req.user for consistency
  req.user = user;
  next();
}

// Row Level Security (RLS) helper functions
export async function enableRLS(tableName: string) {
  try {
    await supabaseAdmin.rpc('enable_rls', { table_name: tableName });
  } catch (error) {
    console.error(`Failed to enable RLS for ${tableName}:`, error);
  }
}

export async function createRLSPolicies() {
  try {
    // Enable RLS on all tables
    await enableRLS('users');
    await enableRLS('students');
    await enableRLS('exams');
    await enableRLS('results');

    // Create policies for users table
    await supabaseAdmin.rpc('create_policy', {
      table_name: 'users',
      policy_name: 'Users can view own data',
      operation: 'SELECT',
      expression: 'auth.uid() = id'
    });

    // Create policies for students table
    await supabaseAdmin.rpc('create_policy', {
      table_name: 'students',
      policy_name: 'Students can view own data',
      operation: 'SELECT',
      expression: 'auth.uid() = id'
    });

    await supabaseAdmin.rpc('create_policy', {
      table_name: 'students',
      policy_name: 'Admins can view all students',
      operation: 'SELECT',
      expression: 'auth.jwt() ->> \'role\' = \'admin\''
    });

    // Create policies for exams table
    await supabaseAdmin.rpc('create_policy', {
      table_name: 'exams',
      policy_name: 'Everyone can view exams',
      operation: 'SELECT',
      expression: 'true'
    });

    await supabaseAdmin.rpc('create_policy', {
      table_name: 'exams',
      policy_name: 'Admins can manage exams',
      operation: 'ALL',
      expression: 'auth.jwt() ->> \'role\' = \'admin\''
    });

    // Create policies for results table
    await supabaseAdmin.rpc('create_policy', {
      table_name: 'results',
      policy_name: 'Students can view own results',
      operation: 'SELECT',
      expression: 'student_id = auth.uid()'
    });

    await supabaseAdmin.rpc('create_policy', {
      table_name: 'results',
      policy_name: 'Admins can manage all results',
      operation: 'ALL',
      expression: 'auth.jwt() ->> \'role\' = \'admin\''
    });

  } catch (error) {
    console.error('Failed to create RLS policies:', error);
  }
}

// Create Supabase session for authenticated user
export async function createSupabaseSession(user: User) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      user_metadata: {
        role: user.role,
        name: user.name
      }
    });

    if (error) {
      console.error('Failed to create Supabase user:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error creating Supabase session:', error);
    return null;
  }
}

// Sign out user from Supabase
export async function signOutUser(userId: string) {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('Error signing out user:', error);
  }
}

// Check Supabase connection health
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
}

// Realtime subscription helper
export function createRealtimeSubscription(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const subscription = supabaseAdmin
    .channel(`public:${table}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table,
      filter 
    }, callback)
    .subscribe();

  return subscription;
}

// Cleanup subscription
export function cleanupSubscription(subscription: any) {
  if (subscription) {
    subscription.unsubscribe();
  }
}