// ============================================
// js/auth-rbac.js – Authentication & RBAC
// AUTO‑CREATES users, roles, and assigns first user as SUPER_ADMIN
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // ---------- Permission Map ----------
    const pagePermissionMap = {
        'index.html': 'dashboard',
        'students.html': 'student_management',
        'teachers.html': 'student_management',
        'fees.html': 'fee_management',
        'salary.html': 'fee_management',
        'reports.html': 'reports',
        'settings.html': 'settings',
        'login.html': null,
        'access-denied.html': null
    };

    // ---------- Default Role Permissions ----------
    const defaultPermissions = {
        'super_admin': {
            dashboard: true, student_management: true, fee_management: true,
            receipt_management: true, activity_logs: true, reports: true,
            settings: true, user_management: true
        },
        'admin': {
            dashboard: true, student_management: true, fee_management: true,
            receipt_management: true, activity_logs: true, reports: true,
            settings: true, user_management: false
        },
        'accountant': {
            dashboard: true, student_management: false, fee_management: true,
            receipt_management: true, activity_logs: true, reports: true,
            settings: false, user_management: false
        },
        'teacher': {
            dashboard: true, student_management: true, fee_management: false,
            receipt_management: false, activity_logs: true, reports: false,
            settings: false, user_management: false
        },
        'staff': {
            dashboard: true, student_management: false, fee_management: false,
            receipt_management: false, activity_logs: true, reports: false,
            settings: false, user_management: false
        }
    };

    let currentUser = null;
    let currentRole = null;
    let currentPermissions = {};

    // ---------- Utility: Check if users collection is empty ----------
    async function isUsersCollectionEmpty() {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef);
            const snap = await getDocs(q);
            return snap.empty;
        } catch (e) {
            // If collection doesn't exist, treat as empty
            return true;
        }
    }

    // ---------- Auto‑create role documents if missing ----------
    async function ensureRoleDocuments() {
        for (const [roleName, perms] of Object.entries(defaultPermissions)) {
            const roleRef = doc(db, 'roles', roleName);
            const snap = await getDoc(roleRef);
            if (!snap.exists()) {
                await setDoc(roleRef, { permissions: perms });
                console.log(`✅ Created role: ${roleName}`);
            }
        }
    }

    // ---------- Fetch or Auto‑Create User ----------
    async function fetchOrCreateUser(uid, email) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // User exists – return their role
            const data = userSnap.data();
            return { role: data.role || 'staff' };
        }

        // ----- User does NOT exist – auto‑create -----
        let assignedRole = 'staff';

        // Check if this is the first user ever
        const empty = await isUsersCollectionEmpty();
        if (empty) {
            assignedRole = 'super_admin';
            console.log('👑 First user – assigned SUPER_ADMIN');
        }

        // Create user document
        await setDoc(userRef, {
            email: email,
            role: assignedRole,
            displayName: email.split('@')[0] || 'User',
            createdAt: new Date().toISOString()
        });

        console.log(`✅ Created user: ${email} with role: ${assignedRole}`);
        return { role: assignedRole };
    }

    // ---------- Get permissions for a role (from Firestore or fallback) ----------
    async function getRolePermissions(role) {
        try {
            const roleRef = doc(db, 'roles', role);
            const snap = await getDoc(roleRef);
            if (snap.exists()) {
                const data = snap.data();
                return data.permissions || defaultPermissions[role] || defaultPermissions['staff'];
            }
        } catch (e) { /* ignore */ }
        // Fallback
        return defaultPermissions[role] || defaultPermissions['staff'];
    }

    // ---------- Main Auth Setup ----------
    window.fetchUserPermissions = async function(uid, email) {
        try {
            // 1. Ensure role documents exist
            await ensureRoleDocuments();

            // 2. Get or create user
            const { role } = await fetchOrCreateUser(uid, email);

            // 3. Fetch permissions for that role
            const permissions = await getRolePermissions(role);

            return { role, permissions };
        } catch (error) {
            console.error('Error in fetchUserPermissions:', error);
            // Fallback to staff
            return { role: 'staff', permissions: defaultPermissions['staff'] };
        }
    };

    // ---------- Check Permission ----------
    window.hasPermission = function(permKey) {
        if (!currentUser) return false;
        if (currentRole === 'super_admin') return true;
        return !!currentPermissions[permKey];
    };

    // ---------- Apply UI ----------
    function applyPermissionsToUI() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const requiredPerm = pagePermissionMap[currentPage];

        if (requiredPerm && !window.hasPermission(requiredPerm)) {
            if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
                window.location.href = 'access-denied.html';
                return;
            }
        }

        // Hide/show sidebar links
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const pageKey = href.split('/').pop();
            const perm = pagePermissionMap[pageKey];
            if (perm) {
                link.style.display = window.hasPermission(perm) ? 'flex' : 'none';
            }
        });

        // Hide/show buttons
        document.querySelectorAll('[data-permission]').forEach(el => {
            const perm = el.getAttribute('data-permission');
            el.style.display = window.hasPermission(perm) ? '' : 'none';
        });

        // Hide/show sections
        document.querySelectorAll('[data-permission-section]').forEach(el => {
            const perm = el.getAttribute('data-permission-section');
            el.style.display = window.hasPermission(perm) ? '' : 'none';
        });

        // Update greeting
        const greeting = document.querySelector('.greeting');
        if (greeting && currentUser) {
            const roleDisplay = currentRole ? currentRole.replace('_', ' ').toUpperCase() : '';
            greeting.textContent = `Welcome, ${roleDisplay}`;
        }
    }

    // ---------- Auth State Listener ----------
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const result = await window.fetchUserPermissions(user.uid, user.email);
            currentRole = result.role;
            currentPermissions = result.permissions;
            console.log(`✅ Authenticated as ${currentRole} (${user.email})`);

            applyPermissionsToUI();
            window.dispatchEvent(new CustomEvent('auth-state-ready', {
                detail: { user, role: currentRole, permissions: currentPermissions }
            }));
        } else {
            currentUser = null;
            currentRole = null;
            currentPermissions = {};
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
                window.location.href = 'login.html';
            }
        }
    });

    // ---------- Helpers ----------
    window.getCurrentRole = () => currentRole;
    window.getCurrentUser = () => currentUser;
    window.refreshPermissions = async () => {
        if (currentUser) {
            const result = await window.fetchUserPermissions(currentUser.uid, currentUser.email);
            currentRole = result.role;
            currentPermissions = result.permissions;
            applyPermissionsToUI();
        }
    };

    // ---------- Login / Logout ----------
    window.loginUser = async function(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    window.logoutUser = async function() {
        await signOut(auth);
        window.location.href = 'login.html';
    };

    // Initial apply
    document.addEventListener('DOMContentLoaded', applyPermissionsToUI);
    window.addEventListener('pageshow', applyPermissionsToUI);

    console.log('🚀 RBAC with auto‑setup loaded');
});
