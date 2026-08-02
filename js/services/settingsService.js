// ============================================
// js/services/settingsService.js – Settings CRUD
// ============================================

import { db, doc, getDoc, updateDoc, setDoc } from '../firebase.js';

const SETTINGS_DOC_ID = 'profile';

export async function getSettings() {
    try {
        const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            // Return default settings if none exist
            return { success: true, data: getDefaultSettings() };
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: error.message };
    }
}

export async function saveSettings(data) {
    try {
        await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: error.message };
    }
}

function getDefaultSettings() {
    return {
        schoolName: 'Morning Glory English Academy',
        address: '',
        city: '',
        state: '',
        pin: '',
        phone: '',
        email: '',
        gstin: '',
        pan: '',
        bankName: '',
        accountNo: '',
        ifsc: ''
    };
}
