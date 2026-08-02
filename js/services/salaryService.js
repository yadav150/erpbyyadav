// ============================================
// js/services/salaryService.js – Salary CRUD
// ============================================

import { db, collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from '../firebase.js';
import { logActivity } from './activityService.js';

const SALARY_COLLECTION = 'salary';

export function subscribeSalaries(callback) {
    const q = query(collection(db, SALARY_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const salaries = [];
        snapshot.forEach((doc) => {
            salaries.push({ id: doc.id, ...doc.data() });
        });
        callback(salaries);
    });
}

export async function addSalary(data) {
    try {
        const docRef = await addDoc(collection(db, SALARY_COLLECTION), {
            ...data,
            createdAt: new Date().toISOString()
        });
        await logActivity(`Salary generated: ${data.teacherName} – ₹${data.amount} (${data.month} ${data.year})`, 'salary');
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding salary:', error);
        return { success: false, error: error.message };
    }
}

export async function updateSalary(id, data) {
    try {
        await updateDoc(doc(db, SALARY_COLLECTION, id), data);
        await logActivity(`Salary updated: ${data.teacherName}`, 'salary');
        return { success: true };
    } catch (error) {
        console.error('Error updating salary:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteSalary(id) {
    try {
        await deleteDoc(doc(db, SALARY_COLLECTION, id));
        await logActivity(`Salary record deleted (ID: ${id})`, 'salary');
        return { success: true };
    } catch (error) {
        console.error('Error deleting salary:', error);
        return { success: false, error: error.message };
    }
}
