// ============================================
//  GLOBAL STUDENT SEARCH (Standalone Module)
//  Extends existing functionality without
//  modifying or breaking any existing JS.
// ============================================

(function() {
  let searchTimeout = null;

  function getSearchQuery() {
    return document.getElementById('globalSearchInput')?.value?.trim() || '';
  }

  function renderResults(students) {
    const container = document.getElementById('globalSearchResults');
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = `<div class="search-no-result">No student found</div>`;
      container.classList.add('active');
      return;
    }

    container.innerHTML = students.map(s => `
      <div class="search-result-item" data-id="${s.id}">
        <div class="details">
          <span class="name">${s.name}</span>
          <span class="meta">Class ${s.class} | Roll No: ${s.rollNo} | ${s.phone || ''}</span>
        </div>
        <span style="color:var(--text-muted);font-size:12px;">View Profile →</span>
      </div>
    `).join('');
    container.classList.add('active');
  }

  function performSearch() {
    const query = getSearchQuery().toLowerCase();
    const container = document.getElementById('globalSearchResults');
    if (!container) return;

    if (query.length === 0) {
      container.classList.remove('active');
      return;
    }

    // Get students from the existing DataService (Firebase)
    const students = DataService.getStudents();
    const filtered = students.filter(s => {
      const name = (s.name || '').toLowerCase();
      const roll = String(s.rollNo || '');
      const phone = (s.phone || '');
      const cls = (s.class || '').toLowerCase();
      return name.includes(query) ||
             roll.includes(query) ||
             phone.includes(query) ||
             cls.includes(query);
    });

    renderResults(filtered);
  }

  function handleSearch(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300); // Debounce for performance
  }

  function handleResultClick(e) {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const studentId = item.dataset.id;
    const student = DataService.getStudentById(studentId);
    if (student) {
      // Close dropdown
      document.getElementById('globalSearchResults')?.classList.remove('active');
      document.getElementById('globalSearchInput').value = '';
      // Show profile modal
      showStudentProfile(student);
    }
  }

  function showStudentProfile(student) {
    const modal = document.getElementById('studentProfileModal');
    const content = document.getElementById('studentProfileContent');
    if (!modal || !content) return;

    // Fetch fees for this student
    const fees = DataService.getFeesForStudent(student.id);
    const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const pending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);

    content.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div><strong>Name:</strong> ${student.name}</div>
        <div><strong>Class:</strong> ${student.class}</div>
        <div><strong>Section:</strong> ${student.section}</div>
        <div><strong>Roll No:</strong> ${student.rollNo}</div>
        <div><strong>Email:</strong> ${student.email}</div>
        <div><strong>Phone:</strong> ${student.phone}</div>
        <div style="grid-column: span 2;"><strong>Address:</strong> ${student.address || '—'}</div>
        <div style="grid-column: span 2; border-top:1px solid var(--border-color); padding-top:12px;">
          <strong>Fee Summary:</strong><br>
          Total Paid: ${formatCurrency(totalPaid)} | Pending: ${formatCurrency(pending)}
        </div>
      </div>
    `;
    openModal('studentProfileModal');
  }

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('globalSearchResults');

    if (!input || !results) return;

    // Live search on input
    input.addEventListener('input', handleSearch);

    // Click on result items
    results.addEventListener('click', handleResultClick);

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.search-container')) {
        results.classList.remove('active');
      }
    });

    // Close dropdown on Escape key
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      }
    });

    // Ensure dropdown closes when modal opens
    document.addEventListener('click', function(e) {
      if (e.target.closest('[onclick*="openModal"]')) {
        results.classList.remove('active');
      }
    });
  });
})();
