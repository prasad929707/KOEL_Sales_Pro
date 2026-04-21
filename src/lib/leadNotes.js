// ─────────────────────────────────────────────────────────────────────────────
// leadNotes.js  —  Supabase CRUD for lead_notes table
// Meeting log / activity timeline per lead
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

// Note type config
export const NOTE_TYPES = [
  { id: 'note',      label: 'Note',         icon: '📝', color: '#475569' },
  { id: 'meeting',   label: 'Meeting',      icon: '🤝', color: '#7c3aed' },
  { id: 'call',      label: 'Call',         icon: '📞', color: '#2563eb' },
  { id: 'whatsapp',  label: 'WhatsApp',     icon: '💬', color: '#16a34a' },
  { id: 'file',      label: 'File',         icon: '📎', color: '#d97706' },
]

export function noteTypeCfg(type) {
  return NOTE_TYPES.find(t => t.id === type) || NOTE_TYPES[0]
}

// ── Fetch all notes for a lead, newest first ──────────────────────────────────
export async function fetchNotes(leadId) {
  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  return { data: data ? data.map(dbToApp) : [], error }
}

// ── Add a note ────────────────────────────────────────────────────────────────
export async function addNote(leadId, { type = 'note', content, fileUrl, fileName, fileType }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({
      lead_id:    leadId,
      owner_id:   user?.id || null,
      owner_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'You',
      type,
      content:    content || '',
      file_url:   fileUrl  || null,
      file_name:  fileName || null,
      file_type:  fileType || null,
    })
    .select()
    .single()
  return { data: data ? dbToApp(data) : null, error }
}

// ── Delete a note ─────────────────────────────────────────────────────────────
export async function deleteNote(noteId) {
  const { error } = await supabase.from('lead_notes').delete().eq('id', noteId)
  return { error }
}

// ── Upload file to Supabase Storage → returns public URL ─────────────────────
export async function uploadFile(leadId, file) {
  const ext  = file.name.split('.').pop()
  const path = `${leadId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('lead-files')
    .upload(path, file, { upsert: false })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('lead-files').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ── Real-time subscription ────────────────────────────────────────────────────
export function subscribeNotes(leadId, onChange) {
  const channel = supabase
    .channel(`lead_notes_${leadId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'lead_notes', filter: `lead_id=eq.${leadId}` },
      async () => {
        const { data } = await fetchNotes(leadId)
        onChange(data)
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Field translation ─────────────────────────────────────────────────────────
function dbToApp(row) {
  return {
    id:        row.id,
    leadId:    row.lead_id,
    ownerId:   row.owner_id,
    ownerName: row.owner_name || 'Unknown',
    type:      row.type || 'note',
    content:   row.content || '',
    fileUrl:   row.file_url || null,
    fileName:  row.file_name || null,
    fileType:  row.file_type || null,
    createdAt: row.created_at,
  }
}
