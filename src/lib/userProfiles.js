// ─────────────────────────────────────────────────────────────────────────────
// userProfiles.js  —  CRUD + helpers for the `profiles` table in Supabase.
//
// Profile shape (app-side, camelCase):
// {
//   id:                 uuid   — matches auth.users.id
//   name:               string
//   email:              string
//   role:               'super_admin' | 'admin' | 'user'
//   assignedSegments:   string[]   — which segments this user works on
//   designation:        string
//   phone:              string
//   createdAt:          string (ISO)
//   updatedAt:          string (ISO)
// }
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

// All 8 BD segments — single source of truth referenced across the app
export const ALL_SEGMENTS = [
  'Data Centers',
  'Real Estate',
  'Healthcare',
  'Hospitality',
  'Telecom',
  'Infrastructure',
  'Industrial',
  'Other',
]

export const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
  { value: 'admin',       label: 'Admin',       color: '#2563eb', bg: 'rgba(37,99,235,0.10)'  },
  { value: 'user',        label: 'Member',      color: '#475569', bg: 'rgba(71,85,105,0.10)'  },
]

export function roleCfg(role) {
  return ROLES.find(r => r.value === role) || ROLES[2]
}

export function isAdminRole(role) {
  return role === 'super_admin' || role === 'admin'
}


// ── Fetch current user's profile ─────────────────────────────────────────────
export async function fetchMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Row doesn't exist yet — create it on the fly
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: user.id, name: user.user_metadata?.name || user.email?.split('@')[0] || '', email: user.email || '' })
      .select()
      .single()
    return { data: inserted ? dbToApp(inserted) : null, error: insertErr }
  }

  return { data: data ? dbToApp(data) : null, error }
}


// ── Fetch all profiles (admin only, RLS enforced) ─────────────────────────────
export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  return { data: data ? data.map(dbToApp) : [], error }
}


// ── Update any profile (admin updates others, user updates own non-role fields)
export async function updateProfile(id, patch) {
  const dbPatch = {}
  if (patch.name               !== undefined) dbPatch.name                = patch.name
  if (patch.designation        !== undefined) dbPatch.designation         = patch.designation
  if (patch.phone              !== undefined) dbPatch.phone               = patch.phone
  if (patch.role               !== undefined) dbPatch.role                = patch.role
  if (patch.assignedSegments   !== undefined) dbPatch.assigned_segments   = patch.assignedSegments
  dbPatch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()

  return { data: data ? dbToApp(data) : null, error }
}


// ── Invite a new user by email (Supabase sends the email) ─────────────────────
export async function inviteUser(email, name = '') {
  // supabase.auth.admin requires service role — this won't work client-side.
  // Instead we use the user-facing signUp with a random temp password.
  // The user gets a confirmation email and sets their own password.
  const tempPassword = Math.random().toString(36).slice(2) + 'Aa1!'
  const { data, error } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: { name: name || email.split('@')[0] },
      // emailRedirectTo is set in Supabase dashboard
    },
  })
  return { data, error }
}


// ── Field translation ─────────────────────────────────────────────────────────
function dbToApp(row) {
  return {
    id:               row.id,
    name:             row.name             || '',
    email:            row.email            || '',
    role:             row.role             || 'user',
    assignedSegments: row.assigned_segments || [],
    designation:      row.designation      || '',
    phone:            row.phone            || '',
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}
