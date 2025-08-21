-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE exam_status AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  class TEXT NOT NULL,
  enrollment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  phone TEXT,
  address TEXT,
  date_of_birth TIMESTAMP,
  guardian_name TEXT,
  guardian_phone TEXT,
  profile_image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create users table with reference to students
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  profile_image TEXT,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  email_exam_results BOOLEAN NOT NULL DEFAULT FALSE,
  email_upcoming_exams BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  start_time TIMESTAMP,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  status exam_status NOT NULL DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);

--> statement-breakpoint

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for password reset tokens table
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

--> statement-breakpoint

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

-- Apply triggers to all tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
    CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exams_updated_at') THEN
    CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_results_updated_at') THEN
    CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

--> statement-breakpoint

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION is_admin(user_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student_owner(user_id text, student_id integer)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = user_id AND student_id = student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--> statement-breakpoint

-- Create RLS policies for users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
    CREATE POLICY "Users can view their own data" ON users
      FOR SELECT USING (auth.uid()::text = id::text OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
    CREATE POLICY "Users can update their own data" ON users
      FOR UPDATE USING (auth.uid()::text = id::text OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Only admins can insert users') THEN
    CREATE POLICY "Only admins can insert users" ON users
      FOR INSERT WITH CHECK (is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Only admins can delete users') THEN
    CREATE POLICY "Only admins can delete users" ON users
      FOR DELETE USING (is_admin(auth.uid()::text));
  END IF;
END
$$;

--> statement-breakpoint

-- Create RLS policies for students table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can view their own data, admins can view all') THEN
    CREATE POLICY "Students can view their own data, admins can view all" ON students
      FOR SELECT USING (is_student_owner(auth.uid()::text, id) OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can update their own data, admins can update all') THEN
    CREATE POLICY "Students can update their own data, admins can update all" ON students
      FOR UPDATE USING (is_student_owner(auth.uid()::text, id) OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Only admins can insert students') THEN
    CREATE POLICY "Only admins can insert students" ON students
      FOR INSERT WITH CHECK (is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Only admins can delete students') THEN
    CREATE POLICY "Only admins can delete students" ON students
      FOR DELETE USING (is_admin(auth.uid()::text));
  END IF;
END
$$;

--> statement-breakpoint

-- Create RLS policies for exams table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Everyone can view exams') THEN
    CREATE POLICY "Everyone can view exams" ON exams
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Only admins can insert exams') THEN
    CREATE POLICY "Only admins can insert exams" ON exams
      FOR INSERT WITH CHECK (is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Only admins can update exams') THEN
    CREATE POLICY "Only admins can update exams" ON exams
      FOR UPDATE USING (is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Only admins can delete exams') THEN
    CREATE POLICY "Only admins can delete exams" ON exams
      FOR DELETE USING (is_admin(auth.uid()::text));
  END IF;
END
$$;

--> statement-breakpoint

-- Create RLS policies for results table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'results' AND policyname = 'Students can view their own results, admins can view all') THEN
    CREATE POLICY "Students can view their own results, admins can view all" ON results
      FOR SELECT USING (is_student_owner(auth.uid()::text, student_id) OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'results' AND policyname = 'Only admins and students can insert their own results') THEN
    CREATE POLICY "Only admins and students can insert their own results" ON results
      FOR INSERT WITH CHECK (is_student_owner(auth.uid()::text, student_id) OR is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'results' AND policyname = 'Only admins can update results') THEN
    CREATE POLICY "Only admins can update results" ON results
      FOR UPDATE USING (is_admin(auth.uid()::text));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'results' AND policyname = 'Only admins can delete results') THEN
    CREATE POLICY "Only admins can delete results" ON results
      FOR DELETE USING (is_admin(auth.uid()::text));
  END IF;
END
$$;

--> statement-breakpoint

-- Create RLS policies for password_reset_tokens table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Anyone can insert password reset tokens') THEN
    CREATE POLICY "Anyone can insert password reset tokens" ON password_reset_tokens
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Anyone can select password reset tokens') THEN
    CREATE POLICY "Anyone can select password reset tokens" ON password_reset_tokens
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Anyone can update password reset tokens') THEN
    CREATE POLICY "Anyone can update password reset tokens" ON password_reset_tokens
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Anyone can delete password reset tokens') THEN
    CREATE POLICY "Anyone can delete password reset tokens" ON password_reset_tokens
      FOR DELETE USING (true);
  END IF;
END
$$;