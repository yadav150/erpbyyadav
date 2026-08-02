// ============================================
// js/services/teacherService.js – Teacher CRUD
// ============================================

import { db, collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from '../firebase.js';
import { logActivity } from './activityService.js';

const TEACHERS_COLLECTION = 'teachers';

export function subscribeTeachers(callback) {
    const q = query(collection(db, TEACHERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const teachers = [];
        snapshot.forEach((doc) => {
            teachers.push({ id: doc.id, ...doc.data() });
        });
        callback(teachers);
    });
}

export async function addTeacher(data) {
    try {
        const docRef = await addDoc(collection(db, TEACHERS_COLLECTION), {
            ...data,
            createdAt: new Date().toISOString()
        });
        await logActivity(`New teacher added: ${data.name} (${data.teacherId})`, 'teacher');
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding teacher:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTeacher(id, data) {
    try {
        await updateDoc(doc(db, TEACHERS_COLLECTION, id), data);
        await logActivity(`Teacher updated: ${data.name}`, 'teacher');
        return { success: true };
    } catch (error) {
        console.error('Error updating teacher:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteTeacher(id) {
    try {
        await deleteDoc(doc(db, TEACHERS_COLLECTION, id));
        await logActivity(`Teacher deleted (ID: ${id})`, 'teacher');
        return { success: true };
    } catch (error) {
        console.error('Error deleting teacher:', error);
        return { success: false, error: error.message };
    }
}
