// ============================================
//  SMART FEE COLLECTION MODULE (Standalone)
//  Extends existing functionality without
//  modifying or breaking fees.js or recordPayment()
// ============================================

(function() {
  // ---- DOM References ----
  const modal = document.getElementById('smartFeeModal');
  const studentSelect = document.getElementById('smartFeeStudent');
  const totalFeeInput = document.getElementById('smartTotalFee');
  const totalPaidDisplay = document.getElementById('smartTotalPaid');
  const pendingDisplay = document.getElementById('smartPending');
  const currentPaymentInput = document.getElementById('smartCurrentPayment');
  const remainingDisplay = document.getElementById('smartRemaining');
  const remainingAmount = document.getElementById('smartRemainingAmount');
  const submitBtn = document.getElementById('smartSubmitBtn');

  let currentStudentId = null;

  // ---- Helper: Calculate fee summary ----
  function calculateFeeSummary(studentId) {
    const student = DataService.getStudentById(studentId);
    if (!student) return null;

    const totalFee = parseFloat(student.totalFee) || 0;
    const fees = DataService.getFeesForStudent(studentId);
    const totalPaid = fees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);
    const pending = Math.max(0, totalFee - totalPaid);

    return { totalFee, totalPaid, pending };
  }

  // ---- Populate student dropdown ----
  function populateSmartStudentSelect() {
    const students = DataService.getStudents();
    studentSelect.innerHTML = '<option value="">— Select Student —</option>';
    if (students.length === 0) {
      studentSelect.innerHTML += '<option value="" disabled>No students available</option>';
    } else {
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.class}-${s.section})`;
        studentSelect.appendChild(opt);
      });
    }
  }

  // ---- Update UI when student changes ----
  function updateFeeSummary() {
    const studentId = studentSelect.value;
    currentStudentId = studentId;

    if (!studentId) {
      totalFeeInput.value = '';
      totalPaidDisplay.textContent = '₹ 0.00';
      pendingDisplay.textContent = '₹ 0.00';
      currentPaymentInput.value = '';
      remainingAmount.textContent = '₹ 0.00';
      remainingDisplay.className = 'remaining-balance neutral';
      submitBtn.disabled = true;
      return;
    }

    const summary = calculateFeeSummary(studentId);
    if (!summary) return;

    totalFeeInput.value = summary.totalFee;
    totalPaidDisplay.textContent = formatCurrency(summary.totalPaid);
    pendingDisplay.textContent = formatCurrency(summary.pending);
    currentPaymentInput.value = '';
    remainingAmount.textContent = formatCurrency(summary.pending);
    remainingDisplay.className = 'remaining-balance valid';

    // Auto-set pending as max if totalFee is 0
    if (summary.totalFee === 0) {
      submitBtn.disabled = true;
      remainingDisplay.className = 'remaining-balance invalid';
      remainingAmount.textContent = 'Set Total Fee first';
    } else {
      submitBtn.disabled = false;
    }

    // Trigger initial remaining calculation
    updateRemainingBalance();
  }

  // ---- Update remaining balance on amount change ----
  function updateRemainingBalance() {
    const studentId = studentSelect.value;
    if (!studentId) {
      remainingDisplay.className = 'remaining-balance neutral';
      remainingAmount.textContent = '₹ 0.00';
      return;
    }

    const summary = calculateFeeSummary(studentId);
    if (!summary) return;

    const currentPayment = parseFloat(currentPaymentInput.value) || 0;
    let remaining = summary.pending - currentPayment;

    const container = remainingDisplay;

    if (currentPayment <= 0) {
      remaining = summary.pending;
      container.className = 'remaining-balance valid';
      remainingAmount.textContent = formatCurrency(remaining);
      container.querySelector('.label').textContent = 'Pending Balance';
      submitBtn.disabled = false;
      return;
    }

    if (remaining < 0) {
      container.className = 'remaining-balance invalid';
      remainingAmount.textContent = formatCurrency(Math.abs(remaining)) + ' (Overpayment)';
      container.querySelector('.label').textContent = '⚠️ Overpayment Detected';
      submitBtn.disabled = true;
      return;
    }

    container.className = 'remaining-balance valid';
    remainingAmount.textContent = formatCurrency(remaining);
    container.querySelector('.label').textContent = 'Remaining Balance';
    submitBtn.disabled = false;
  }

  // ---- Save Total Fee to Student ----
  async function saveTotalFee(studentId) {
    const totalFee = parseFloat(totalFeeInput.value);
    if (isNaN(totalFee) || totalFee < 0) {
      alert('Please enter a valid Total Fee.');
      return false;
    }
    const student = DataService.getStudentById(studentId);
    if (!student) return false;

    // Only update if changed
    if (student.totalFee !== totalFee) {
      await DataService.updateStudent({ ...student, totalFee });
    }
    return true;
  }

  // ---- Process Payment ----
  async function processPayment() {
    const studentId = studentSelect.value;
    if (!studentId) {
      alert('Please select a student.');
      return;
    }

    // Save Total Fee first
    const feeSaved = await saveTotalFee(studentId);
    if (!feeSaved) return;

    const summary = calculateFeeSummary(studentId);
    if (!summary) return;

    const currentPayment = parseFloat(currentPaymentInput.value) || 0;

    // Validation
    if (currentPayment <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (currentPayment > summary.pending) {
      alert(`Cannot overpay. Pending balance is ${formatCurrency(summary.pending)}.`);
      return;
    }

    // Create fee record
    const receiptNo = generateReceiptNumber();
    const paidDate = getTodayDate();

    const feeRecord = {
      studentId,
      amount: currentPayment,
      paidDate,
      receiptNo,
      status: 'paid'
    };

    await DataService.addFeeRecord(feeRecord);

    // Reset form and close modal
    currentPaymentInput.value = '';
    closeModal('smartFeeModal');
    showToast(`Payment of ${formatCurrency(currentPayment)} recorded successfully!`, 'success');

    // Show receipt
    showSmartReceipt(feeRecord);

    // Trigger UI updates elsewhere
    window.dispatchEvent(new CustomEvent('dataChanged'));
  }

  // ---- Show Receipt ----
  function showSmartReceipt(feeRecord) {
    const student = DataService.getStudentById(feeRecord.studentId);
    if (!student) return;

    const content = document.getElementById('receiptContent');
    if (!content) return;

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
              <tr><td>Tuition Fee Payment</td><td>${formatCurrency(feeRecord.amount)}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="total">Total: ${formatCurrency(feeRecord.amount)}</div>
        <div class="footer-note">This is a system‑generated receipt. Thank you!</div>
      </div>
    `;
    openModal('receiptModal');
  }

  // ---- Expose to global ----
  window.openSmartFeeModal = function() {
    populateSmartStudentSelect();
    // Reset fields
    totalFeeInput.value = '';
    totalPaidDisplay.textContent = '₹ 0.00';
    pendingDisplay.textContent = '₹ 0.00';
    currentPaymentInput.value = '';
    remainingAmount.textContent = '₹ 0.00';
    remainingDisplay.className = 'remaining-balance neutral';
    submitBtn.disabled = true;
    studentSelect.value = '';
    currentStudentId = null;
    openModal('smartFeeModal');
  };

  // ---- Event Listeners ----
  document.addEventListener('DOMContentLoaded', function() {
    // Student selection change
    studentSelect.addEventListener('change', updateFeeSummary);

    // Current payment input
    currentPaymentInput.addEventListener('input', updateRemainingBalance);

    // Submit button
    submitBtn.addEventListener('click', processPayment);

    // Reset modal on close
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal('smartFeeModal');
      }
    });

    // Also listen for data changes to refresh totals if user updates elsewhere
    window.addEventListener('dataChanged', function() {
      if (modal.classList.contains('active') && currentStudentId) {
        updateFeeSummary();
      }
    });
  });
})();
