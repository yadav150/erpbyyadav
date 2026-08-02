// ============================================
//  FEES PAGE LOGIC (Firebase Ready)
// ============================================

function populateStudentSelect() {
  const select = document.getElementById('feeStudentSelect');
  const students = DataService.getStudents();
  select.innerHTML = '<option value="">— Select —</option>';
  if (students.length === 0) {
    select.innerHTML += '<option value="" disabled>No students available</option>';
  } else {
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.class}-${s.section})`;
      select.appendChild(opt);
    });
  }
}

function updateSummary() {
  const fees = DataService.getAllFees();
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
  const studentsWithPending = new Set(fees.filter(f => f.status === 'pending').map(f => f.studentId)).size;

  document.getElementById('totalCollected').textContent = formatCurrency(totalCollected);
  document.getElementById('totalPending').textContent = formatCurrency(totalPending);
  document.getElementById('studentsWithPending').textContent = studentsWithPending;
}

function renderFeeHistory(studentId = '') {
  const tbody = document.getElementById('feeHistoryTable');
  let fees = DataService.getAllFees();
  if (studentId) fees = fees.filter(f => f.studentId === studentId);

  if (fees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:var(--text-muted); padding: 40px 0;">
          No fee records found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = fees.map(f => {
    const student = DataService.getStudentById(f.studentId);
    const statusBadge = f.status === 'paid' ? 'badge-paid' : 'badge-pending';
    return `
      <tr>
        <td class="nowrap">${student ? student.name : 'Unknown'}</td>
        <td class="amount">${formatCurrency(f.amount)}</td>
        <td class="nowrap">${f.paidDate || '—'}</td>
        <td class="nowrap">${f.receiptNo || '—'}</td>
        <td class="nowrap"><span class="badge ${statusBadge}">${f.status}</span></td>
      </tr>
    `;
  }).join('');
}

// Update student info when selection changes
document.getElementById('feeStudentSelect').addEventListener('change', function() {
  const studentId = this.value;
  const info = document.getElementById('selectedStudentInfo');

  if (studentId) {
    const student = DataService.getStudentById(studentId);
    const fees = DataService.getFeesForStudent(studentId);
    const paid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const pending = fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    info.textContent = `${student.name} | Total Paid: ${formatCurrency(paid)} | Pending: ${formatCurrency(pending)}`;
  } else {
    info.textContent = '';
  }

  renderFeeHistory(studentId);
});

async function recordPayment() {
  const studentId = document.getElementById('feeStudentSelect').value;
  const amount = parseFloat(document.getElementById('feeAmount').value);

  if (!studentId) {
    alert('Please select a student.');
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

  document.getElementById('feeAmount').value = '';
  showReceipt(feeRecord);
  showToast('Payment recorded successfully!', 'success');
}

function showReceipt(feeRecord) {
  const student = DataService.getStudentById(feeRecord.studentId);
  if (!student) return;

  const content = document.getElementById('receiptContent');
  content.innerHTML = `
    <div class="receipt-container" id="receiptPrintArea">
      <div class="header">
        <h2>Yadav School ERP</h2>
        <p style="color: var(--text-muted);">Payment Receipt</p>
      </div>
      <div class="details">
        <div><strong>Receipt No:</strong> ${feeRecord.receiptNo}</div>
        <div><strong>Date:</strong> ${feeRecord.paidDate}</div>
      </div>
      <div style="margin-bottom: 20px;">
        <p><strong>Student:</strong> ${student.name} (${student.class}-${student.section})</p>
        <p><strong>Email:</strong> ${student.email}</p>
      </div>
      <div class="items">
        <table>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Tuition Fee</td><td>${formatCurrency(feeRecord.amount)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="total">Total: ${formatCurrency(feeRecord.amount)}</div>
      <div class="footer-note">This is a system‑generated receipt. Thank you!</div>
    </div>
  `;
  openModal('receiptModal');
}

// Listen for data changes from Firebase
window.addEventListener('dataChanged', function() {
  populateStudentSelect();
  updateSummary();
  const selectedStudentId = document.getElementById('feeStudentSelect').value;
  renderFeeHistory(selectedStudentId);
  // Also update the selected student info
  const event = new Event('change');
  document.getElementById('feeStudentSelect').dispatchEvent(event);
});

// Initial render
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    populateStudentSelect();
    updateSummary();
    renderFeeHistory();
  }, 200);
});
