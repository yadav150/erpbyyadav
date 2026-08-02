// ============================================
// js/auth-rbac.js – Authentication & RBAC
// Auto-creates roles, users, and assigns first user as SUPER_ADMIN
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // Permission Map (page URL -> permission key)
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

    // Default role permissions
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

    // Check if users collection is empty
    async function isUsersCollectionEmpty() {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef);
            const snap = await getDocs(q);
            return snap.empty;
        } catch (e) {
            return true; // assume empty if error
        }
    }

    // Ensure all role documents exist
    async function ensureRoleDocuments() {
        for (const [roleName, perms] of Object.entries(defaultPermissions)) {
            const roleRef = doc(db, 'roles', roleName);
            const snap = await getDoc(roleRef);
            if (!snap.exists()) {
                await setDoc(roleRef, { permissions: perms });
                console.log('Created role: ' + roleName);
            }
        }
    }

    // Fetch or auto-create user
    async function fetchOrCreateUser(uid, email) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return { role: data.role || 'staff' };
        }

        // First user becomes super_admin
        const empty = await isUsersCollectionEmpty();
        const assignedRole = empty ? 'super_admin' : 'staff';

        await setDoc(userRef, {
            email: email,
            role: assignedRole,
            displayName: email.split('@')[0] || 'User',
            createdAt: new Date().toISOString()
        });

        console.log('Created user: ' + email + ' with role: ' + assignedRole);
        return { role: assignedRole };
    }

    // Get permissions for a role
    async function getRolePermissions(role) {
        try {
            const roleRef = doc(db, 'roles', role);
            const snap = await getDoc(roleRef);
            if (snap.exists()) {
                return snap.data().permissions || defaultPermissions[role] || defaultPermissions['staff'];
            }
        } catch (e) {}
        return defaultPermissions[role] || defaultPermissions['staff'];
    }

    // Main function to set up user permissions
    window.fetchUserPermissions = async function(uid, email) {
        try {
            await ensureRoleDocuments();
            const { role } = await fetchOrCreateUser(uid, email);
            const permissions = await getRolePermissions(role);
            return { role, permissions };
        } catch (error) {
            console.error('Error fetching permissions:', error);
            return { role: 'staff', permissions: defaultPermissions['staff'] };
        }
    };

    // Check permission
    window.hasPermission = function(permKey) {
        if (!currentUser) return false;
        if (currentRole === 'super_admin') return true;
        return !!currentPermissions[permKey];
    };

    // Apply UI restrictions
    function applyPermissionsToUI() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const requiredPerm = pagePermissionMap[currentPage];

        if (requiredPerm && !window.hasPermission(requiredPerm)) {
            if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
                window.location.href = 'access-denied.html';
                return;
            }
        }

        // Sidebar links
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const pageKey = href.split('/').pop();
            const perm = pagePermissionMap[pageKey];
            if (perm) {
                link.style.display = window.hasPermission(perm) ? 'flex' : 'none';
            }
        });

        // Action buttons
        document.querySelectorAll('[data-permission]').forEach(el => {
            const perm = el.getAttribute('data-permission');
            el.style.display = window.hasPermission(perm) ? '' : 'none';
        });

        // Sections
        document.querySelectorAll('[data-permission-section]').forEach(el => {
            const perm = el.getAttribute('data-permission-section');
            el.style.display = window.hasPermission(perm) ? '' : 'none';
        });

        // Greeting
        const greeting = document.querySelector('.greeting');
        if (greeting && currentUser) {
            const roleDisplay = currentRole ? currentRole.replace('_', ' ').toUpperCase() : '';
            greeting.textContent = 'Welcome, ' + roleDisplay;
        }
    }

    // Auth state listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const result = await window.fetchUserPermissions(user.uid, user.email);
            currentRole = result.role;
            currentPermissions = result.permissions;
            console.log('Authenticated as ' + currentRole + ' (' + user.email + ')');
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

    // Expose helpers
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

    console.log('RBAC with auto-setup loaded');
});
