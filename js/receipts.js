// ============================================
//  RECEIPT MANAGEMENT MODULE (Standalone)
//  Professional receipt management with search,
//  filters, sorting, pagination, and settings.
//  Does NOT modify or break existing functionality.
// ============================================

(function() {
  // ---- State ----
  let allReceipts = [];
  let filteredReceipts = [];
  let currentPage = 1;
  let pageSize = 25;
  let sortField = 'date';
  let sortDirection = 'desc';
  let receiptSettings = {};

  // ---- DOM References ----
  const el = {
    tableBody: document.getElementById('receiptTableBody'),
    searchInput: document.getElementById('receiptSearch'),
    statusFilter: document.getElementById('receiptStatusFilter'),
    dateFilter: document.getElementById('receiptDateFilter'),
    totalCount: document.getElementById('receiptTotalCount'),
    filteredCount: document.getElementById('receiptFilteredCount'),
    pageInfo: document.getElementById('receiptPageInfo'),
    prevPage: document.getElementById('receiptPrevPage'),
    nextPage: document.getElementById('receiptNextPage'),
    pageSizeSelect: document.getElementById('receiptPageSizeSelect')
  };

  // ---- Helper: Format date ----
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---- Helper: Get student name ----
  function getStudentName(studentId) {
    const student = DataService.getStudentById(studentId);
    return student ? student.name : 'Unknown Student';
  }

  // ---- Helper: Get student class ----
  function getStudentClass(studentId) {
    const student = DataService.getStudentById(studentId);
    return student ? `${student.class}-${student.section}` : '—';
  }

  // ---- Load receipt settings from Firebase ----
  function loadReceiptSettings() {
    firebase.database().ref('receiptSettings').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        receiptSettings = data;
      } else {
        // Set defaults
        receiptSettings = {
          schoolName: 'Yadav School ERP',
          schoolAddress: '123 Education Street, City, State',
          contactNumber: '+91 9876543210',
          email: 'info@yadavschool.edu',
          website: 'www.yadavschool.edu',
          receiptTitle: 'Payment Receipt',
          footerText: 'Thank you for your payment. This is a system-generated receipt.'
        };
        // Save defaults to Firebase
        firebase.database().ref('receiptSettings').set(receiptSettings);
      }
    });
  }

  // ---- Get all receipts from fees ----
  function getAllReceipts() {
    const fees = DataService.getAllFees();
    const receipts = [];

    fees.forEach(f => {
      if (f.status === 'paid' && f.receiptNo) {
        receipts.push({
          id: f.id,
          receiptNo: f.receiptNo,
          studentId: f.studentId,
          amount: f.amount,
          date: f.paidDate,
          status: f.status || 'paid'
        });
      }
    });

    return receipts;
  }

  // ---- Apply filters and sorting ----
  function applyFilters() {
    const search = el.searchInput.value.toLowerCase().trim();
    const statusFilter = el.statusFilter.value;
    const dateFilter = el.dateFilter.value;

    filteredReceipts = allReceipts.filter(r => {
      // Search
      if (search) {
        const student = DataService.getStudentById(r.studentId);
        const name = (student ? student.name : '').toLowerCase();
        const receiptNo = (r.receiptNo || '').toLowerCase();
        const amount = String(r.amount);
        if (!name.includes(search) && !receiptNo.includes(search) && !amount.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && r.status !== statusFilter) return false;

      // Date filter
      if (dateFilter) {
        const date = new Date(r.date);
        const now = new Date();
        let startDate;
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            startDate = null;
        }
        if (startDate && date < startDate) return false;
      }

      return true;
    });

    // Sort
    filteredReceipts.sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case 'receiptNo':
          valA = a.receiptNo || '';
          valB = b.receiptNo || '';
          break;
        case 'student':
          valA = getStudentName(a.studentId).toLowerCase();
          valB = getStudentName(b.studentId).toLowerCase();
          break;
        case 'amount':
          valA = a.amount || 0;
          valB = b.amount || 0;
          break;
        case 'date':
          valA = a.date || '';
          valB = b.date || '';
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        default:
          valA = a.date || '';
          valB = b.date || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Reset page
    currentPage = 1;
    updateUI();
  }

  // ---- Render table ----
  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filteredReceipts.length);
    const pageData = filteredReceipts.slice(start, end);

    const tbody = el.tableBody;

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color:var(--text-muted); padding: 60px 20px;">
            <div style="font-size:1.2rem; margin-bottom:8px;">No receipts found</div>
            <div style="font-size:14px;">Try adjusting your filters or record a payment.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageData.map((r, idx) => {
      const globalIdx = start + idx + 1;
      const studentName = getStudentName(r.studentId);
      const studentClass = getStudentClass(r.studentId);
      const statusClass = r.status === 'paid' ? 'paid' : 'void';

      return `
        <tr>
          <td>${globalIdx}</td>
          <td><strong>${r.receiptNo}</strong></td>
          <td>${studentName}</td>
          <td>${studentClass}</td>
          <td style="text-align:right;">${formatCurrency(r.amount)}</td>
          <td>${formatDate(r.date)}</td>
          <td>
            <span class="receipt-status ${statusClass}">
              <span class="dot"></span>
              ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
          </td>
          <td>
            <div class="receipt-actions-cell">
              <button class="btn btn-primary btn-sm" onclick="viewReceipt('${r.id}')" title="View">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button class="btn btn-success btn-sm" onclick="printReceipt('${r.id}')" title="Print">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M18 9H6"/>
                  <rect x="6" y="14" width="12" height="8"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/>
                </svg>
              </button>
              <button class="btn btn-outline-secondary btn-sm" onclick="downloadReceiptPDF('${r.id}')" title="Download PDF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button class="btn btn-danger btn-sm" onclick="voidReceipt('${r.id}')" title="Void">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ---- Update UI ----
  function updateUI() {
    const total = allReceipts.length;
    const filtered = filteredReceipts.length;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filtered);
    const totalPages = Math.ceil(filtered / pageSize) || 1;

    el.totalCount.textContent = total;
    el.filteredCount.textContent = filtered;

    if (filtered === 0) {
      el.pageInfo.textContent = '0 receipts';
    } else {
      el.pageInfo.textContent = `Showing ${start}–${end} of ${filtered}`;
    }

    el.prevPage.disabled = currentPage <= 1;
    el.nextPage.disabled = currentPage >= totalPages;

    renderTable();
  }

  // ---- Handle sorting ----
  function handleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
    applyFilters();
  }

  // ---- View Receipt ----
  window.viewReceipt = function(feeId) {
    const fee = DataService.getAllFees().find(f => f.id === feeId);
    if (!fee) {
      showToast('Receipt not found', 'error');
      return;
    }
    showReceiptModal(fee);
  };

  // ---- Print Receipt ----
  window.printReceipt = function(feeId) {
    const fee = DataService.getAllFees().find(f => f.id === feeId);
    if (!fee) {
      showToast('Receipt not found', 'error');
      return;
    }
    showReceiptModal(fee, true);
  };

  // ---- Download Receipt as PDF ----
  window.downloadReceiptPDF = function(feeId) {
    const fee = DataService.getAllFees().find(f => f.id === feeId);
    if (!fee) {
      showToast('Receipt not found', 'error');
      return;
    }
    showReceiptModal(fee, false, true);
  };

  // ---- Void Receipt ----
  window.voidReceipt = function(feeId) {
    if (!confirm('Are you sure you want to void this receipt? This action cannot be undone.')) return;

    const fee = DataService.getAllFees().find(f => f.id === feeId);
    if (!fee) {
      showToast('Receipt not found', 'error');
      return;
    }

    // Update status to void
    fee.status = 'void';
    firebase.database().ref('fees/' + feeId).update({ status: 'void' })
      .then(() => {
        showToast('Receipt voided successfully', 'info');
        // Refresh data
        setTimeout(() => {
          allReceipts = getAllReceipts();
          applyFilters();
        }, 500);
      })
      .catch(() => {
        showToast('Failed to void receipt', 'error');
      });
  };

  // ---- Show Receipt Modal ----
  function showReceiptModal(fee, autoPrint = false, downloadPDF = false) {
    const student = DataService.getStudentById(fee.studentId);
    if (!student) {
      showToast('Student not found', 'error');
      return;
    }

    const settings = receiptSettings;
    const content = document.getElementById('receiptPreviewContent');
    const modal = document.getElementById('receiptPreviewModal');

    content.innerHTML = `
      <div class="receipt-preview-container" id="receiptPrintArea">
        <div class="receipt-header">
          <h2>${settings.schoolName || 'Yadav School ERP'}</h2>
          <div class="school-details">
            ${settings.schoolAddress || ''}<br>
            ${settings.contactNumber || ''} | ${settings.email || ''} | ${settings.website || ''}
          </div>
          <h3 style="margin-top:12px; color:var(--accent-color);">${settings.receiptTitle || 'Payment Receipt'}</h3>
        </div>
        <div class="receipt-details">
          <div class="detail-item">
            <span class="label">Receipt No</span>
            <span class="value">${fee.receiptNo}</span>
          </div>
          <div class="detail-item">
            <span class="label">Date</span>
            <span class="value">${formatDate(fee.paidDate)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Student</span>
            <span class="value">${student.name}</span>
          </div>
          <div class="detail-item">
            <span class="label">Class</span>
            <span class="value">${student.class}-${student.section}</span>
          </div>
          <div class="detail-item">
            <span class="label">Roll No</span>
            <span class="value">${student.rollNo}</span>
          </div>
        </div>
        <div class="receipt-items">
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align:right;">Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Tuition Fee</td>
                <td style="text-align:right;">${formatCurrency(fee.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="receipt-total">
          Total: ${formatCurrency(fee.amount)}
        </div>
        <div class="receipt-footer">
          ${settings.footerText || 'Thank you for your payment. This is a system-generated receipt.'}
          <br><br>
          <span style="font-size:11px; color:var(--text-muted);">Generated by Yadav School ERP</span>
        </div>
      </div>
    `;

    openModal('receiptPreviewModal');

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }

    if (downloadPDF) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }

  // ---- Event Listeners ----
  document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    loadReceiptSettings();

    // Search
    el.searchInput.addEventListener('input', applyFilters);

    // Filters
    el.statusFilter.addEventListener('change', applyFilters);
    el.dateFilter.addEventListener('change', applyFilters);

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
      const totalPages = Math.ceil(filteredReceipts.length / pageSize);
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

    // Listen for data changes
    window.addEventListener('dataChanged', function() {
      allReceipts = getAllReceipts();
      applyFilters();
    });

    // Initial load
    setTimeout(() => {
      allReceipts = getAllReceipts();
      applyFilters();
    }, 200);
  });
})();
