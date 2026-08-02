// ============================================
// js/services/activityService.js – Log Activities
// ============================================

import { db, collection, addDoc, serverTimestamp } from '../firebase.js';

export async function logActivity(message, type = 'info') {
    try {
        await addDoc(collection(db, 'activities'), {
            message: message,
            type: type, // 'fee', 'salary', 'student', 'teacher', 'info'
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
