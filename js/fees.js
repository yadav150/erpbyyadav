// ============================================
//  FEES PAGE LOGIC
// ============================================

const allStudents = DataService.getStudents();
let allFees = DataService.getAllFees();

// Populate student dropdown
function populateStudentSelect() {
  const select = document.getElementById('feeStudentSelect');
  select.innerHTML = '<option value="">— Select —</option>';
  allStudents.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.class}-${s.section})`;
    select.appendChild(opt);
  });
}

// Update summary stats
function updateSummary() {
  const fees = DataService.getAllFees();
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
  const studentsWithPending = new Set(fees.filter(f => f.status === 'pending').map(f => f.studentId)).size;

  document.getElementById('totalCollected').textContent = formatCurrency(totalCollected);
  document.getElementById('totalPending').textContent = formatCurrency(totalPending);
  document.getElementById('studentsWithPending').textContent = studentsWithPending;
}

// Show fee history (all fees or filtered by selected student)
function renderFeeHistory(studentId = '') {
  const tbody = document.getElementById('feeHistoryTable');
  let fees = DataService.getAllFees();
  if (studentId) fees = fees.filter(f => f.studentId === studentId);
  if (fees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No fee records</td></tr>`;
    return;
  }
  tbody.innerHTML = fees.map(f => {
    const student = DataService.getStudentById(f.studentId);
    const statusBadge = f.status === 'paid' ? 'badge-paid' : 'badge-pending';
    return `<tr>
      <td>${student ? student.name : 'Unknown'}</td>
      <td>${formatCurrency(f.amount)}</td>
      <td>${f.paidDate || '—'}</td>
      <td>${f.receiptNo || '—'}</td>
      <td><span class="badge ${statusBadge}">${f.status}</span></td>
    </tr>`;
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

// Record payment
function recordPayment() {
  const studentId = document.getElementById('feeStudentSelect').value;
  const amount = parseFloat(document.getElementById('feeAmount').value);
  if (!studentId) { alert('Select a student'); return; }
  if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }

  const receiptNo = generateReceiptNumber();
  const paidDate = getTodayDate();

  const feeRecord = {
    studentId,
    amount,
    paidDate,
    receiptNo,
    status: 'paid'
  };

  DataService.addFeeRecord(feeRecord);
  allFees = DataService.getAllFees();

  // Update UI
  updateSummary();
  renderFeeHistory(studentId);
  document.getElementById('feeAmount').value = '';

  // Show receipt
  showReceipt(feeRecord);

  showToast('Payment recorded!', 'success');
}

// Show receipt modal with content
function showReceipt(feeRecord) {
  const student = DataService.getStudentById(feeRecord.studentId);
  if (!student) return;

  const content = document.getElementById('receiptContent');
  content.innerHTML = `
    <div class="receipt-container" id="receiptPrintArea">
      <div class="header">
        <h2>Yadav School ERP</h2>
        <p>Payment Receipt</p>
      </div>
      <div class="details">
        <div><strong>Receipt No:</strong> ${feeRecord.receiptNo}</div>
        <div><strong>Date:</strong> ${feeRecord.paidDate}</div>
      </div>
      <div style="margin-bottom: 16px;">
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

// Initial load
document.addEventListener('DOMContentLoaded', function() {
  populateStudentSelect();
  updateSummary();
  renderFeeHistory(); // show all
});
