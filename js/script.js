// ============================================
//  UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
  return '₹ ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateReceiptNumber() {
  const now = new Date();
  const dateStr = now.getFullYear() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return 'RCP-' + dateStr + '-' + random;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

function showToast(message, type = 'info') {
  alert(message); // Placeholder – upgrade to custom toast later
}

// ============================================
//  DATA SERVICE (FIREBASE READY - NO DEMO DATA)
//  All arrays are EMPTY by default.
// ============================================

const DataService = {
  students: [],
  fees: [],

  getStudents() {
    return this.students;
  },
  getStudentById(id) {
    return this.students.find(s => s.id === id);
  },
  addStudent(student) {
    student.id = 's' + Date.now();
    this.students.push(student);
    return student;
  },
  updateStudent(updated) {
    const index = this.students.findIndex(s => s.id === updated.id);
    if (index !== -1) this.students[index] = updated;
    return updated;
  },
  deleteStudent(id) {
    this.students = this.students.filter(s => s.id !== id);
    this.fees = this.fees.filter(f => f.studentId !== id);
  },
  getFeesForStudent(studentId) {
    return this.fees.filter(f => f.studentId === studentId);
  },
  addFeeRecord(fee) {
    fee.id = 'f' + Date.now();
    this.fees.push(fee);
    return fee;
  },
  getAllFees() {
    return this.fees;
  }
};
