export interface PrintColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

interface PrintOptions {
  title: string
  columns: PrintColumn[]
  rows: Record<string, string | number>[]
  totals?: Record<string, string | number>
  meta?: { generatedLabel: string; countLabel: string; branch?: string; branchLabel?: string; totalLabel?: string }
}

const HKM = {
  name: 'HKM VOCATIONAL TRAINING CENTER',
  address: 'S.L.P 16, Babati',
  phone: '0676 178 042 / 0767 178 040',
  email: 'hkmvtc@gmail.com',
  reg: 'REG/NACTVET/1013P',
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

/** Opens a print-ready window and triggers print. Returns false if the popup was blocked. */
export function printReport(opts: PrintOptions): boolean {
  const w = window.open('', '_blank', 'width=980,height=760')
  if (!w) return false

  const today = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const thead = opts.columns.map((c) => `<th style="text-align:${c.align || 'left'}">${esc(c.label)}</th>`).join('')
  const tbody = opts.rows
    .map(
      (r, i) =>
        `<tr>${opts.columns.map((c) => `<td style="text-align:${c.align || 'left'}">${c.key === '_n' ? i + 1 : esc(String(r[c.key] ?? ''))}</td>`).join('')}</tr>`
    )
    .join('')
  const tfoot = opts.totals
    ? `<tr class="totals">${opts.columns
        .map((c, i) => `<td style="text-align:${c.align || 'left'}">${i === 0 ? esc(opts.meta?.totalLabel || 'TOTAL') : esc(String(opts.totals?.[c.key] ?? ''))}</td>`)
        .join('')}</tr>`
    : ''

  const metaLine = [
    `${esc(opts.meta?.generatedLabel || 'Generated')}: ${esc(today)}`,
    opts.meta?.branch ? `${esc(opts.meta.branchLabel || 'Branch')}: ${esc(opts.meta.branch)}` : '',
    `${esc(opts.meta?.countLabel || 'Count')}: ${opts.rows.length}`,
  ]
    .filter(Boolean)
    .join('&nbsp;&nbsp;·&nbsp;&nbsp;')

  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
  <title>${esc(opts.title)} — HKM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Manrope',Arial,sans-serif;color:#171717;padding:32px;font-size:12px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #171717;padding-bottom:12px}
    .center-name{font-size:17px;font-weight:800;letter-spacing:-.2px}
    .sub{font-size:10.5px;color:#666;margin-top:2px;line-height:1.5}
    .reg{font-size:10.5px;font-weight:700;color:#171717;margin-top:4px}
    h2{font-size:15px;margin:20px 0 5px;font-weight:800}
    .meta{font-size:10.5px;color:#666;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{text-align:left;background:#f4f4f4;padding:8px;border-bottom:1.5px solid #ddd;font-size:9.5px;text-transform:uppercase;letter-spacing:.3px;font-weight:800;color:#444}
    td{padding:7px 8px;border-bottom:1px solid #eee}
    tr.totals td{font-weight:800;border-top:2px solid #171717;background:#fafafa}
    .foot{margin-top:28px;padding-top:10px;border-top:1px solid #eee;font-size:10px;color:#999;display:flex;justify-content:space-between}
    @media print{body{padding:6px}.no-print{display:none}}
  </style></head>
  <body>
    <div class="head">
      <div>
        <div class="center-name">${esc(HKM.name)}</div>
        <div class="sub">${esc(HKM.address)} &nbsp;·&nbsp; ${esc(HKM.phone)}<br>${esc(HKM.email)}</div>
        <div class="reg">${esc(HKM.reg)}</div>
      </div>
    </div>
    <h2>${esc(opts.title)}</h2>
    <div class="meta">${metaLine}</div>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}${tfoot}</tbody></table>
    <div class="foot"><span>HKM Vocational Training Center</span><span>${esc(today)}</span></div>
    <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
  </body></html>`)
  w.document.close()
  return true
}


export interface ReceiptLabels {
  title: string; no: string; date: string; student: string; reg: string
  course: string; amount: string; for: string; balance: string; received: string; thanks: string
}

/** Opens a print-ready payment receipt. Returns false if the popup was blocked. */
export function printReceipt(opts: {
  receiptNo: string; date: string; studentName: string; regNo: string
  course: string; amount: string; period: string; balance: string; labels: ReceiptLabels
}): boolean {
  const w = window.open('', '_blank', 'width=520,height=680')
  if (!w) return false
  const L = opts.labels
  const row = (k: string, v: string) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`
  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
  <title>${esc(L.title)} — HKM</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Manrope',Arial,sans-serif;color:#171717;padding:26px;font-size:12px}
    .wrap{max-width:440px;margin:0 auto}
    .head{text-align:center;border-bottom:2px solid #171717;padding-bottom:10px}
    .name{font-weight:800;font-size:15px;letter-spacing:-.2px}
    .sub{font-size:10px;color:#666;margin-top:3px;line-height:1.5}
    .badge{display:block;text-align:center;margin:14px 0 2px;font-size:12px;font-weight:800;letter-spacing:1.5px;color:#444}
    .amount{text-align:center;font-size:30px;font-weight:800;letter-spacing:-.5px;margin:6px 0 14px}
    .rows{font-size:12px}
    .row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px dashed #e6e6e6}
    .row .k{color:#888;font-weight:600}
    .row .v{font-weight:700;text-align:right}
    .sign{margin-top:26px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#888}
    .thanks{text-align:center;margin-top:16px;font-size:11px;color:#999}
    @media print{body{padding:4px}}
  </style></head>
  <body><div class="wrap">
    <div class="head">
      <div class="name">HKM VOCATIONAL TRAINING CENTER</div>
      <div class="sub">S.L.P 16, Babati &nbsp;·&nbsp; 0676 178 042 / 0767 178 040<br>REG/NACTVET/1013P</div>
    </div>
    <div class="badge">${esc(L.title)}</div>
    <div class="amount">${esc(opts.amount)}</div>
    <div class="rows">
      ${row(L.no, opts.receiptNo)}
      ${row(L.date, opts.date)}
      ${row(L.student, opts.studentName)}
      ${row(L.reg, opts.regNo)}
      ${row(L.course, opts.course)}
      ${row(L.for, opts.period)}
      ${row(L.balance, opts.balance)}
    </div>
    <div class="sign">${esc(L.received)}: __________________________</div>
    <div class="thanks">${esc(L.thanks)}</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
  </body></html>`)
  w.document.close()
  return true
}