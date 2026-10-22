-- =========================================================================
-- CHURCHFLOW & NCF UNN: 003 CONFIRM & SET ADMIN CREDENTIALS SCRIPT
-- Run this script in your Supabase Dashboard -> SQL Editor.
-- It immediately confirms the admin user, sets your password, and binds Super Admin rights.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_flagship_org_id UUID := '00000000-0000-0000-0000-000000000001';
  -- Default master password: Admin123! (You can change this string to whatever you prefer)
  v_default_password TEXT := 'Admin123!';
BEGIN
  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email IN ('admin@ncfunn.site', 'admin@ncfunn.org')
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists: Auto-confirm email, update password, and metadata
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        encrypted_password = crypt(v_default_password, gen_salt('bf')),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
        raw_user_meta_data = jsonb_build_object('full_name', 'NCF UNN Secretariat', 'role', 'Super Admin'),
        updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated existing auth user % with confirmed status and new password.', v_user_id;
  ELSE
    -- User does not exist: Create fresh confirmed user
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@ncfunn.site',
      crypt(v_default_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"NCF UNN Secretariat","role":"Super Admin"}'::jsonb,
      false,
      NOW(),
      NOW(),
      ''
    );

    RAISE NOTICE 'Created new confirmed auth user % (admin@ncfunn.site).', v_user_id;
  END IF;

  -- 2. Link in admin_profiles with Super Admin role and organisation_id
  INSERT INTO public.admin_profiles (id, email, full_name, role, status, organisation_id)
  VALUES (
    v_user_id,
    'admin@ncfunn.site',
    'NCF UNN Secretariat',
    'Super Admin',
    'Active',
    v_flagship_org_id
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'Super Admin',
      status = 'Active',
      organisation_id = v_flagship_org_id;

  -- 3. Link in organisation_members with Super Admin role
  INSERT INTO public.organisation_members (organisation_id, user_id, role)
  VALUES (
    v_flagship_org_id,
    v_user_id,
    'Super Admin'
  )
  ON CONFLICT (organisation_id, user_id) DO UPDATE
  SET role = 'Super Admin';

  RAISE NOTICE 'Admin profile and organisation membership successfully linked!';
END $$;
