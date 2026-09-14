import { updateDoc, doc } from 'firebase/firestore'
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase'

export async function updateProfileName(uid: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { name: name.trim() })
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) throw new Error('no-user')
  await updatePassword(auth.currentUser, newPassword)
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}