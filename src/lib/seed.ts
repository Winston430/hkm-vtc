import { collection, doc, writeBatch, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Courses transcribed from the HKM paper form, each with a short code used in
// the registration number: HKM/VTC/<CODE>/<0001>.
const SEED_COURSES = [
  { name: 'Basic Computer',                code: 'CMP', category: 'Computer', durationMonths: 3, price: 240000 },
  { name: 'Basic Graphic Design',          code: 'GRD', category: 'Computer', durationMonths: 2, price: 300000 },
  { name: 'Computer Maintenance & Repair', code: 'CMR', category: 'Computer', durationMonths: 2, price: 250000 },
  { name: 'Networking',                    code: 'NET', category: 'Computer', durationMonths: 2, price: 250000 },
  { name: 'Database',                      code: 'DBS', category: 'Computer', durationMonths: 2, price: 250000 },
  { name: 'Make-up',                       code: 'MKP', category: 'Beauty',   durationMonths: 2, price: 300000 },
  { name: 'Natural Hair Styling',          code: 'NHS', category: 'Beauty',   durationMonths: 3, price: 300000 },
  { name: 'Braids & Crochet',              code: 'BRC', category: 'Beauty',   durationMonths: 3, price: 450000 },
  { name: 'Weaving (Wigs)',                code: 'WVG', category: 'Beauty',   durationMonths: 2, price: 200000 },
  { name: 'Nail Artistry',                 code: 'NAL', category: 'Beauty',   durationMonths: 1, price: 170000 },
  { name: 'Henna & Piko',                  code: 'HNA', category: 'Beauty',   durationMonths: 2, price: 300000 },
  { name: 'Dreadlocks',                    code: 'DRD', category: 'Beauty',   durationMonths: 3, price: 450000 },
  { name: 'Basic English',                 code: 'ENG', category: 'English',  durationMonths: 3, price: 450000 },
  { name: 'Basic Driving',                 code: 'DRV', category: 'Driving',  durationMonths: 1, price: 220000 },
]

const SEED_BRANCHES = [
  { name: 'Babati', location: 'Babati, Manyara', phone: '0676 178 042' },
  { name: 'Arusha', location: 'Arusha', phone: '' },
]

export async function seedCatalog(): Promise<void> {
  // guard: never seed if courses already exist (prevents duplicates on an
  // accidental or double press)
  const existing = await getDocs(collection(db, 'courses'))
  if (!existing.empty) return
  const batch = writeBatch(db)
  SEED_COURSES.forEach((c) => {
    const ref = doc(collection(db, 'courses'))
    batch.set(ref, { ...c, active: true, createdAt: Date.now() })
  })
  SEED_BRANCHES.forEach((b) => {
    const ref = doc(collection(db, 'branches'))
    batch.set(ref, { ...b, createdAt: Date.now() })
  })
  await batch.commit()
}

export async function catalogIsEmpty(): Promise<boolean> {
  const snap = await getDocs(collection(db, 'courses'))
  return snap.empty
}