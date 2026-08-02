// ============================================
// js/app.js – Main Application Bootstrap
// ============================================

import { showToast, formatINR, formatDate } from './utils.js';
import { openModal, closeModal } from './modals.js';
import { generateReceipt } from './receipt.js';

// Import all services
import { subscribeStudents, addStudent, updateStudent, deleteStudent } from './services/studentService.js';
import { subscribeTeachers, addTeacher, updateTeacher, deleteTeacher } from './services/teacherService.js';
import { subscribeFees, addFee, updateFee, deleteFee } from './services/feeService.js';
import { subscribeSalaries, addSalary, updateSalary, deleteSalary } from './services/salaryService.js';
import { getSettings, saveSettings } from './services/settingsService.js';
import { logActivity } from './services/activityService.js';

// ============================================
// PAGE DETECTION & INITIALIZATION
// ============================================

const page = window.location.pathname.split('/').pop() || 'index.html';

// Export utilities globally for inline onclick use
window.showToast = showToast;
window.formatINR = formatINR;
window.formatDate = formatDate;
window.openModal = openModal;
window.closeModal = closeModal;
window.generateReceipt = generateReceipt;

// Export services globally
window.addStudent = addStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.addTeacher = addTeacher;
window.updateTeacher = updateTeacher;
window.deleteTeacher = deleteTeacher;
window.addFee = addFee;
window.updateFee = updateFee;
window.deleteFee = deleteFee;
window.addSalary = addSalary;
window.updateSalary = updateSalary;
window.deleteSalary = deleteSalary;
window.saveSettings = saveSettings;

// ---------- SIDEBAR TOGGLE (from previous script) ----------
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburgerBtn');
    const overlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = (sidebar && sidebar.classList.contains('open')) ? 'hidden' : '';
    }

    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', function() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 992 && sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ---------- PAGE-SPECIFIC INIT ----------
    switch(page) {
        case 'index.html':
            initDashboard();
            break;
        case 'students.html':
            initStudents();
            break;
        case 'teachers.html':
            initTeachers();
            break;
        case 'fees.html':
            initFees();
            break;
        case 'salary.html':
            initSalary();
            break;
        case 'reports.html':
            initReports();
            break;
        case 'settings.html':
            initSettings();
            break;
        default:
            console.log('Morning Glory ERP · Page loaded:', page);
    }
});

// ============================================
// DASHBOARD
// ============================================
function initDashboard() {
    // Stats
    subscribeStudents((students) => {
        document.getElementById('totalStudents').textContent = students.length;
        const total = students.reduce((sum, s) => sum + (s.fee || 0), 0);
        document.getElementById('feesCollected').textContent = formatINR(total);
    });
    subscribeTeachers((teachers) => {
        document.getElementById('totalTeachers').textContent = teachers.length;
        const total = teachers.reduce((sum, t) => sum + (t.baseSalary || 0), 0);
        document.getElementById('salaryPaid').textContent = formatINR(total);
    });

    // Fee Summary Table
    subscribeFees((fees) => {
        const tbody = document.getElementById('feeSummaryBody');
        if (!tbody) return;
        const filter = document.getElementById('feeFilter')?.value || 'all';
        let filtered = fees;
        if (filter !== 'all') {
            filtered = fees.filter(f => f.class === filter);
        }
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No fee records found.</td></tr>`;
            return;
        }
        let html = '';
        filtered.slice(0, 10).forEach(f => {
            const statusClass = f.status || 'unpaid';
            html += `
                <tr>
                    <td><strong>${f.studentName || 'N/A'}</strong></td>
                    <td>Class ${f.class || 'N/A'}</td>
                    <td>${formatINR(f.amount)}</td>
                    <td>${f.dueDate || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });

    // Recent Activities
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('activityList');
        if (!list) return;
        if (snapshot.empty) {
            list.innerHTML = `<li class="text-muted" style="padding:12px 0; color:var(--gray-400);">No recent activities.</li>`;
            return;
        }
        let html = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const time = data.timestamp ? formatDate(data.timestamp) : 'Just now';
            html += `<li><span class="activity-dot ${data.type || 'info'}"></span> ${data.message || ''} <span class="activity-time">${time}</span></li>`;
        });
        list.innerHTML = html;
    });
}

// ============================================
// STUDENTS PAGE
// ============================================
function initStudents() {
    const tbody = document.getElementById('studentsTableBody');
    const searchInput = document.getElementById('searchStudent');
    const classFilter = document.getElementById('classFilter');

    subscribeStudents((students) => {
        const search = searchInput?.value?.toLowerCase() || '';
        const cls = classFilter?.value || '';
        let filtered = students;
        if (search) filtered = filtered.filter(s => s.name?.toLowerCase().includes(search) || s.rollNo?.includes(search));
        if (cls) filtered = filtered.filter(s => s.class === cls);

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No students found.</td></tr>`;
            return;
        }
        let html = '';
        filtered.forEach(s => {
            const statusClass = s.status === 'active' ? 'paid' : 'inactive';
            html += `
                <tr>
                    <td>${s.rollNo || 'N/A'}</td>
                    <td><strong>${s.name || 'N/A'}</strong></td>
                    <td>Class ${s.class || 'N/A'}</td>
                    <td>${s.guardian || 'N/A'}</td>
                    <td>${s.contact || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${s.status || 'active'}</span></td>
                    <td>
                        <button class="btn-sm btn-primary" onclick="editStudent('${s.id}')">Edit</button>
                        <button class="btn-sm" style="background:#EF4444;color:#fff;" onclick="deleteStudent('${s.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });

    window.editStudent = async (id) => {
        // Fetch student data and populate modal
        // For brevity, we just open modal with a placeholder – you can expand
        openModal('studentModal');
        document.getElementById('studentId').value = id;
    };
}

// ============================================
// TEACHERS PAGE
// ============================================
function initTeachers() {
    const tbody = document.getElementById('teachersTableBody');
    subscribeTeachers((teachers) => {
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No teachers found.</td></tr>`;
            return;
        }
        let html = '';
        teachers.forEach(t => {
            html += `
                <tr>
                    <td>${t.teacherId || 'N/A'}</td>
                    <td><strong>${t.name || 'N/A'}</strong></td>
                    <td>${t.subject || 'N/A'}</td>
                    <td>${t.qualification || 'N/A'}</td>
                    <td>${t.contact || 'N/A'}</td>
                    <td><span class="status-badge ${t.status === 'active' ? 'paid' : 'inactive'}">${t.status || 'active'}</span></td>
                    <td>
                        <button class="btn-sm btn-primary">Edit</button>
                        <button class="btn-sm" style="background:#EF4444;color:#fff;">Delete</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
}

// ============================================
// FEES PAGE
// ============================================
function initFees() {
    const tbody = document.getElementById('feesTableBody');
    subscribeFees((fees) => {
        if (fees.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No fee records found.</td></tr>`;
            return;
        }
        let html = '';
        fees.forEach(f => {
            const statusClass = f.status || 'unpaid';
            html += `
                <tr>
                    <td>${f.studentName || 'N/A'}</td>
                    <td>Class ${f.class || 'N/A'}</td>
                    <td>${f.month || ''} ${f.year || ''}</td>
                    <td>${formatINR(f.amount)}</td>
                    <td>${f.dueDate || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                    <td>
                        <button class="btn-sm btn-primary" onclick="window.generateReceipt({ studentName: '${f.studentName}', class: '${f.class}', amount: ${f.amount}, month: '${f.month}', year: '${f.year}', dueDate: '${f.dueDate}', status: '${f.status}', receiptNo: '${f.id?.slice(0,6)}' })">Receipt</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
}

// ============================================
// SALARY PAGE
// ============================================
function initSalary() {
    const tbody = document.getElementById('salaryTableBody');
    subscribeSalaries((salaries) => {
        if (salaries.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No salary records found.</td></tr>`;
            return;
        }
        let html = '';
        salaries.forEach(s => {
            const statusClass = s.status === 'paid' ? 'paid' : 'unpaid';
            html += `
                <tr>
                    <td>${s.teacherName || 'N/A'}</td>
                    <td>${s.month || ''} ${s.year || ''}</td>
                    <td>${formatINR(s.amount)}</td>
                    <td>${s.paidDate || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${s.status || 'unpaid'}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
}

// ============================================
// REPORTS PAGE
// ============================================
function initReports() {
    subscribeFees((fees) => {
        const total = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const pending = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);
        document.querySelectorAll('.stat-value')[0].textContent = formatINR(total);
        document.querySelectorAll('.stat-value')[3].textContent = formatINR(pending);
    });
    subscribeSalaries((salaries) => {
        const total = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
        document.querySelectorAll('.stat-value')[1].textContent = formatINR(total);
        const balance = parseInt(document.querySelectorAll('.stat-value')[0].textContent.replace(/[₹,]/g,'')) - total;
        document.querySelectorAll('.stat-value')[2].textContent = formatINR(balance);
    });
}

// ============================================
// SETTINGS PAGE
// ============================================
async function initSettings() {
    const result = await getSettings();
    if (result.success) {
        const data = result.data;
        document.querySelectorAll('#settingsForm input').forEach(input => {
            const name = input.getAttribute('placeholder')?.toLowerCase() || '';
            if (data[name]) input.value = data[name];
        });
    }
    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => { data[key] = value; });
        const result = await saveSettings(data);
        if (result.success) showToast('Settings saved successfully!', 'success');
        else showToast('Error saving settings: ' + result.error, 'error');
    });
}
