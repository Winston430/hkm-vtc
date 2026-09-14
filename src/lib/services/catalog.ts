import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Course, Branch } from '../types'

export function useCourses(includeInactive = false) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) }))
        list.sort((a, b) => a.name.localeCompare(b.name))
        setCourses(includeInactive ? list : list.filter((c) => c.active))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [includeInactive])
  return { courses, loading }
}

export async function addCourse(data: Omit<Course, 'id'>): Promise<void> {
  await addDoc(collection(db, 'courses'), { ...data, createdAt: Date.now() })
}
export async function updateCourse(id: string, patch: Partial<Course>): Promise<void> {
  await updateDoc(doc(db, 'courses', id), patch as Record<string, unknown>)
}
export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', id))
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'branches'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Branch, 'id'>) }))
        list.sort((a, b) => a.name.localeCompare(b.name))
        setBranches(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])
  return { branches, loading }
}

export async function addBranch(data: Omit<Branch, 'id'>): Promise<void> {
  await addDoc(collection(db, 'branches'), { ...data, createdAt: Date.now() })
}
export async function updateBranch(id: string, patch: Partial<Branch>): Promise<void> {
  await updateDoc(doc(db, 'branches', id), patch as Record<string, unknown>)
}
export async function deleteBranch(id: string): Promise<void> {
  await deleteDoc(doc(db, 'branches', id))
}