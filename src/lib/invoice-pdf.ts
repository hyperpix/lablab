import jsPDF from 'jspdf'
import { Invoice, Patient, Appointment, Prescription, Treatment } from '@/db/index'

export function fmtDate(epoch: number) {
  if (!epoch) return '—'
  return new Date(epoch).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function buildInvoicePDF(
  invoice: Invoice,
  patient: Patient,
  appointment?: Appointment,
  clinicName = 'Your Dental Clinic',
  clinicAddress = '',
  clinicLogo = '',
  prescriptions: Prescription[] = [],
  treatments: Treatment[] = [],
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W   = 210
  const H   = 297
  const ML  = 20
  const MR  = 20
  const CW  = W - ML - MR
  const RX  = W - MR
  const MID = ML + CW / 2

  const setFill   = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
  const setStroke = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
  const setTxt    = (r: number, g: number, b: number) => doc.setTextColor(r, g, b)

  const invoiceNum   = `INV-${invoice.id.slice(0, 8).toUpperCase()}`
  const issueDate    = fmtDate(invoice.issued_date || Date.now())
  const dueDateEpoch = (invoice.issued_date || Date.now()) + 30 * 24 * 60 * 60 * 1000
  const dueDate      = fmtDate(dueDateEpoch)
  const subtotal     = invoice.amount
  const total        = subtotal
  const LINE_H       = 6

  let y = 20

  // ── Section 1 — top: logo/name left | invoice meta right ────────────────────
  const logoSize = 24
  let topLeftY = y

  if (clinicLogo) {
    try {
      const ext = clinicLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(clinicLogo, ext, ML, topLeftY, logoSize, logoSize)
    } catch (_) { /* skip bad logo */ }
    topLeftY += logoSize + 3
  }

  setTxt(30, 30, 30)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(clinicName, ML, topLeftY + 6)
  topLeftY += 9

  let metaY = y + 6
  setTxt(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoiceNum}`, RX, metaY, { align: 'right' })
  metaY += LINE_H
  doc.text(`Created: ${issueDate}`, RX, metaY, { align: 'right' })
  metaY += LINE_H
  doc.text(`Due: ${dueDate}`, RX, metaY, { align: 'right' })

  y = Math.max(topLeftY, metaY) + 8

  // ── Section 2 — bill from (left) | bill to (right) ──────────────────────────
  const infoY    = y
  const infoColW = CW / 2 - 5

  setTxt(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(clinicName, ML, y)
  y += LINE_H
  doc.setFont('helvetica', 'normal')
  setTxt(100, 100, 100)
  if (clinicAddress) {
    const addrLines2 = doc.splitTextToSize(clinicAddress, infoColW)
    addrLines2.slice(0, 3).forEach((line: string) => { doc.text(line, ML, y); y += LINE_H })
  }
  const leftEndY = y

  let rightY = infoY
  setTxt(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(patient.name, MID, rightY)
  rightY += LINE_H
  doc.setFont('helvetica', 'normal')
  setTxt(100, 100, 100)
  if (patient.email) { doc.text(patient.email, MID, rightY); rightY += LINE_H }
  if (patient.phone) { doc.text(patient.phone, MID, rightY); rightY += LINE_H }

  y = Math.max(leftEndY, rightY) + 12

  // ── Section 3 — items table ─────────────────────────────────────────────────
  const C = {
    item:   { x: ML,             w: CW * 0.50 },
    qty:    { x: ML + CW * 0.50, w: CW * 0.12 },
    price:  { x: ML + CW * 0.62, w: CW * 0.18 },
    amount: { x: ML + CW * 0.80, w: CW * 0.20 },
  }
  const ROW_H = 8

  setFill(238, 238, 238)
  doc.rect(ML, y, CW, ROW_H, 'F')
  setStroke(221, 221, 221)
  doc.setLineWidth(0.3)
  doc.line(ML, y + ROW_H, RX, y + ROW_H)
  setTxt(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Item',   C.item.x + 3,                 y + 5.5)
  doc.text('Qty',    C.qty.x + C.qty.w / 2,        y + 5.5, { align: 'center' })
  doc.text('Price',  C.price.x + C.price.w / 2,    y + 5.5, { align: 'center' })
  doc.text('Amount', C.amount.x + C.amount.w - 2,  y + 5.5, { align: 'right' })
  y += ROW_H

  type LI = { title: string; desc: string; qty: number; price: number }
  let items: LI[]
  if (appointment) {
    const apptTreatmentIds = appointment.treatment_ids ?? (appointment.treatment_id ? [appointment.treatment_id] : [])
    const apptTreatments = apptTreatmentIds
      .map(id => treatments.find(t => t.id === id))
      .filter(Boolean) as Treatment[]
    if (apptTreatments.length > 0) {
      items = apptTreatments.map(t => ({
        title: t.type.split('||')[0] || t.type,
        desc: '',
        qty: 1,
        price: t.expenses > 0 ? t.expenses : Math.round((appointment.final_price / apptTreatments.length) * 100) / 100,
      }))
    } else {
      items = [{ title: 'Dental Services', desc: appointment.diagnosis || appointment.complaint || '', qty: 1, price: appointment.final_price }]
    }
  } else {
    items = [{ title: 'Dental Services', desc: invoice.notes || '', qty: 1, price: invoice.amount }]
  }

  items.forEach((item) => {
    const descLines = item.desc.trim() ? doc.splitTextToSize(item.desc.trim(), C.item.w - 6).slice(0, 2) : []
    const itemH = ROW_H + descLines.length * 5
    setStroke(238, 238, 238)
    doc.setLineWidth(0.3)
    doc.line(ML, y + itemH, RX, y + itemH)
    setTxt(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(doc.splitTextToSize(item.title, C.item.w - 6)[0], C.item.x + 3, y + 5.5)
    if (descLines.length > 0) {
      doc.setFont('helvetica', 'normal')
      setTxt(120, 120, 120)
      doc.setFontSize(8)
      doc.text(descLines, C.item.x + 3, y + 10.5)
    }
    setTxt(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(String(item.qty),                 C.qty.x + C.qty.w / 2,      y + 5.5, { align: 'center' })
    doc.text(fmtMoney(item.price),             C.price.x + C.price.w / 2,  y + 5.5, { align: 'center' })
    doc.text(fmtMoney(item.qty * item.price),  C.amount.x + C.amount.w - 2, y + 5.5, { align: 'right' })
    y += itemH
  })

  y += 4

  // ── Section 4 — totals ───────────────────────────────────────────────────────
  const totLabelX = ML + CW * 0.55
  const totValX   = RX

  const totRow = (label: string, value: string, bold: boolean, topBorder: boolean) => {
    if (topBorder) {
      setStroke(238, 238, 238)
      doc.setLineWidth(0.4)
      doc.line(totLabelX, y, totValX, y)
      y += 3
    }
    doc.setFontSize(9)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    setTxt(bold ? 30 : 100, bold ? 30 : 100, bold ? 30 : 100)
    doc.text(label, totLabelX, y + 5)
    doc.text(value, totValX, y + 5, { align: 'right' })
    y += 8
  }

  totRow('Subtotal', fmtMoney(subtotal), false, false)
  totRow('Tax',      fmtMoney(0),        false, false)
  totRow('Total',    fmtMoney(total),    true,  true)
  y += 6

  // ── Section 5 — pre/post op notes ───────────────────────────────────────────
  const preOp  = appointment?.complaint?.trim()  || ''
  const postOp = appointment?.diagnosis?.trim()  || ''
  if (preOp || postOp) {
    const notesColW = (CW - 6) / 2
    const BOX_PAD = 4
    let noteStartY = y

    const preLines  = preOp  ? doc.splitTextToSize(preOp,  notesColW - BOX_PAD * 2) : []
    const postLines = postOp ? doc.splitTextToSize(postOp, notesColW - BOX_PAD * 2) : []
    const labelH = LINE_H
    const contentH = Math.max(preLines.length, postLines.length) * 5 + 2
    const boxH = labelH + contentH + BOX_PAD * 2

    setStroke(221, 221, 221)
    doc.setLineWidth(0.3)
    doc.rect(ML, noteStartY, notesColW, boxH)
    doc.rect(ML + notesColW + 6, noteStartY, notesColW, boxH)

    setTxt(30, 30, 30)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Pre-Op Notes', ML + BOX_PAD, noteStartY + BOX_PAD + 5)
    doc.text('Post-Op Notes', ML + notesColW + 6 + BOX_PAD, noteStartY + BOX_PAD + 5)

    doc.setFont('helvetica', 'normal')
    setTxt(80, 80, 80)
    doc.setFontSize(8)
    if (preLines.length > 0)  doc.text(preLines,  ML + BOX_PAD,                    noteStartY + BOX_PAD + labelH + 4)
    if (postLines.length > 0) doc.text(postLines, ML + notesColW + 6 + BOX_PAD,    noteStartY + BOX_PAD + labelH + 4)

    y = noteStartY + boxH + 6
  }

  // ── Section 6 — prescriptions ────────────────────────────────────────────────
  if (prescriptions.length > 0) {
    setFill(238, 238, 238)
    doc.rect(ML, y, CW, ROW_H, 'F')
    setStroke(221, 221, 221)
    doc.setLineWidth(0.3)
    doc.line(ML, y + ROW_H, RX, y + ROW_H)
    setTxt(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Prescription',  C.item.x + 3,                  y + 5.5)
    doc.text('Form',          C.qty.x + C.qty.w / 2,         y + 5.5, { align: 'center' })
    doc.text('Dose',          C.price.x + C.price.w / 2,     y + 5.5, { align: 'center' })
    doc.text('Times/Units',   C.amount.x + C.amount.w - 2,   y + 5.5, { align: 'right' })
    y += ROW_H

    prescriptions.forEach((rx) => {
      setStroke(238, 238, 238)
      doc.setLineWidth(0.3)
      doc.line(ML, y + ROW_H, RX, y + ROW_H)
      setTxt(60, 60, 60)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(rx.name,                                      C.item.x + 3,                  y + 5.5)
      doc.text(rx.form,                                      C.qty.x + C.qty.w / 2,         y + 5.5, { align: 'center' })
      doc.text(`${rx.dose_in_mg} mg`,                        C.price.x + C.price.w / 2,     y + 5.5, { align: 'center' })
      doc.text(`${rx.times_per_day}x${rx.units_per_time}`,   C.amount.x + C.amount.w - 2,   y + 5.5, { align: 'right' })
      y += ROW_H
    })
    y += 6
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  setStroke(221, 221, 221)
  doc.setLineWidth(0.4)
  doc.line(ML, H - 14, RX, H - 14)
  setTxt(150, 150, 150)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(clinicName, ML, H - 7)
  doc.text('Page 1', RX, H - 7, { align: 'right' })

  return doc
}

export function openInvoicePDF(doc: jsPDF, patient: Patient, autoPrint = false) {
  if (autoPrint) doc.autoPrint()
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  if (!win) {
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${patient.name.replace(/\s+/g, '-')}.pdf`
    a.click()
  }
}
