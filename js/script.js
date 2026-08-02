// ============================================
// js/script.js – GLOBAL BEHAVIOUR
// Morning Glory English Academy ERP
// No demo data – ready for Firebase
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // ---------- Sidebar Toggle ----------
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerBtn');
    const overlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = (sidebar && sidebar.classList.contains('open')) ? 'hidden' : '';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    window.addEventListener('resize', function() {
        if (window.innerWidth > 992 && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // ---------- Currency Formatter (Indian Rupee) ----------
    window.formatINR = function(amount) {
        if (amount === undefined || amount === null) return '₹ 0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // ---------- Date Formatter (DD/MM/YYYY) ----------
    window.formatDate = function(dateString) {
        if (!dateString) return '--/--/----';
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // ---------- Set Active Nav Link ----------
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    console.log('Morning Glory ERP · Global script loaded (clean architecture)');
});
