// ============================================
// js/auth-rbac.js – Authentication & RBAC
// Extends global – no existing logic replaced
// ============================================

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', function() {

    // ---------- Permission Map (URL -> Permission Key) ----------
    const pagePermissionMap = {
        'index.html': 'dashboard',
        'students.html': 'student_management',
        'teachers.html': 'student_management',
        'fees.html': 'fee_management',
        'salary.html': 'fee_management',
        'reports.html': 'reports',
        'settings.html': 'settings',
        'login.html': null,        // public
        'access-denied.html': null // public
    };

    // ---------- Default Roles & Permissions (fallback) ----------
    const defaultPermissions = {
        'super_admin': {
            dashboard: true,
            student_management: true,
            fee_management: true,
            receipt_management: true,
            activity_logs: true,
            reports: true,
            settings: true,
            user_management: true
        },
        'admin': {
            dashboard: true,
            student_management: true,
            fee_management: true,
            receipt_management: true,
            activity_logs: true,
            reports: true,
            settings: true,
            user_management: false
        },
        'accountant': {
            dashboard: true,
            student_management: false,
            fee_management: true,
            receipt_management: true,
            activity_logs: true,
            reports: true,
            settings: false,
            user_management: false
        },
        'teacher': {
            dashboard: true,
            student_management: true,
            fee_management: false,
            receipt_management: false,
            activity_logs: true,
            reports: false,
            settings: false,
            user_management: false
        },
        'staff': {
            dashboard: true,
            student_management: false,
            fee_management: false,
            receipt_management: false,
            activity_logs: true,
            reports: false,
            settings: false,
            user_management: false
        }
    };

    // ---------- State ----------
    let currentUser = null;
    let currentRole = null;
    let currentPermissions = {};

    // ---------- DOM Helpers ----------
    const getCurrentPage = () => {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return path;
    };

    // ---------- Fetch User Role & Permissions from Firebase ----------
    async function fetchUserPermissions(uid) {
        try {
            // 1. Get user document
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                console.warn('User document not found. Assigning default role.');
                return { role: 'staff', permissions: defaultPermissions['staff'] };
            }

            const userData = userSnap.data();
            const role = userData.role || 'staff';

            // 2. Get role document (for dynamic permissions)
            const roleDocRef = doc(db, 'roles', role);
            const roleSnap = await getDoc(roleDocRef);
            let permissions = {};

            if (roleSnap.exists()) {
                permissions = roleSnap.data().permissions || {};
            } else {
                // Fallback to default if role document not found
                permissions = defaultPermissions[role] || defaultPermissions['staff'];
                // Optionally create the role document for future updates
                try {
                    await setDoc(roleDocRef, { permissions });
                    console.log(`Created role document for "${role}" with default permissions.`);
                } catch (e) { /* ignore */ }
            }

            return { role, permissions };
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            // Fallback to staff
            return { role: 'staff', permissions: defaultPermissions['staff'] };
        }
    }

    // ---------- Check if User Has Permission ----------
    function hasPermission(permissionKey) {
        if (!currentUser) return false;
        // Super admin override
        if (currentRole === 'super_admin') return true;
        return !!currentPermissions[permissionKey];
    }

    // ---------- Apply Permissions to UI ----------
    function applyPermissionsToUI() {
        const currentPage = getCurrentPage();
        const requiredPerm = pagePermissionMap[currentPage];

        // 1. Page access control
        if (requiredPerm && !hasPermission(requiredPerm)) {
            // Redirect if not on login/denied page and doesn't have access
            if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
                window.location.href = 'access-denied.html';
                return;
            }
        }

        // 2. Hide/show sidebar links based on permissions
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const pageKey = href.split('/').pop();
            const perm = pagePermissionMap[pageKey];
            // Always show dashboard? We'll hide if permission is false.
            if (perm) {
                if (hasPermission(perm)) {
                    link.style.display = 'flex';
                } else {
                    link.style.display = 'none';
                }
            } else {
                // Public pages like login/denied aren't in sidebar anyway
                link.style.display = 'flex';
            }
        });

        // 3. Hide/show action buttons (e.g. "Add Student", "Collect Fees")
        // We'll use data-permission attributes on buttons
        document.querySelectorAll('[data-permission]').forEach(el => {
            const perm = el.getAttribute('data-permission');
            if (hasPermission(perm)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // 4. Hide/show entire sections (cards, stats) if needed
        document.querySelectorAll('[data-permission-section]').forEach(el => {
            const perm = el.getAttribute('data-permission-section');
            if (hasPermission(perm)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // 5. Update greeting with role
        const greeting = document.querySelector('.greeting');
        if (greeting && currentUser) {
            const roleDisplay = currentRole ? currentRole.replace('_', ' ').toUpperCase() : '';
            greeting.textContent = `Welcome, ${roleDisplay}`;
        }
    }

    // ---------- Login Function ----------
    window.loginUser = async function(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    // ---------- Logout Function ----------
    window.logoutUser = async function() {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // ---------- Auth State Listener ----------
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const result = await fetchUserPermissions(user.uid);
            currentRole = result.role;
            currentPermissions = result.permissions;
            console.log(`Authenticated as ${currentRole} (${user.email})`);

            // Apply permissions to UI
            applyPermissionsToUI();

            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('auth-state-ready', {
                detail: { user, role: currentRole, permissions: currentPermissions }
            }));

        } else {
            currentUser = null;
            currentRole = null;
            currentPermissions = {};

            const currentPage = getCurrentPage();
            // Redirect to login if not on public pages
            if (currentPage !== 'login.html' && currentPage !== 'access-denied.html') {
                window.location.href = 'login.html';
            }
        }
    });

    // ---------- Expose RBAC helpers globally ----------
    window.hasPermission = hasPermission;
    window.getCurrentRole = () => currentRole;
    window.getCurrentUser = () => currentUser;
    window.refreshPermissions = async () => {
        if (currentUser) {
            const result = await fetchUserPermissions(currentUser.uid);
            currentRole = result.role;
            currentPermissions = result.permissions;
            applyPermissionsToUI();
        }
    };

    // Re-apply permissions on page load (for non-SPA navigation)
    document.addEventListener('DOMContentLoaded', function() {
        // If user already loaded, apply
        if (currentUser) {
            applyPermissionsToUI();
        }
    });

    // Also reapply when browser back/forward triggers
    window.addEventListener('pageshow', function() {
        if (currentUser) {
            applyPermissionsToUI();
        }
    });

    console.log('RBAC module loaded successfully');
});
