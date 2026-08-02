// ============================================
//  ADVANCED STUDENT MANAGEMENT (Standalone)
//  Professional data table with search, filters,
//  sorting, pagination, bulk actions, and more.
//  Does NOT modify or break existing functionality.
// ============================================

(function() {
  // ---- State ----
  let allStudents = [];
  let filteredStudents = [];
  let currentPage = 1;
  let pageSize = 25;
  let sortField = 'name';
  let sortDirection = 'asc';
  let selectedStudents = new Set();
  let filters = {
    class: '',
    section: '',
    gender: '',
    status: '',
    year: ''
  };

  // ---- DOM References ----
  const el = {
    tableBody: document.getElementById('advancedStudentBody'),
    searchInput: document.getElementById('advancedSearch'),
    classFilter: document.getElementById('filterClass'),
    sectionFilter: document.getElementById('filterSection'),
    genderFilter: document.getElementById('filterGender'),
    statusFilter: document.getElementById('filterStatus'),
    yearFilter: document.getElementById('filterYear'),
    totalCount: document.getElementById('totalCount'),
    filteredCount: document.getElementById('filteredCount'),
    pageInfo: document.getElementById('pageInfo'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    selectAll: document.getElementById('selectAll'),
    bulkBar: document.getElementById('bulkActionsBar'),
    bulkCount: document.getElementById('bulkCount'),
    bulkDelete: document.getElementById('bulkDelete'),
    bulkStatus: document.getElementById('bulkStatus')
  };

  // ---- Helper: Get avatar color ----
  function getAvatarColor(name) {
    const colors = [
      '#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c',
      '#0d9488', '#4f46e5', '#9333ea', '#e11d48', '#16a34a',
      '#0369a1', '#65a30d', '#d97706', '#dc2626'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // ---- Helper: Get initials ----
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // ---- Helper: Get class order ----
  function getClassOrder(cls) {
    const order = { 'Nursery': 0, 'LKG': 1, 'UKG': 2 };
    const num = parseInt(cls);
    if (!isNaN(num)) return num + 2;
    return order[cls] !== undefined ? order[cls] : 999;
  }

  // ---- Helper: Format date ----
  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---- Helper: Get student fee status ----
  function getFeeStatus(studentId) {
    const fees = DataService.getFeesForStudent(studentId);
    const pending = fees.filter(f => f.status === 'pending');
    if (pending.length > 0) return 'pending';
    if (fees.length > 0 && pending.length === 0) return 'paid';
    return 'no-fees';
  }

  // ---- Populate filter dropdowns ----
  function populateFilters() {
    const students = DataService.getStudents();

    // Sections
    const sections = new Set();
    students.forEach(s => { if (s.section) sections.add(s.section); });
    const sectionSelect = el.sectionFilter;
    sectionSelect.innerHTML = '<option value="">All Sections</option>';
    Array.from(sections).sort().forEach(sec => {
      sectionSelect.innerHTML += `<option value="${sec}">${sec}</option>`;
    });

    // Years (from createdAt or current)
    const years = new Set();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear - 2);
    years.add(currentYear - 3);
    const yearSelect = el.yearFilter;
    yearSelect.innerHTML = '<option value="">All Years</option>';
    Array.from(years).sort((a, b) => b - a).forEach(yr => {
      yearSelect.innerHTML += `<option value="${yr}">${yr}</option>`;
    });
  }

  // ---- Get filter state ----
  function getFilters() {
    return {
      class: el.classFilter.value,
      section: el.sectionFilter.value,
      gender: el.genderFilter.value,
      status: el.statusFilter.value,
      year: el.yearFilter.value
    };
  }

  // ---- Apply filters ----
  function applyFilters() {
    const f = getFilters();
    const search = el.searchInput.value.toLowerCase().trim();

    filteredStudents = allStudents.filter(s => {
      // Search
      if (search) {
        const name = (s.name || '').toLowerCase();
        const roll = String(s.rollNo || '');
        const phone = (s.phone || '');
        const email = (s.email || '').toLowerCase();
        const cls = (s.class || '').toLowerCase();
        const match = name.includes(search) || roll.includes(search) ||
                      phone.includes(search) || email.includes(search) ||
                      cls.includes(search);
        if (!match) return false;
      }

      // Class filter
      if (f.class && s.class !== f.class) return false;

      // Section filter
      if (f.section && s.section !== f.section) return false;

      // Gender filter
      if (f.gender && s.gender !== f.gender) return false;

      // Status filter
      if (f.status) {
        const status = s.status || 'active';
        if (status !== f.status) return false;
      }

      // Year filter
      if (f.year) {
        const year = s.createdAt ? new Date(s.createdAt).getFullYear() : new Date().getFullYear();
        if (String(year) !== f.year) return false;
      }

      return true;
    });

    // Sort
    filteredStudents.sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'class':
          valA = getClassOrder(a.class);
          valB = getClassOrder(b.class);
          break;
        case 'section':
          valA = (a.section || '');
          valB = (b.section || '');
          break;
        case 'rollNo':
          valA = parseInt(a.rollNo) || 0;
          valB = parseInt(b.rollNo) || 0;
          break;
        case 'gender':
          valA = (a.gender || '');
          valB = (b.gender || '');
          break;
        case 'status':
          valA = (a.status || 'active');
          valB = (b.status || 'active');
          break;
        case 'year':
          valA = a.createdAt ? new Date(a.createdAt).getFullYear() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getFullYear() : 0;
          break;
        default:
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Reset page
    currentPage = 1;
    selectedStudents.clear();
    updateUI();
  }

  // ---- Render table ----
  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredStudents.length);
    const pageData = filteredStudents.slice(start, end);

    const tbody = el.tableBody;

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; color:var(--text-muted); padding: 60px 20px;">
            <div style="font-size:1.2rem; margin-bottom:8px;">No students found</div>
            <div style="font-size:14px;">Try adjusting your filters or add a new student.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageData.map((s, idx) => {
      const globalIdx = start + idx + 1;
      const isSelected = selectedStudents.has(s.id);
      const initials = getInitials(s.name);
      const avatarColor = getAvatarColor(s.name);
      const status = s.status || 'active';
      const feeStatus = getFeeStatus(s.id);
      const year = s.createdAt ? new Date(s.createdAt).getFullYear() : '—';

      let feeBadge = '';
      if (feeStatus === 'paid') {
        feeBadge = `<span class="badge badge-paid">Paid</span>`;
      } else if (feeStatus === 'pending') {
        feeBadge = `<span class="badge badge-pending">Pending</span>`;
      } else {
        feeBadge = `<span class="badge" style="background:#f1f5f9;color:var(--text-muted);">No fees</span>`;
      }

      return `
        <tr class="${isSelected ? 'selected' : ''}">
          <td><input type="checkbox" class="student-checkbox" data-id="${s.id}" ${isSelected ? 'checked' : ''}></td>
          <td>${globalIdx}</td>
          <td>
            <div class="student-cell">
              <div class="student-avatar small" style="background:${avatarColor};">${initials}</div>
              <span class="student-name">${s.name}</span>
            </div>
          </td>
          <td>${s.class || '—'}</td>
          <td>${s.section || '—'}</td>
          <td>${s.rollNo || '—'}</td>
          <td>${s.gender || '—'}</td>
          <td>
            <span class="status-badge ${status}">
              <span class="dot"></span>
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
          <td>${year}</td>
          <td>${feeBadge}</td>
          <td>
            <div class="actions-cell">
              <a href="profile.html?id=${s.id}" class="btn btn-primary btn-sm" title="View Profile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </a>
              <button class="btn btn-primary btn-sm" onclick="editStudent('${s.id}')" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn btn-success btn-sm" onclick="openSmartFeeModalFromStudent('${s.id}')" title="Collect Fee">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudentWithConfirm('${s.id}')" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ---- Update UI (stats, pagination, bulk bar) ----
  function updateUI() {
    const total = allStudents.length;
    const filtered = filteredStudents.length;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filtered);
    const totalPages = Math.ceil(filtered / pageSize) || 1;

    // Stats
    el.totalCount.textContent = total;
    el.filteredCount.textContent = filtered;

    // Page info
    if (filtered === 0) {
      el.pageInfo.textContent = '0 students';
    } else {
      el.pageInfo.textContent = `Showing ${start}–${end} of ${filtered}`;
    }

    // Pagination buttons
    el.prevPage.disabled = currentPage <= 1;
    el.nextPage.disabled = currentPage >= totalPages;

    // Bulk bar
    const selectedCount = selectedStudents.size;
    if (selectedCount > 0) {
      el.bulkBar.classList.add('visible');
      el.bulkCount.textContent = `${selectedCount} student${selectedCount > 1 ? 's' : ''} selected`;
    } else {
      el.bulkBar.classList.remove('visible');
    }

    // Select all checkbox
    const visibleIds = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(s => s.id);
    const allVisibleSelected = visibleIds.every(id => selectedStudents.has(id));
    el.selectAll.checked = visibleIds.length > 0 && allVisibleSelected;

    renderTable();
  }

  // ---- Handle sort ----
  function handleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    applyFilters();
  }

  // ---- Handle checkbox ----
  function handleCheckbox(e) {
    const checkbox = e.target.closest('.student-checkbox');
    if (!checkbox) return;
    const id = checkbox.dataset.id;
    if (checkbox.checked) {
      selectedStudents.add(id);
    } else {
      selectedStudents.delete(id);
    }
    updateUI();
  }

  // ---- Handle select all ----
  function handleSelectAll(e) {
    const checked = e.target.checked;
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredStudents.length);
    const pageData = filteredStudents.slice(start, end);

    pageData.forEach(s => {
      if (checked) {
        selectedStudents.add(s.id);
      } else {
        selectedStudents.delete(s.id);
      }
    });
    updateUI();
  }

  // ---- Bulk delete ----
  async function bulkDeleteSelected() {
    if (selectedStudents.size === 0) return;
    if (!confirm(`Delete ${selectedStudents.size} selected student(s) permanently?`)) return;

    const ids = Array.from(selectedStudents);
    for (let id of ids) {
      await DataService.deleteStudent(id);
    }
    selectedStudents.clear();
    showToast(`${ids.length} student(s) deleted successfully`, 'success');
  }

  // ---- Bulk status update ----
  async function bulkUpdateStatus(status) {
    if (selectedStudents.size === 0) return;
    if (!confirm(`Update ${selectedStudents.size} student(s) to "${status}"?`)) return;

    const ids = Array.from(selectedStudents);
    for (let id of ids) {
      const student = DataService.getStudentById(id);
      if (student) {
        await DataService.updateStudent({ ...student, status });
      }
    }
    selectedStudents.clear();
    showToast(`${ids.length} student(s) updated to ${status}`, 'success');
  }

  // ---- Export functions to global ----
  window.editStudent = function(id) {
    const student = DataService.getStudentById(id);
    if (!student) return;
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentClass').value = student.class;
    document.getElementById('studentSection').value = student.section;
    document.getElementById('studentRoll').value = student.rollNo;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone;
    document.getElementById('studentAddress').value = student.address || '';
    document.getElementById('studentGender').value = student.gender || '';
    document.getElementById('studentStatus').value = student.status || 'active';
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('saveStudentBtn').textContent = 'Update';
    openModal('addStudentModal');
  };

  window.deleteStudentWithConfirm = function(id) {
    const student = DataService.getStudentById(id);
    if (!student) return;
    if (confirm(`Delete "${student.name}" permanently? This will also delete all their fee records.`)) {
      DataService.deleteStudent(id);
      showToast(`Student "${student.name}" deleted`, 'info');
    }
  };

  window.openSmartFeeModalFromStudent = function(studentId) {
    if (typeof openSmartFeeModal === 'function') {
      openSmartFeeModal();
      setTimeout(() => {
        const select = document.getElementById('smartFeeStudent');
        if (select) {
          select.value = studentId;
          select.dispatchEvent(new Event('change'));
        }
      }, 100);
    } else {
      showToast('Smart Fee Collection is not loaded', 'error');
    }
  };

  // ---- Event listeners ----
  document.addEventListener('DOMContentLoaded', function() {
    // Search
    el.searchInput.addEventListener('input', applyFilters);

    // Filters
    el.classFilter.addEventListener('change', applyFilters);
    el.sectionFilter.addEventListener('change', applyFilters);
    el.genderFilter.addEventListener('change', applyFilters);
    el.statusFilter.addEventListener('change', applyFilters);
    el.yearFilter.addEventListener('change', applyFilters);

    // Sorting
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', function() {
        const field = this.dataset.sort;
        handleSort(field);
      });
    });

    // Pagination
    el.prevPage.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        updateUI();
      }
    });
    el.nextPage.addEventListener('click', function() {
      const totalPages = Math.ceil(filteredStudents.length / pageSize);
      if (currentPage < totalPages) {
        currentPage++;
        updateUI();
      }
    });
    el.pageSizeSelect.addEventListener('change', function() {
      pageSize = parseInt(this.value);
      currentPage = 1;
      applyFilters();
    });

    // Checkbox (delegated)
    el.tableBody.addEventListener('change', handleCheckbox);

    // Select all
    el.selectAll.addEventListener('change', handleSelectAll);

    // Bulk actions
    el.bulkDelete.addEventListener('click', bulkDeleteSelected);
    el.bulkStatus.addEventListener('click', function() {
      const currentStatus = document.getElementById('bulkStatusSelect')?.value || 'active';
      bulkUpdateStatus(currentStatus);
    });

    // Also listen for data changes
    window.addEventListener('dataChanged', function() {
      const students = DataService.getStudents();
      allStudents = students;
      populateFilters();
      applyFilters();
    });

    // Initial load
    setTimeout(() => {
      const students = DataService.getStudents();
      allStudents = students;
      populateFilters();
      applyFilters();
    }, 200);
  });
})();
