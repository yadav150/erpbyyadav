// ============================================
//  GLOBAL STUDENT SEARCH (UPDATED - Navigates to profile page)
//  Fully standalone module.
//  Does NOT modify or break script.js, students.js, or fees.js.
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

  // ===== UPDATED: Navigate to profile page instead of modal =====
  function handleResultClick(e) {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const studentId = item.dataset.id;
    if (studentId) {
      // Close dropdown
      document.getElementById('globalSearchResults')?.classList.remove('active');
      document.getElementById('globalSearchInput').value = '';
      // Navigate to profile page
      window.location.href = `profile.html?id=${studentId}`;
    }
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

    // Ensure dropdown closes when any modal opens
    document.addEventListener('click', function(e) {
      if (e.target.closest('[onclick*="openModal"]')) {
        results.classList.remove('active');
      }
    });
  });
})();
