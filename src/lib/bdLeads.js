// ─────────────────────────────────────────────────────────────────────────────
// bdLeads.js  —  Supabase CRUD layer for BD Center leads
// All functions return { data, error } matching Supabase conventions.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

// ── Fetch all leads the current user can see (RLS handles scoping) ────────────
export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })
  return { data: data ? data.map(dbToApp) : [], error }
}

// ── Fetch a single lead by ID ─────────────────────────────────────────────────
export async function fetchLeadById(id) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data ? dbToApp(data) : null, error }
}

// ── Real-time subscription — calls onChange(leads[]) whenever DB changes ──────
export function subscribeLeads(onChange) {
  const channel = supabase
    .channel('leads_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async () => {
      // Re-fetch on any change so we always have the full sorted list
      const { data } = await fetchLeads()
      onChange(data)
    })
    .subscribe()
  // Return unsubscribe function
  return () => supabase.removeChannel(channel)
}

// ── Insert a new lead ─────────────────────────────────────────────────────────
export async function insertLead(lead) {
  const { data: { user } } = await supabase.auth.getUser()
  const row = appToDb(lead, user?.id, user?.user_metadata?.name || user?.email)
  const { data, error } = await supabase
    .from('leads')
    .insert(row)
    .select()
    .single()
  return { data: data ? dbToApp(data) : null, error }
}

// ── Update stage (or any field) ───────────────────────────────────────────────
export async function updateLead(id, patch) {
  const dbPatch = {}
  if (patch.stage        !== undefined) dbPatch.stage         = patch.stage
  if (patch.notes        !== undefined) dbPatch.notes         = patch.notes
  if (patch.nextStep     !== undefined) dbPatch.next_step      = patch.nextStep
  if (patch.nextStepDate !== undefined) dbPatch.next_step_date = patch.nextStepDate
  if (patch.company      !== undefined) dbPatch.company        = patch.company
  if (patch.contact      !== undefined) dbPatch.contact        = patch.contact
  if (patch.phone        !== undefined) dbPatch.phone          = patch.phone
  if (patch.email        !== undefined) dbPatch.email          = patch.email
  if (patch.designation  !== undefined) dbPatch.designation    = patch.designation
  if (patch.kvaEstimate  !== undefined) dbPatch.kva_estimate   = patch.kvaEstimate ? Number(patch.kvaEstimate) : null

  const { data, error } = await supabase
    .from('leads')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()
  return { data: data ? dbToApp(data) : null, error }
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  return { error }
}

// ── Field name translation: app (camelCase) ↔ DB (snake_case) ─────────────────
function appToDb(lead, ownerId, ownerName) {
  return {
    company:        lead.company,
    contact:        lead.contact        || null,
    phone:          lead.phone          || null,
    city:           lead.city           || null,
    district:       lead.district       || null,
    state:          lead.state          || null,
    lat:            lead.lat            || null,
    lon:            lead.lon            || null,
    maps_url:       lead.mapsUrl        || null,
    segment:        lead.segment        || 'Other',
    kva_estimate:   lead.kvaEstimate    ? Number(lead.kvaEstimate) : null,
    stage:          lead.stage          || 'new',
    owner_id:       ownerId             || null,
    owner_name:     ownerName           || lead.owner || null,
    goem_id:        lead.goemId         || null,
    goem_name:      lead.goemName       || null,
    source:         lead.source         || null,
    notes:          lead.notes          || null,
    next_step:      lead.nextStep       || null,
    next_step_date: lead.nextStepDate   || null,
    email:          lead.email          || null,
    designation:    lead.designation    || null,
  }
}

function dbToApp(row) {
  return {
    id:           row.id,
    company:      row.company,
    contact:      row.contact      || '',
    phone:        row.phone        || '',
    city:         row.city         || '',
    district:     row.district     || '',
    state:        row.state        || '',
    lat:          row.lat,
    lon:          row.lon,
    mapsUrl:      row.maps_url     || '',
    segment:      row.segment      || 'Other',
    kvaEstimate:  row.kva_estimate,
    stage:        row.stage        || 'new',
    owner:        row.owner_name   || '',
    ownerId:      row.owner_id,
    goemId:       row.goem_id      || null,
    goemName:     row.goem_name    || null,
    source:       row.source       || '',
    notes:        row.notes        || '',
    nextStep:     row.next_step    || '',
    nextStepDate: row.next_step_date || '',
    email:        row.email        || '',
    designation:  row.designation  || '',
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  }
}
