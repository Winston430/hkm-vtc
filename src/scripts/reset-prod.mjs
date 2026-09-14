/**
 * reset-prod.mjs — wipe the Firebase project and create the admin account.
 *
 *  ⚠️  DESTRUCTIVE: deletes ALL Firestore docs, ALL Storage files, and ALL
 *      Auth users, then creates a single admin. Use only for a fresh prod start.
 *
 *  Setup:
 *    1) Firebase console → Project settings → Service accounts →
 *       "Generate new private key" → save it next to this file as
 *       serviceAccount.json  (NEVER commit this file — add it to .gitignore)
 *    2) npm install firebase-admin
 *    3) node reset-prod.mjs --yes
 */

import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

const serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'))
const projectId = serviceAccount.project_id

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${projectId}.appspot.com`,
})

const db = getFirestore()
const auth = getAuth()
const bucket = getStorage().bucket()

const COLLECTIONS = [
  'students', 'enrollments', 'payments', 'notifications',
  'counters', 'courses', 'branches', 'users',
]

const ADMIN = {
  email: 'developer@zentrya.co.tz',
  password: '20052oo5',
  name: 'Developer',
}

// ---------- safety guard ----------
if (!process.argv.includes('--yes')) {
  console.log('\n⚠️  This will PERMANENTLY DELETE all data in project:', projectId)
  console.log('   Firestore documents, Storage files, and Auth users will be erased.')
  console.log('   Re-run with --yes to confirm:  node reset-prod.mjs --yes\n')
  process.exit(1)
}

console.log('\nTarget project:', projectId, '\n')

// ---------- wipe Firestore ----------
async function deleteCollection(name, batchSize = 300) {
  const col = db.collection(name)
  let deleted = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await col.limit(batchSize).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
  }
  console.log(`  ✓ Firestore/${name}: ${deleted} docs deleted`)
}

async function wipeFirestore() {
  console.log('Clearing Firestore…')
  for (const c of COLLECTIONS) await deleteCollection(c)
}

// ---------- wipe Storage ----------
async function wipeStorage() {
  console.log('Clearing Storage…')
  try {
    await bucket.deleteFiles({ prefix: '' }) // everything in the bucket
    console.log('  ✓ Storage: all files deleted')
  } catch (e) {
    console.log('  • Storage skipped:', e?.message || e)
  }
}

// ---------- wipe Auth users ----------
async function wipeAuth() {
  console.log('Clearing Auth users…')
  let count = 0
  let pageToken
  do {
    const res = await auth.listUsers(1000, pageToken)
    if (res.users.length) {
      await auth.deleteUsers(res.users.map((u) => u.uid))
      count += res.users.length
    }
    pageToken = res.pageToken
  } while (pageToken)
  console.log(`  ✓ Auth: ${count} users deleted`)
}

// ---------- create admin ----------
async function createAdmin() {
  console.log('Creating admin…')
  const user = await auth.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    displayName: ADMIN.name,
    emailVerified: true,
  })
  // custom claim (belt-and-braces; the app reads role from the users doc)
  await auth.setCustomUserClaims(user.uid, { role: 'admin' })
  await db.doc(`users/${user.uid}`).set({
    name: ADMIN.name,
    email: ADMIN.email,
    role: 'admin',
    branchId: null,
    active: true,
    createdAt: Date.now(),
  })
  console.log(`  ✓ Admin ready: ${ADMIN.email}  (uid ${user.uid})`)
}

// ---------- run ----------
try {
  await wipeAuth()      // delete users first (also clears the users collection auth side)
  await wipeStorage()
  await wipeFirestore() // clears the users collection docs too
  await createAdmin()
  console.log('\n✅ Done. Project reset and admin created.\n')
  process.exit(0)
} catch (err) {
  console.error('\n❌ Failed:', err)
  process.exit(1)
}
