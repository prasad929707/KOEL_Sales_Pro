// ── Auth bypass — set to true to let anyone access without logging in ──
// Set back to false when you want login enforced again.
export const AUTH_BYPASS = false

// Local storage helpers — used until Supabase is wired up
// All keys prefixed with koel_ to avoid conflicts

const PREFIX = 'koel_'

export const storage = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage write failed:', e)
    }
  },
  remove: (key) => {
    localStorage.removeItem(PREFIX + key)
  },
}

// ── Auth (prototype — replace with Supabase auth in Phase 5) ──────────
// 5 pre-configured accounts. See CREDENTIALS.md for the full list.
const VALID_USERS = [
  { email: 'saleshead@kirloskar.com', password: 'KOELHead@24',  name: 'Sales Head',       role: 'admin'  },
  { email: 'manager@kirloskar.com',   password: 'KOELMgr@24',   name: 'Regional Manager', role: 'admin'  },
  { email: 'rep1@kirloskar.com',      password: 'KOELRep@24',   name: 'Sales Rep 1',      role: 'rep'    },
  { email: 'rep2@kirloskar.com',      password: 'KOELRep@24',   name: 'Sales Rep 2',      role: 'rep'    },
  { email: 'rep3@kirloskar.com',      password: 'KOELRep@24',   name: 'Sales Rep 3',      role: 'rep'    },
]

// Session duration: 30 days (tool used on dedicated sales laptop — don't force daily re-login)
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const auth = {
  login: (email, password) => {
    const user = VALID_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!user) return { error: 'Invalid email or password.' }
    const session = { email: user.email, name: user.name, role: user.role, loggedInAt: Date.now() }
    storage.set('session', session)
    return { user: session }
  },
  logout: () => {
    storage.remove('session')
  },
  getSession: () => {
    const session = storage.get('session')
    if (!session) return null
    if (Date.now() - session.loggedInAt > SESSION_DURATION_MS) {
      storage.remove('session')
      return null
    }
    return session
  },
  isAdmin: () => {
    const s = auth.getSession()
    return s?.role === 'admin'
  },
}

// ── Pricing ───────────────────────────────────────────────────────────
// Import via Excel sets prices here. Manual edits in Settings also write here.
// Last write wins — import overwrites manual edits if run after.
export const pricing = {
  get: (modelId) => {
    const all = storage.get('pricing', {})
    return all[modelId] ?? null
  },
  set: (modelId, price) => {
    const all = storage.get('pricing', {})
    all[modelId] = { exWorks: price, updatedAt: Date.now() }
    storage.set('pricing', all)
  },
  setBulk: (priceMap) => {
    // priceMap: { modelId: price (number), ... }
    const all = storage.get('pricing', {})
    const now = Date.now()
    Object.entries(priceMap).forEach(([modelId, price]) => {
      if (price != null && !isNaN(price)) {
        all[modelId] = { exWorks: Number(price), updatedAt: now }
      }
    })
    storage.set('pricing', all)
  },
  getAll: () => storage.get('pricing', {}),
  clear: () => storage.remove('pricing'),
}

// ── TCO Defaults (configurable by admin, read by TCO calculator) ──────
export const tcoDefaults = {
  get: () => storage.get('tco_defaults', {
    dieselPricePerL: 92,
    hoursPerDay: 8,
    loadPct: 75,
    oilPricePerL: 350,
    adbluePerL: 45,
  }),
  set: (values) => {
    storage.set('tco_defaults', { ...tcoDefaults.get(), ...values })
  },
}

// ── Rep Profile (name, designation, region — used in Pitch Builder) ──
// Separate from auth session so reps can fill this in without re-logging-in
export const repProfile = {
  get: () => storage.get('rep_profile', null),
  set: (data) => storage.set('rep_profile', { ...repProfile.get(), ...data }),
  // Merge with session so Pitch Builder always has up-to-date rep info
  getForPitch: () => {
    const session = storage.get('session')
    const profile = storage.get('rep_profile', {})
    return {
      repName:        profile.name        || session?.name        || '',
      repDesignation: profile.designation || '',
      repRegion:      profile.region      || '',
      repEmail:       session?.email      || '',
    }
  },
}

// ── Starred Comparisons ───────────────────────────────────────────────
export const starred = {
  getAll: () => storage.get('starred', []),
  add: (comparison) => {
    const all = starred.getAll()
    const entry = { ...comparison, id: Date.now(), savedAt: Date.now() }
    storage.set('starred', [entry, ...all])
    return entry
  },
  remove: (id) => {
    const all = starred.getAll().filter(s => s.id !== id)
    storage.set('starred', all)
  },
  isStarred: (koelModel, competitorBrand, competitorModel) => {
    return starred.getAll().some(
      s => s.koelModel === koelModel &&
           s.competitorBrand === competitorBrand &&
           s.competitorModel === competitorModel
    )
  },
}


// ── Track Record References ───────────────────────────────────────────
// Three tiers:
//   'verified' — publicly confirmed, seeded in trackRecord.js (read-only here)
//   'admin'    — added directly by admin role (pre-approved)
//   'user'     — submitted by rep, needs admin approval
//
// This layer is localStorage-only until Supabase is wired.
// The storage key is 'track_refs' and holds admin + user entries only.
// Verified seed data is merged in at read-time by the page component.

export const trackRefs = {
  // ── Read ─────────────────────────────────────────────────────────────
  getAll: () => storage.get('track_refs', []),

  getApproved: () =>
    trackRefs.getAll().filter(r => r.status === 'approved'),

  getPending: () =>
    trackRefs.getAll().filter(r => r.status === 'pending'),

  // ── User submit (rep — goes in as pending) ────────────────────────────
  submit: (refData) => {
    const session = storage.get('session')
    const all = trackRefs.getAll()
    const entry = {
      ...refData,
      id:          'usr_' + Date.now(),
      source:      'user',
      status:      'pending',
      submittedBy: session?.name  || 'Unknown Rep',
      submittedByEmail: session?.email || '',
      submittedAt: new Date().toISOString(),
      approvedBy:  null,
      approvedAt:  null,
    }
    storage.set('track_refs', [entry, ...all])
    return entry
  },

  // ── Admin add (direct — pre-approved) ────────────────────────────────
  adminAdd: (refData) => {
    const session = storage.get('session')
    const all = trackRefs.getAll()
    const entry = {
      ...refData,
      id:          'adm_' + Date.now(),
      source:      'admin',
      status:      'approved',
      submittedBy: session?.name || 'Admin',
      submittedByEmail: session?.email || '',
      submittedAt: new Date().toISOString(),
      approvedBy:  session?.name || 'Admin',
      approvedAt:  new Date().toISOString(),
    }
    storage.set('track_refs', [entry, ...all])
    return entry
  },

  // ── Admin approve / reject ────────────────────────────────────────────
  approve: (id) => {
    const session = storage.get('session')
    const all = trackRefs.getAll().map(r =>
      r.id === id
        ? { ...r, status: 'approved', approvedBy: session?.name || 'Admin', approvedAt: new Date().toISOString() }
        : r
    )
    storage.set('track_refs', all)
  },

  reject: (id) => {
    const all = trackRefs.getAll().map(r =>
      r.id === id ? { ...r, status: 'rejected' } : r
    )
    storage.set('track_refs', all)
  },

  // ── Admin remove ──────────────────────────────────────────────────────
  remove: (id) => {
    storage.set('track_refs', trackRefs.getAll().filter(r => r.id !== id))
  },
}

// ── Brief History (Leads) ─────────────────────────────────────────────
// Auto-populated every time a Sales Brief is generated (PitchOutput mount).
// Shown in Profile under "Brief History".
export const leads = {
  getAll: () => storage.get('leads', []),
  add: (brief) => {
    const all = leads.getAll()
    // Store the full brief so "Edit Brief" / history click can reconstruct the form.
    // Display fields are hoisted to the top level for Profile list rendering.
    const entry = {
      // ── display metadata (used in Profile list) ──
      id:           Date.now(),
      customerName: brief.customerName || 'Unknown',
      segment:      brief.segment      || '',
      segmentId:    brief.segmentId    || '',
      city:         brief.city         || '',
      kva:          brief.kva          || '',
      meetingDate:  brief.meetingDate  || new Date().toISOString().slice(0, 10),
      gensetCount:  brief.gensets?.length || 1,
      generatedAt:  Date.now(),
      // ── full brief payload (used when re-opening the form) ──
      _brief:       brief,
    }
    // Update existing if same customer + date, otherwise prepend
    const idx = all.findIndex(l => l.customerName === entry.customerName && l.meetingDate === entry.meetingDate)
    if (idx >= 0) { all[idx] = entry } else { all.unshift(entry) }
    storage.set('leads', all.slice(0, 100))
    return entry
  },
  remove: (id) => storage.set('leads', leads.getAll().filter(l => l.id !== id)),
  clear:  ()   => storage.remove('leads'),
}
