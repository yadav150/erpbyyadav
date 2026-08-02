// ============================================
// js/services/studentService.js – Student CRUD
// ============================================

import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, onSnapshot } from '../firebase.js';
import { logActivity } from './activityService.js';

const STUDENTS_COLLECTION = 'students';

export function subscribeStudents(callback) {
    const q = query(collection(db, STUDENTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const students = [];
        snapshot.forEach((doc) => {
            students.push({ id: doc.id, ...doc.data() });
        });
        callback(students);
    });
}

export async function addStudent(data) {
    try {
        const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
            ...data,
            createdAt: new Date().toISOString()
        });
        await logActivity(`New student added: ${data.name} (${data.rollNo})`, 'student');
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding student:', error);
        return { success: false, error: error.message };
    }
}

export async function updateStudent(id, data) {
    try {
        await updateDoc(doc(db, STUDENTS_COLLECTION, id), data);
        await logActivity(`Student updated: ${data.name}`, 'student');
        return { success: true };
    } catch (error) {
        console.error('Error updating student:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteStudent(id) {
    try {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
        await logActivity(`Student deleted (ID: ${id})`, 'student');
        return { success: true };
    } catch (error) {
        console.error('Error deleting student:', error);
        return { success: false, error: error.message };
    }
}
