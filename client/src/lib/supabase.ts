import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Authentication helpers
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Users table operations
  users: {
    async getById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    async getByEmail(email: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
  },

  // Students table operations
  students: {
    async getAll() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      return { data, error };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    async create(student: any) {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      return { error };
    }
  },

  // Exams table operations
  exams: {
    async getAll() {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('date', { ascending: false });
      return { data, error };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    async create(exam: any) {
      const { data, error } = await supabase
        .from('exams')
        .insert(exam)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);
      return { error };
    }
  },

  // Results table operations
  results: {
    async getAll() {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:students(*),
          exam:exams(*)
        `)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async getByStudentId(studentId: string) {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          exam:exams(*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async create(result: any) {
      const { data, error } = await supabase
        .from('results')
        .insert(result)
        .select()
        .single();
      return { data, error };
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', id);
      return { error };
    }
  }
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to table changes
  subscribe(table: string, callback: (payload: any) => void, filter?: string) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter,
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // Unsubscribe from channel
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },

  // Subscribe to specific events
  subscribeToInserts(table: string, callback: (payload: any) => void) {
    return this.subscribe(table, (payload) => {
      if (payload.eventType === 'INSERT') {
        callback(payload);
      }
    });
  },

  subscribeToUpdates(table: string, callback: (payload: any) => void) {
    return this.subscribe(table, (payload) => {
      if (payload.eventType === 'UPDATE') {
        callback(payload);
      }
    });
  },

  subscribeToDeletes(table: string, callback: (payload: any) => void) {
    return this.subscribe(table, (payload) => {
      if (payload.eventType === 'DELETE') {
        callback(payload);
      }
    });
  }
};

// Utility functions
export const utils = {
  // Check if Supabase is configured
  isConfigured() {
    return !!(supabaseUrl && supabaseAnonKey);
  },

  // Get Supabase configuration status
  getConfigStatus() {
    return {
      url: !!supabaseUrl,
      anonKey: !!supabaseAnonKey,
      configured: this.isConfigured()
    };
  },

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      return { healthy: !error, error };
    } catch (error) {
      return { healthy: false, error };
    }
  }
};

export default supabase;