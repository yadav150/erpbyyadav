// ============================================
// js/modals.js – Generic Modal Handler
// ============================================

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.classList.add('active');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
}

// Attach close events to all modal close buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(b => {
        b.addEventListener('click', function() {
            const modal = document.querySelector('.modal.active');
            if (modal) closeModal(modal.id);
        });
    });
});
