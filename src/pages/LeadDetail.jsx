// ─────────────────────────────────────────────────────────────────────────────
// LeadDetail — full lead profile at /bd-center/lead/:id
//
// Sections:
//   • Hero header — company, stage selector, kVA
//   • Contact + Location cards
//   • Meeting log — timestamped timeline (note / meeting / call / WhatsApp / file)
//     ↳ Add note with type selector
//     ↳ Upload file / visiting card photo
//     ↳ AI extract from photo (Groq vision → pastes into note box)
//   • Next step + due date
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}
import { useParams, useNavigate } from 'react-router-dom'
import { fetchLeadById, updateLead, deleteLead } from '../lib/bdLeads'
import { fetchNotes, addNote, deleteNote, uploadFile, subscribeNotes, NOTE_TYPES, noteTypeCfg } from '../lib/leadNotes'
import { extractNotesFromPhoto, fileToBase64 } from '../lib/groqVision'
import { GOEM_DATA } from '../data/marksightData'

const STAGES = [
  { id: 'new',         label: 'New',         color: '#64748b' },
  { id: 'qualified',   label: 'Qualified',   color: '#2563eb' },
  { id: 'proposal',    label: 'Proposal',    color: '#7c3aed' },
  { id: 'negotiation', label: 'Negotiation', color: '#d97706' },
  { id: 'won',         label: 'Won',         color: '#16a34a' },
  { id: 'lost',        label: 'Lost',        color: '#dc2626' },
  { id: 'stalled',     label: 'Stalled',     color: '#94a3b8' },
]

function stageFor(id) { return STAGES.find(s => s.id === id) || STAGES[0] }

function goemForState(state) {
  for (const [id, g] of Object.entries(GOEM_DATA)) {
    if (g.states?.includes(state)) return { id, name: g.name, color: g.color, hq: g.hq }
  }
  return null
}

function fmtKva(kva) {
  if (!kva) return '—'
  return kva >= 1000 ? `${(kva / 1000).toFixed(0)}k kVA` : `${kva} kVA`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function Label({ children }) {
  return (
    <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{children || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
    </div>
  )
}

// ── Meeting log note entry ────────────────────────────────────────────────────
function NoteEntry({ note, onDelete, myId }) {
  const [confirm, setConfirm] = useState(false)
  const cfg = noteTypeCfg(note.type)
  const isFile = note.type === 'file'
  const isImage = note.fileType?.startsWith('image/')

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Type icon bubble */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: cfg.color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.95rem', marginTop: 2,
      }}>
        {cfg.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
            color: cfg.color, background: cfg.color + '15', padding: '2px 7px', borderRadius: 99,
          }}>{cfg.label}</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{note.ownerName}</span>
          <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>·</span>
          <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtDateTime(note.createdAt)}</span>
          {(note.ownerId === myId || !note.ownerId) && (
            <button
              onClick={() => confirm ? onDelete(note.id) : setConfirm(true)}
              onBlur={() => setTimeout(() => setConfirm(false), 200)}
              style={{
                marginLeft: 'auto', fontSize: '0.6rem', fontWeight: confirm ? 700 : 400,
                color: confirm ? '#dc2626' : '#94a3b8',
                background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: '1px 4px',
              }}
            >
              {confirm ? 'Confirm delete' : '×'}
            </button>
          )}
        </div>

        {/* Content */}
        {isFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isImage && note.fileUrl && (
              <a href={note.fileUrl} target="_blank" rel="noreferrer">
                <img
                  src={note.fileUrl} alt={note.fileName}
                  style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }}
                />
              </a>
            )}
            {!isImage && note.fileUrl && (
              <a href={note.fileUrl} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none',
                padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(37,99,235,0.2)',
                background: 'rgba(37,99,235,0.05)',
              }}>
                📎 {note.fileName || 'Download file'} ↗
              </a>
            )}
            {note.content && (
              <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{note.content}</div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {note.content}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add note form ─────────────────────────────────────────────────────────────
function AddNoteForm({ leadId, onAdded }) {
  const isMobile = useIsMobile()
  const [type,        setType]        = useState('note')
  const [content,     setContent]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiError,     setAiError]     = useState(null)
  const [filePreview, setFilePreview] = useState(null) // { url, name, type, file }
  const fileRef = useRef(null)
  const photoRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() && !filePreview) return
    setSaving(true)

    let fileUrl = null, fileName = null, fileType = null

    if (filePreview) {
      const { url, error } = await uploadFile(leadId, filePreview.file)
      if (error) { alert('File upload failed: ' + error.message); setSaving(false); return }
      fileUrl = url; fileName = filePreview.name; fileType = filePreview.type
    }

    const { error } = await addNote(leadId, {
      type,
      content: content.trim(),
      fileUrl, fileName, fileType,
    })

    if (error) { alert('Failed to save: ' + error.message) }
    else {
      setContent(''); setFilePreview(null); setType('note'); onAdded()
    }
    setSaving(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFilePreview({ url, name: file.name, type: file.type, file })
    setType('file')
    e.target.value = ''
  }

  async function handlePhotoToNote(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAiLoading(true); setAiError(null)
    try {
      const extracted = await extractNotesFromPhoto(file)
      setContent(prev => prev ? prev + '\n\n' + extracted : extracted)
      setType('note')
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
      e.target.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Type selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {NOTE_TYPES.filter(t => t.id !== 'file').map(t => (
          <button
            key={t.id} type="button"
            onClick={() => setType(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
              border: `1px solid ${type === t.id ? t.color : 'var(--border)'}`,
              background: type === t.id ? t.color + '15' : 'transparent',
              color: type === t.id ? t.color : '#64748b',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={
          type === 'meeting' ? 'What was discussed? Key decisions, concerns, next steps…' :
          type === 'call'    ? 'Call summary — who called, what was said…' :
          type === 'whatsapp'? 'Paste or summarise the WhatsApp conversation…' :
                               'Add a note about this lead…'
        }
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid var(--border)', fontSize: '0.82rem',
          fontFamily: 'inherit', outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', color: 'var(--slate)',
          lineHeight: 1.6,
        }}
        onFocus={e => e.target.style.borderColor = '#7c3aed'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {/* File preview */}
      {filePreview && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
          padding: '8px 12px', background: 'rgba(217,119,6,0.06)',
          border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8,
        }}>
          {filePreview.type.startsWith('image/') && (
            <img src={filePreview.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 5 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePreview.name}</div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{filePreview.type}</div>
          </div>
          <button type="button" onClick={() => setFilePreview(null)}
            style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* AI error */}
      {aiError && (
        <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#dc2626' }}>
          AI error: {aiError}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {/* Top row: attach + AI buttons */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Attach file */}
          <input ref={fileRef} type="file" accept="*/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: isMobile ? '9px 14px' : '6px 12px',
            borderRadius: 7, border: '1px solid var(--border)',
            background: 'transparent', fontSize: isMobile ? '0.75rem' : '0.65rem', fontWeight: 600,
            color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
            flex: isMobile ? '1' : 'none',
            justifyContent: isMobile ? 'center' : 'flex-start',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#d97706'; e.currentTarget.style.borderColor = 'rgba(217,119,6,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            📎 Attach file
          </button>

          {/* AI extract from photo */}
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoToNote} style={{ display: 'none' }} />
          <button type="button" onClick={() => photoRef.current?.click()} disabled={aiLoading} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: isMobile ? '9px 14px' : '6px 12px',
            borderRadius: 7,
            border: `1px solid ${aiLoading ? 'var(--border)' : 'rgba(124,58,237,0.3)'}`,
            background: aiLoading ? 'var(--off-white)' : 'rgba(124,58,237,0.05)',
            fontSize: isMobile ? '0.75rem' : '0.65rem', fontWeight: 600,
            color: aiLoading ? '#94a3b8' : '#7c3aed',
            cursor: aiLoading ? 'default' : 'pointer', fontFamily: 'inherit',
            flex: isMobile ? '1' : 'none',
            justifyContent: isMobile ? 'center' : 'flex-start',
          }}>
            {aiLoading
              ? <><span style={{ animation: 'koel-spin 1s linear infinite', display: 'inline-block' }}>↻</span> Extracting…</>
              : <>✨ Photo → Note</>
            }
          </button>

          {/* Submit — inline on desktop */}
          {!isMobile && (
            <button type="submit" disabled={saving || (!content.trim() && !filePreview)} style={{
              marginLeft: 'auto', padding: '7px 20px', borderRadius: 8,
              background: (saving || (!content.trim() && !filePreview)) ? '#e2e8f0' : '#7c3aed',
              color: (saving || (!content.trim() && !filePreview)) ? '#94a3b8' : 'white',
              border: 'none', fontSize: '0.75rem', fontWeight: 700,
              cursor: (saving || (!content.trim() && !filePreview)) ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}>
              {saving ? 'Saving…' : 'Add to log'}
            </button>
          )}
        </div>

        {/* Submit — full width on mobile */}
        {isMobile && (
          <button type="submit" disabled={saving || (!content.trim() && !filePreview)} style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: (saving || (!content.trim() && !filePreview)) ? '#e2e8f0' : '#7c3aed',
            color: (saving || (!content.trim() && !filePreview)) ? '#94a3b8' : 'white',
            border: 'none', fontSize: '0.85rem', fontWeight: 700,
            cursor: (saving || (!content.trim() && !filePreview)) ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}>
            {saving ? 'Saving…' : 'Add to log'}
          </button>
        )}
      </div>
    </form>
  )
}

// ── Main LeadDetail component ─────────────────────────────────────────────────
export default function LeadDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [user,         setUser]        = useState(null)
  const [lead,         setLead]        = useState(null)
  const [notes,        setNotes]       = useState([])
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState(null)
  const [stageSaving,  setStageSaving] = useState(false)
  const [editNextStep, setEditNextStep]= useState(false)
  const [nextStepVal,  setNextStepVal] = useState('')
  const [nextDateVal,  setNextDateVal] = useState('')
  const [stepSaving,   setStepSaving]  = useState(false)
  const [editContact,  setEditContact] = useState(false)
  const [contactDraft, setContactDraft]= useState({})
  const [contactSaving,setContactSaving]=useState(false)
  const [myProfile,    setMyProfile]   = useState(null)
  const [deleteConfirm,setDeleteConfirm]=useState(false)
  const [deleting,     setDeleting]    = useState(false)

  async function handleLogout() {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Load user + profile
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    })
    import('../lib/userProfiles').then(({ fetchMyProfile }) => {
      fetchMyProfile().then(({ data }) => { if (data) setMyProfile(data) })
    })
  }, [])

  // Load lead + notes
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchLeadById(id), fetchNotes(id)]).then(([leadRes, notesRes]) => {
      if (leadRes.error || !leadRes.data) {
        setError(leadRes.error?.message || 'Lead not found')
      } else {
        setLead(leadRes.data)
        setNextStepVal(leadRes.data.nextStep || '')
        setNextDateVal(leadRes.data.nextStepDate || '')
      }
      setNotes(notesRes.data || [])
    }).finally(() => setLoading(false))

    // Real-time notes
    const unsub = subscribeNotes(id, setNotes)
    return unsub
  }, [id])

  async function changeStage(stageId) {
    if (!lead || stageSaving) return
    setStageSaving(true)
    const { error } = await updateLead(lead.id, { stage: stageId })
    if (!error) setLead(l => ({ ...l, stage: stageId }))
    setStageSaving(false)
  }

  async function saveNextStep() {
    if (!lead) return
    setStepSaving(true)
    await updateLead(lead.id, { nextStep: nextStepVal, nextStepDate: nextDateVal })
    setLead(l => ({ ...l, nextStep: nextStepVal, nextStepDate: nextDateVal }))
    setEditNextStep(false)
    setStepSaving(false)
  }

  function openContactEdit() {
    setContactDraft({
      company:     lead.company     || '',
      contact:     lead.contact     || '',
      designation: lead.designation || '',
      phone:       lead.phone       || '',
      email:       lead.email       || '',
      kvaEstimate: lead.kvaEstimate != null ? String(lead.kvaEstimate) : '',
    })
    setEditContact(true)
  }

  async function saveContact() {
    setContactSaving(true)
    const patch = {
      company:     contactDraft.company,
      contact:     contactDraft.contact,
      designation: contactDraft.designation,
      phone:       contactDraft.phone,
      email:       contactDraft.email,
      kvaEstimate: contactDraft.kvaEstimate,
    }
    const { error } = await updateLead(lead.id, patch)
    if (!error) {
      setLead(l => ({
        ...l,
        ...patch,
        kvaEstimate: patch.kvaEstimate ? Number(patch.kvaEstimate) : null,
      }))
      setEditContact(false)
    } else {
      alert('Save failed: ' + error.message)
    }
    setContactSaving(false)
  }

  const canDeleteLead = lead && (
    lead.ownerId === user?.id ||
    myProfile?.role === 'super_admin' ||
    myProfile?.role === 'admin'
  )

  async function handleDeleteLead() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeleting(true)
    const { error } = await deleteLead(lead.id)
    if (error) { alert('Delete failed: ' + error.message); setDeleting(false); return }
    navigate('/bd-center')
  }

  async function handleDeleteNote(noteId) {
    await deleteNote(noteId)
    setNotes(ns => ns.filter(n => n.id !== noteId))
  }

  const goem  = lead ? goemForState(lead.state) : null
  const stage = lead ? stageFor(lead.stage) : null

  // Upcoming next step warning
  const nextStepOverdue = lead?.nextStepDate && new Date(lead.nextStepDate) < new Date()
  const nextStepSoon    = lead?.nextStepDate && !nextStepOverdue &&
    (new Date(lead.nextStepDate) - new Date()) < 3 * 24 * 60 * 60 * 1000

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', paddingBottom: 60 }}>
      <style>{`@keyframes koel-spin { to { transform: rotate(360deg) } }`}</style>

      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--white)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : '0 28px', height: isMobile ? 52 : 48, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/bd-center')}
            style={{ fontSize: '0.68rem', color: '#475569', background: 'transparent', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            ← BD Center
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed' }}>
            {lead?.company || 'Lead Detail'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>
                {(user.user_metadata?.name || user.email || 'U').slice(0,1).toUpperCase()}
              </div>
              {!isMobile && (
                <span style={{ fontSize: '0.72rem', color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.name || user.email}
                </span>
              )}
            </div>
          )}
          <button onClick={handleLogout}
            style={{ fontSize: '0.68rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: isMobile ? '5px 10px' : '4px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '14px 12px 0' : '28px 24px 0' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '0.82rem', color: '#94a3b8' }}>Loading…</div>
        )}
        {error && (
          <div style={{ padding: '20px 24px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem' }}>{error}</div>
        )}

        {lead && (
          <>
            {/* ── Hero ───────────────────────────────────────────────────── */}
            <div style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderLeft: `4px solid ${stage.color}`, borderRadius: 12,
              padding: isMobile ? '16px 16px' : '24px 28px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.02em' }}>
                    {lead.company}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: stage.color + '18', color: stage.color, border: `1px solid ${stage.color}30` }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{lead.segment}</span>
                    {lead.source && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>via {lead.source}</span>}
                    {lead.city && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>📍 {lead.city}, {lead.state}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{fmtKva(lead.kvaEstimate)}</div>
                  <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>kVA Estimate</div>
                </div>
              </div>

              {/* Stage selector + delete */}
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <Label>Move to stage</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {STAGES.map(s => (
                      <button key={s.id} onClick={() => changeStage(s.id)} disabled={stageSaving} style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
                        cursor: stageSaving ? 'default' : 'pointer', fontFamily: 'inherit',
                        background: lead.stage === s.id ? s.color : 'transparent',
                        color: lead.stage === s.id ? 'white' : s.color,
                        border: `1px solid ${s.color}`,
                        opacity: stageSaving ? 0.6 : 1, transition: 'all 150ms',
                      }}>{s.label}</button>
                    ))}
                  </div>
                </div>
                {canDeleteLead && (
                  <button
                    onClick={handleDeleteLead}
                    disabled={deleting}
                    style={{
                      padding: '5px 14px', borderRadius: 7, fontSize: '0.65rem', fontWeight: 700,
                      cursor: deleting ? 'default' : 'pointer', fontFamily: 'inherit',
                      background: deleteConfirm ? '#fef2f2' : 'transparent',
                      color: deleteConfirm ? '#dc2626' : '#94a3b8',
                      border: `1px solid ${deleteConfirm ? '#fecaca' : 'var(--border)'}`,
                      transition: 'all 150ms', whiteSpace: 'nowrap',
                    }}
                    onBlur={() => setTimeout(() => setDeleteConfirm(false), 200)}
                  >
                    {deleting ? 'Deleting…' : deleteConfirm ? '⚠ Confirm delete' : '🗑 Delete lead'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Contact + Location ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)' }}>Contact</div>
                  <button
                    onClick={editContact ? () => setEditContact(false) : openContactEdit}
                    style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {editContact ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editContact ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Company',     key: 'company',     type: 'text',   ph: '' },
                      { label: 'Contact Name',key: 'contact',     type: 'text',   ph: 'Person name' },
                      { label: 'Designation', key: 'designation', type: 'text',   ph: 'e.g. GM Projects' },
                      { label: 'Phone',       key: 'phone',       type: 'tel',    ph: '+91 98765 43210' },
                      { label: 'Email',       key: 'email',       type: 'email',  ph: 'name@company.com' },
                      { label: 'kVA Estimate',key: 'kvaEstimate', type: 'number', ph: '2500' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 3 }}>{f.label}</label>
                        <input
                          type={f.type}
                          value={contactDraft[f.key] || ''}
                          placeholder={f.ph}
                          onChange={e => setContactDraft(d => ({ ...d, [f.key]: e.target.value }))}
                          style={{ width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: 'var(--slate)' }}
                          onFocus={e => e.target.style.borderColor = '#7c3aed'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    ))}
                    <button
                      onClick={saveContact} disabled={contactSaving}
                      style={{ alignSelf: 'flex-end', padding: '6px 20px', borderRadius: 7, background: '#7c3aed', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: contactSaving ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}
                    >
                      {contactSaving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Field label="Name">{lead.contact}</Field>
                    {lead.designation && <Field label="Designation">{lead.designation}</Field>}
                    <Field label="Phone">
                      {lead.phone
                        ? <a href={`tel:${lead.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{lead.phone}</a>
                        : null}
                    </Field>
                    <Field label="Email">
                      {lead.email
                        ? <a href={`mailto:${lead.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{lead.email}</a>
                        : null}
                    </Field>
                    <Field label="Owner">{lead.owner}</Field>
                    <Field label="Added">{fmtDate(lead.createdAt)}</Field>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 16 }}>Location</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="City">{lead.city}{lead.district ? `, ${lead.district}` : ''}</Field>
                  <Field label="State">{lead.state}</Field>
                  {goem && (
                    <div>
                      <Label>GOEM Territory</Label>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: goem.color }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: goem.color, marginRight: 6, verticalAlign: 'middle' }} />
                        {goem.name}
                      </span>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2 }}>HQ: {goem.hq}</div>
                    </div>
                  )}
                  {lead.mapsUrl && (
                    <a href={lead.mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Open in Maps ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── Next Step ──────────────────────────────────────────────── */}
            <div style={{
              background: 'var(--white)', border: `1px solid ${nextStepOverdue ? '#fecaca' : nextStepSoon ? 'rgba(217,119,6,0.3)' : 'var(--border)'}`,
              borderLeft: `4px solid ${nextStepOverdue ? '#dc2626' : nextStepSoon ? '#d97706' : '#7c3aed'}`,
              borderRadius: 12, padding: '18px 22px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editNextStep ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)' }}>Next Step</div>
                  {lead.nextStepDate && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: nextStepOverdue ? '#fef2f2' : nextStepSoon ? 'rgba(217,119,6,0.08)' : 'rgba(124,58,237,0.08)',
                      color: nextStepOverdue ? '#dc2626' : nextStepSoon ? '#d97706' : '#7c3aed',
                    }}>
                      {nextStepOverdue ? '⚠ Overdue · ' : nextStepSoon ? '⏰ Soon · ' : '📅 '}{fmtDate(lead.nextStepDate)}
                    </span>
                  )}
                </div>
                <button onClick={() => { setEditNextStep(e => !e); setNextStepVal(lead.nextStep||''); setNextDateVal(lead.nextStepDate||'') }}
                  style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', background: 'transparent', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {editNextStep ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editNextStep ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea value={nextStepVal} onChange={e => setNextStepVal(e.target.value)} rows={2}
                    placeholder="What's the next action? e.g. Send proposal by Friday"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: 'var(--slate)' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>Due date</label>
                    <input type="date" value={nextDateVal} onChange={e => setNextDateVal(e.target.value)}
                      style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none', color: 'var(--slate)' }} />
                    <button onClick={saveNextStep} disabled={stepSaving}
                      style={{ marginLeft: 'auto', padding: '6px 18px', borderRadius: 7, background: '#7c3aed', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {stepSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: lead.nextStep ? '#334155' : '#cbd5e1', lineHeight: 1.6, marginTop: 4 }}>
                  {lead.nextStep || 'Not defined yet — click Edit to add.'}
                </div>
              )}
            </div>

            {/* ── Meeting Log ────────────────────────────────────────────── */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)' }}>Meeting Log</div>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', background: 'var(--off-white)', padding: '2px 8px', borderRadius: 99 }}>
                  {notes.length} {notes.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Add note form */}
              <div style={{ padding: '16px', background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 10, marginBottom: 18 }}>
                <AddNoteForm leadId={lead.id} onAdded={() => fetchNotes(lead.id).then(r => setNotes(r.data || []))} />
              </div>

              {/* Notes timeline */}
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                  No log entries yet. Add your first note, meeting summary, or file above.
                </div>
              ) : (
                <div>
                  {notes.map(note => (
                    <NoteEntry
                      key={note.id}
                      note={note}
                      myId={user?.id}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
