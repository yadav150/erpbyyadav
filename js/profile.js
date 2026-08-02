// ============================================
//  STUDENT PROFILE PAGE LOGIC (Standalone)
//  Extends existing functionality without
//  modifying or breaking any existing JS.
// ============================================

(function() {
  let currentStudentId = null;

  function getStudentIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function renderProfile(student) {
    if (!student) {
      document.getElementById('profileData').innerHTML = `
        <div class="card" style="text-align:center; padding:60px 20px;">
          <h3 style="color:#e11d48;">Student Not Found</h3>
          <p style="color:var(--text-muted);">The student you are looking for does not exist or has been removed.</p>
          <br>
          <a href="students.html" class="btn btn-primary">Back to Students</a>
        </div>
      `;
      document.getElementById('profileData').style.display = 'block';
      document.getElementById('loadingState').style.display = 'none';
      return;
    }

    const fees = DataService.getFeesForStudent(student.id);
    const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
    const recentFees = fees.slice(-5).reverse();

    // Get first letter for avatar
    const initial = student.name ? student.name.charAt(0).toUpperCase() : '?';

    const html = `
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <div class="profile-info">
          <h2>${student.name}</h2>
          <div class="subtitle">${student.class} - ${student.section} | Roll No: ${student.rollNo}</div>
          <div style="margin-top:4px; font-size:13px; color:var(--text-muted);">
            ${student.email} · ${student.phone}
          </div>
        </div>
        <div class="profile-actions">
          <button class="btn btn-primary" onclick="editStudentFromProfile('${student.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn btn-success" onclick="openCollectFee('${student.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Collect Fee
          </button>
          <a href="students.html" class="btn btn-outline-secondary">
            ← Back
          </a>
        </div>
      </div>

      <!-- Personal Details -->
      <div class="profile-section card">
        <div class="section-title">Personal Details</div>
        <div class="profile-grid">
          <div class="item">
            <div class="label">Full Name</div>
            <div class="value">${student.name}</div>
          </div>
          <div class="item">
            <div class="label">Class</div>
            <div class="value">${student.class}</div>
          </div>
          <div class="item">
            <div class="label">Section</div>
            <div class="value">${student.section}</div>
          </div>
          <div class="item">
            <div class="label">Roll Number</div>
            <div class="value">${student.rollNo}</div>
          </div>
          <div class="item">
            <div class="label">Email</div>
            <div class="value">${student.email}</div>
          </div>
          <div class="item">
            <div class="label">Phone</div>
            <div class="value">${student.phone}</div>
          </div>
          <div class="item" style="grid-column: 1 / -1;">
            <div class="label">Address</div>
            <div class="value">${student.address || '—'}</div>
          </div>
        </div>
      </div>

      <!-- Fee Summary -->
      <div class="profile-section card">
        <div class="section-title">Fee Summary</div>
        <div class="fee-summary-cards">
          <div class="stat-card">
            <div class="number" style="color:var(--accent-color);">${formatCurrency(totalPaid)}</div>
            <div class="label">Total Paid</div>
          </div>
          <div class="stat-card">
            <div class="number" style="color:#e11d48;">${formatCurrency(totalPending)}</div>
            <div class="label">Total Pending</div>
          </div>
          <div class="stat-card">
            <div class="number">${fees.length}</div>
            <div class="label">Total Transactions</div>
          </div>
        </div>
      </div>

      <!-- Fee History / Recent Activity -->
      <div class="profile-section card">
        <div class="section-title">
          <span>Fee History</span>
          <span style="font-size:13px; font-weight:400; color:var(--text-muted);">Recent 5 transactions</span>
        </div>
        ${fees.length === 0 ? `
          <div style="text-align:center; color:var(--text-muted); padding:20px;">
            No fee records found for this student.
          </div>
        ` : `
          <div style="margin-bottom:16px;">
            ${recentFees.map(f => `
              <div class="receipt-item">
                <div class="receipt-info">
                  <span class="receipt-no">${f.receiptNo || '—'}</span>
                  <span class="receipt-date">${f.paidDate || 'Pending'}</span>
                  <span style="font-weight:500;">${formatCurrency(f.amount)}</span>
                  <span class="badge ${f.status === 'paid' ? 'badge-paid' : 'badge-pending'}">${f.status}</span>
                </div>
                <div class="receipt-actions">
                  ${f.status === 'paid' && f.receiptNo ? `
                    <button class="btn btn-outline-secondary btn-sm" onclick="viewReceipt('${f.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 6 2 18 2 18 9"/>
                        <path d="M18 9H6"/>
                        <rect x="6" y="14" width="12" height="8"/>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/>
                      </svg>
                      Receipt
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById('profileData').innerHTML = html;
    document.getElementById('profileData').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
  }

  // ========== EXPOSE FUNCTIONS TO GLOBAL SCOPE ==========
  
  // Edit student from profile page (reuses existing edit logic)
  window.editStudentFromProfile = function(studentId) {
    const student = DataService.getStudentById(studentId);
    if (!student) return;
    
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentClass').value = student.class;
    document.getElementById('studentSection').value = student.section;
    document.getElementById('studentRoll').value = student.rollNo;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phone;
    document.getElementById('studentAddress').value = student.address || '';
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('saveStudentBtn').textContent = 'Update';
    openModal('addStudentModal');
  };

  // Open collect fee modal
  window.openCollectFee = function(studentId) {
    document.getElementById('feeStudentId').value = studentId;
    document.getElementById('feeAmount').value = '';
    openModal('collectFeeModal');
  };

  // View receipt from profile
  window.viewReceipt = function(feeId) {
    const fees = DataService.getAllFees();
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;
    
    const student = DataService.getStudentById(fee.studentId);
    if (!student) return;

    const content = document.getElementById('receiptContent');
    content.innerHTML = `
      <div class="receipt-container" id="receiptPrintArea">
        <div class="header">
          <h2>Yadav School ERP</h2>
          <p style="color: var(--text-muted);">Payment Receipt</p>
        </div>
        <div class="details">
          <div><strong>Receipt No:</strong> ${fee.receiptNo}</div>
          <div><strong>Date:</strong> ${fee.paidDate}</div>
        </div>
        <div style="margin-bottom: 20px;">
          <p><strong>Student:</strong> ${student.name} (${student.class}-${student.section})</p>
          <p><strong>Email:</strong> ${student.email}</p>
        </div>
        <div class="items">
          <table>
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Tuition Fee</td><td>${formatCurrency(fee.amount)}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="total">Total: ${formatCurrency(fee.amount)}</div>
        <div class="footer-note">This is a system‑generated receipt. Thank you!</div>
      </div>
    `;
    openModal('receiptModal');
  };

  // Handle fee form submission
  document.getElementById('feeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const studentId = document.getElementById('feeStudentId').value;
    const amount = parseFloat(document.getElementById('feeAmount').value);

    if (!studentId) {
      alert('Student ID missing. Please try again.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const receiptNo = generateReceiptNumber();
    const paidDate = getTodayDate();

    const feeRecord = {
      studentId,
      amount,
      paidDate,
      receiptNo,
      status: 'paid'
    };

    await DataService.addFeeRecord(feeRecord);
    closeModal('collectFeeModal');
    showToast('Payment recorded successfully!', 'success');
    
    // Refresh the profile to show updated fee history
    const student = DataService.getStudentById(studentId);
    renderProfile(student);
  });

  // Handle edit form submission (reuses existing logic from students.js)
  document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editStudentId').value;
    const name = document.getElementById('studentName').value.trim();
    const cls = document.getElementById('studentClass').value;
    const section = document.getElementById('studentSection').value.trim().toUpperCase();
    const rollNo = parseInt(document.getElementById('studentRoll').value);
    const email = document.getElementById('studentEmail').value.trim();
    const phone = document.getElementById('studentPhone').value.trim();
    const address = document.getElementById('studentAddress').value.trim();

    if (!validateEmail(email)) { alert('Invalid email'); return; }
    if (!validatePhone(phone)) { alert('Phone must be 10 digits'); return; }

    const studentData = { name, class: cls, section, rollNo, email, phone, address };

    await DataService.updateStudent({ ...studentData, id });
    closeModal('addStudentModal');
    showToast('Student updated!', 'success');
    
    // Refresh the profile
    const updatedStudent = DataService.getStudentById(id);
    renderProfile(updatedStudent);
  });

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    const studentId = getStudentIdFromURL();
    
    if (!studentId) {
      document.getElementById('profileData').innerHTML = `
        <div class="card" style="text-align:center; padding:60px 20px;">
          <h3 style="color:#d97706;">No Student Selected</h3>
          <p style="color:var(--text-muted);">Please select a student from the Students page or use the search bar.</p>
          <br>
          <a href="students.html" class="btn btn-primary">Go to Students</a>
        </div>
      `;
      document.getElementById('profileData').style.display = 'block';
      document.getElementById('loadingState').style.display = 'none';
      return;
    }

    currentStudentId = studentId;

    // Get the student from DataService
    const student = DataService.getStudentById(studentId);
    if (student) {
      renderProfile(student);
    } else {
      // Student not found in current data, wait for dataChanged event
      const handler = function() {
        const s = DataService.getStudentById(studentId);
        if (s) {
          renderProfile(s);
          window.removeEventListener('dataChanged', handler);
        }
      };
      window.addEventListener('dataChanged', handler);
      
      // Also set a timeout in case the student doesn't exist
      setTimeout(() => {
        const s = DataService.getStudentById(studentId);
        if (!s) {
          renderProfile(null); // Show "not found"
        }
      }, 2000);
    }

    // Listen for real-time updates
    window.addEventListener('dataChanged', function() {
      const s = DataService.getStudentById(studentId);
      if (s) {
        renderProfile(s);
      }
    });
  });
})();
