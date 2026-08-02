// js/rbac.js – Role-Based Access Control
import { auth, database } from './firebase-init.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

// ---------- Permission definitions ----------
const defaultRolePermissions = {
  super_admin: [
    'view_dashboard', 'manage_students', 'manage_teachers',
    'manage_fees', 'manage_salary', 'manage_receipts',
    'view_logs', 'view_reports', 'manage_settings', 'manage_users'
  ],
  admin: [
    'view_dashboard', 'manage_students', 'manage_teachers',
    'manage_fees', 'manage_salary', 'manage_receipts',
    'view_logs', 'view_reports', 'manage_settings'
  ],
  accountant: [
    'view_dashboard', 'manage_fees', 'manage_salary',
    'manage_receipts', 'view_reports'
  ],
  teacher: [
    'view_dashboard', 'manage_students', 'view_reports'
  ],
  staff: [
    'view_dashboard'
  ]
};

// ---------- Page → permission mapping ----------
const pagePermissionMap = {
  'index.html': 'view_dashboard',
  'students.html': 'manage_students',
  'teachers.html': 'manage_teachers',
  'fees.html': 'manage_fees',
  'salary.html': 'manage_salary',
  'reports.html': 'view_reports',
  'settings.html': 'manage_settings',
  'login.html': null,
  'access-denied.html': null
};

// ---------- State ----------
let currentUser = null;
let currentRole = null;
let currentPermissions = [];
let authResolved = false;
let pendingRedirect = false;

// ---------- Helper: fetch role permissions (dynamic) ----------
async function fetchRolePermissions(role) {
  // Optionally fetch from Firebase to allow real‑time updates
  // For now fallback to default map
  return defaultRolePermissions[role] || defaultRolePermissions['staff'];
}

// ---------- Main init ----------
function initRBAC() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      try {
        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          currentRole = data.role || 'staff';
        } else {
          // No role data → assign default 'staff'
          currentRole = 'staff';
          console.warn('No role found for user, defaulting to staff');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        currentRole = 'staff';
      }
      currentPermissions = await fetchRolePermissions(currentRole);
    } else {
      currentRole = null;
      currentPermissions = [];
    }
    authResolved = true;
    applyRBAC();
    checkPageAccess();
  });
}

// ---------- Permission check ----------
function hasPermission(permission) {
  return currentPermissions.includes(permission);
}

// ---------- Getters ----------
function getCurrentUser() { return currentUser; }
function getCurrentRole() { return currentRole; }
function isLoggedIn() { return currentUser !== null; }

// ---------- UI: hide unauthorized elements ----------
function applyRBAC() {
  if (!authResolved) return;
  document.querySelectorAll('.nav-link[data-permission]').forEach(link => {
    const perm = link.getAttribute('data-permission');
    const show = (perm && hasPermission(perm));
    link.style.display = show ? 'flex' : 'none';
  });

  document.querySelectorAll('.quick-btn[data-permission]').forEach(btn => {
    const perm = btn.getAttribute('data-permission');
    const show = (perm && hasPermission(perm));
    btn.style.display = show ? 'flex' : 'none';
  });
}

// ---------- Page access control ----------
function checkPageAccess() {
  if (!authResolved) return; // wait for auth to resolve

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const required = pagePermissionMap[currentPage];
  if (required) {
    if (!isLoggedIn()) {
      if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
        window.location.href = 'login.html';
      }
      return;
    }
    if (!hasPermission(required)) {
      if (currentPage !== 'access-denied.html') {
        window.location.href = 'access-denied.html';
      }
      return;
    }
  }
  // If we are on login page and already logged in, redirect to dashboard
  if (currentPage === 'login.html' && isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

// ---------- Logout ----------
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}

// ---------- Expose global API ----------
window.RBAC = {
  init: initRBAC,
  hasPermission,
  getCurrentUser,
  getCurrentRole,
  isLoggedIn,
  logout,
  applyRBAC,
  checkPageAccess
};

// Auto‑run when DOM is ready – but we call from each page to be safe
document.addEventListener('DOMContentLoaded', function() {
  // We'll rely on the page's explicit call to init
});
