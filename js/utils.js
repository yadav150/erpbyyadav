// ============================================
// js/utils.js – Shared Utilities
// ============================================

// ---------- Toast Notification ----------
export function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    const toast = document.createElement('div');
    toast.className = `toast-item ${colors[type] || colors.info}`;
    toast.textContent = message;
    toast.style.cssText = `
        padding: 12px 20px;
        margin-bottom: 8px;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-break: break-word;
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        max-width: 420px;
    `;
    document.body.appendChild(container);
    return container;
}

// ---------- Loading Spinner ----------
export function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="spinner" style="margin:20px auto;width:36px;height:36px;border:4px solid #E5E7EB;border-top-color:#4F46E5;border-radius:50%;animation:spin 0.8s linear infinite;"></div>`;
    }
}

export function hideLoading(elementId, fallbackHTML = '') {
    const el = document.getElementById(elementId);
    if (el && el.querySelector('.spinner')) {
        el.innerHTML = fallbackHTML;
    }
}

// ---------- Currency Formatter (₹ INR) ----------
export function formatINR(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

// ---------- Date Formatter (DD/MM/YYYY) ----------
export function formatDate(timestamp) {
    if (!timestamp) return '--/--/----';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d)) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// ---------- Generate ID (short unique) ----------
export function generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
