-- This migration assigns admin role to admin@admin.com
-- First sign up with email: admin@admin.com and password: password
-- Then this migration will assign the admin role

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for admin@admin.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com';
  
  -- If user exists, assign admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to admin@admin.com';
  ELSE
    RAISE NOTICE 'User admin@admin.com not found. Please sign up first with email: admin@admin.com and password: password';
  END IF;
END $$;