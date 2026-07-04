'use client';

// Counselor comments on a student portfolio — portfolios/{uid}/comments/{id}.
// Rules: org staff create/edit their own, the student reads + toggles resolved.

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export function useComments(studentUid) {
  const [comments, setComments] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = getDb();
    if (!db || !studentUid) {
      setComments([]);
      setReady(true);
      return;
    }
    const q = query(
      collection(db, 'portfolios', studentUid, 'comments'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [studentUid]);

  return { comments, ready };
}

export async function addComment(studentUid, { authorUid, authorName, text, section }) {
  const db = getDb();
  await addDoc(collection(db, 'portfolios', studentUid, 'comments'), {
    authorUid,
    authorName: authorName || 'Counselor',
    text: text.trim(),
    section: section || 'general',
    createdAt: Date.now(),
    resolved: false,
  });
}

export async function setResolved(studentUid, commentId, resolved) {
  const db = getDb();
  await updateDoc(doc(db, 'portfolios', studentUid, 'comments', commentId), { resolved });
}

export const COMMENT_SECTIONS = [
  ['general', 'General'],
  ['academics', 'Academics'],
  ['testing', 'Testing'],
  ['activities', 'Extracurriculars'],
  ['honors', 'Honors'],
  ['narrative', 'Narrative / Essay'],
];
