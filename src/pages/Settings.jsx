import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KOEL_RANGES, getAllModels } from '../data/koel'
import { auth, pricing, tcoDefaults } from '../lib/storage'

const ALL_MODELS = getAllModels()

// ── Parse uploaded Excel ─────────────────────────────────────────────
function parseImportedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const priceMap = {}
        let count = 0
        for (let i = 1; i < rows.length; i++) {
          // Template columns: Range | Model Code | kVA | Ex-Works Price
          const row    = rows[i]
          const model  = String(row[1] || '').trim()
          const price  = Number(String(row[3] || '').replace(/[^\d.]/g, ''))
          if (model && !isNaN(price) && price > 0) {
            priceMap[model] = price
            count++
          }
        }
        resolve({ priceMap, count })
      } catch {
        reject(new Error('Could not parse the file. Make sure you used the official template.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsArrayBuffer(file)
  })
}

// ── TCO Defaults sub-section ─────────────────────────────────────────
function TcoSection() {
  const [vals,  setVals]  = useState(tcoDefaults.get())
  const [saved, setSaved] = useState(false)

  const save = () => {
    tcoDefaults.set(vals)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const NumField = ({ label, k, unit, min, max, step }) => (
    <div className="settings-field">
      <label>{label}</label>
      <div className="settings-field__input-row">
        <input
          type="number" min={min} max={max} step={step || 1}
          value={vals[k]}
          onChange={e => setVals(v => ({ ...v, [k]: Number(e.target.value) }))}
        />
        <span className="settings-field__unit">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <h3>TCO Calculator Defaults</h3>
        <p>These values pre-fill the TCO calculator on each product page. Reps can override per session; these are the starting defaults saved to this device.</p>
      </div>
      <div className="settings-fields-grid">
        <NumField label="Diesel Price"       k="dieselPricePerL" unit="Rs/L" min={60}  max={150} step={0.5} />
        <NumField label="Backup Hours/Day"   k="hoursPerDay"     unit="hrs"  min={1}   max={24}  step={1}   />
        <NumField label="Average Load"       k="loadPct"         unit="%"    min={50}  max={100} step={5}   />
        <NumField label="Lube Oil Price"     k="oilPricePerL"    unit="Rs/L" min={200} max={600} step={10}  />
        <NumField label="AdBlue / DEF Price" k="adbluePerL"      unit="Rs/L" min={30}  max={80}  step={1}   />
      </div>
      <button className="btn btn--primary btn--sm" style={{ marginTop: 'var(--s5)' }} onClick={save}>
        {saved ? 'Saved' : 'Save Defaults'}
      </button>
    </div>
  )
}

// ── Main Settings page ───────────────────────────────────────────────
export default function Settings() {
  const fileRef = useRef(null)

  // Load current prices from storage
  const [prices,     setPrices]     = useState(() => {
    const stored = pricing.getAll()
    const init = {}
    ALL_MODELS.forEach(m => { init[m.model] = stored[m.model]?.exWorks ?? '' })
    return init
  })
  const [priceSaved, setPriceSaved] = useState(false)
  const [importMsg,  setImportMsg]  = useState(null)
  const [importing,  setImporting]  = useState(false)

  const handlePriceChange = (modelId, val) => {
    setPrices(p => ({ ...p, [modelId]: val }))
  }

  const handleSaveAll = () => {
    const map = {}
    Object.entries(prices).forEach(([k, v]) => {
      const n = Number(String(v).replace(/[^\d.]/g, ''))
      if (!isNaN(n) && n > 0) map[k] = n
    })
    pricing.setBulk(map)
    setPriceSaved(true)
    setTimeout(() => setPriceSaved(false), 2500)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const { priceMap, count } = await parseImportedFile(file)
      pricing.setBulk(priceMap)
      const stored = pricing.getAll()
      const updated = {}
      ALL_MODELS.forEach(m => { updated[m.model] = stored[m.model]?.exWorks ?? '' })
      setPrices(updated)
      setImportMsg({ type: 'success', text: `Imported ${count} prices from "${file.name}" and saved to this device.` })
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="page-content">
      <div className="container">

        <div style={{ marginBottom: 'var(--s8)' }}>
          <div className="section-eyebrow">Configuration</div>
          <h2>Pricing &amp; Settings</h2>
          <p style={{ color: 'var(--gray)', marginTop: 'var(--s2)', fontSize: '0.9rem' }}>
            All logged-in users can edit pricing and settings. Changes are saved to your device only — each rep manages their own copy.
          </p>
        </div>

        {/* ── Excel Import ─────────────────────────────── */}
        <div className="settings-section settings-section--import">
          <div className="settings-section__header">
            <h3>Bulk Import from Excel</h3>
            <p>
              Sales Head fills the template and shares it with the team. Each rep downloads the file and imports it here once.
              Prices are saved permanently to this device — no need to re-import unless pricing changes.
            </p>
          </div>
          <div className="import-action-row">
            <a
              href="/KOEL_Pricing_Template.xlsx"
              download
              className="btn btn--outline btn--sm"
              style={{ textDecoration: 'none' }}
            >
              Download Template (.xlsx)
            </a>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import Excel File'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          {importMsg && (
            <div className={`import-msg import-msg--${importMsg.type}`}>
              {importMsg.text}
            </div>
          )}
          <div className="import-explainer">
            <strong>Persistence proof:</strong> Imported prices are written to your browser localStorage for this site.
            They survive tab close, browser restart, and laptop reboot — gone only if you manually clear browser data (Settings &gt; Clear browsing data).
            Import once per device. That is all.
          </div>
        </div>

        {/* ── KOEL Pricing table ────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--s4)' }}>
              <div>
                <h3>KOEL Model Pricing — Ex-Works</h3>
                <p>All 19 models. Edit any price below and save. Or use the Excel import above to fill all at once.</p>
              </div>
              <button className="btn btn--primary btn--sm" onClick={handleSaveAll}>
                {priceSaved ? 'Saved' : 'Save All Prices'}
              </button>
            </div>
          </div>

          {KOEL_RANGES.map(range => (
            <div key={range.id} className="pricing-range-block">
              <div className="pricing-range-label">{range.label}</div>
              <div className="pricing-model-grid">
                {range.models.map(m => (
                  <div key={m.model} className="pricing-model-row">
                    <div className="pricing-model-info">
                      <div className="pricing-model-name">{m.model}</div>
                      <div className="pricing-model-kva">{m.kva} kVA &middot; {m.kw} kW</div>
                    </div>
                    <div className="pricing-model-input-wrap">
                      <span className="pricing-rupee">Rs</span>
                      <input
                        type="number"
                        className="pricing-input"
                        placeholder="Ex-works price"
                        value={prices[m.model] ?? ''}
                        onChange={e => handlePriceChange(m.model, e.target.value)}
                        min={0}
                        step={1000}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="btn btn--primary" style={{ marginTop: 'var(--s6)' }} onClick={handleSaveAll}>
            {priceSaved ? 'All Prices Saved' : 'Save All Prices'}
          </button>
        </div>

        {/* ── TCO Defaults ─────────────────────────────── */}
        <TcoSection />

      </div>
    </div>
  )
}
