// ============================================
//  UTILITY FUNCTIONS (shared across pages)
// ============================================

// Format currency (Indian Rupee)
function formatCurrency(amount) {
  return '₹ ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Generate a unique receipt number
function generateReceiptNumber() {
  const now = new Date();
  const dateStr = now.getFullYear() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return 'RCP-' + dateStr + '-' + random;
}

// Get today's date in YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Modal controls
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Simple validation
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

// Show toast notification (placeholder – you can style it later)
function showToast(message, type = 'info') {
  alert(message); // Replace with a proper toast UI if needed
}

// ============================================
//  DATA SERVICE (mock – replace with Firebase)
// ============================================

// This mimics a Firebase collection.
// In your real app, you'll replace the functions below with Firebase calls.

const DataService = {
  // Students collection
  students: [
    { id: 's1', name: 'Aarav Sharma', class: '10', section: 'A', rollNo: 1, email: 'aarav@example.com', phone: '9876543210', address: 'Delhi' },
    { id: 's2', name: 'Priya Patel', class: '10', section: 'B', rollNo: 2, email: 'priya@example.com', phone: '9876543211', address: 'Mumbai' },
    { id: 's3', name: 'Rahul Singh', class: '9', section: 'A', rollNo: 3, email: 'rahul@example.com', phone: '9876543212', address: 'Bangalore' },
  ],

  // Fees collection (each fee record is linked to a student)
  fees: [
    { id: 'f1', studentId: 's1', amount: 5000, paidDate: '2026-08-01', receiptNo: 'RCP-20260801-001', status: 'paid' },
    { id: 'f2', studentId: 's2', amount: 4500, paidDate: '2026-07-15', receiptNo: 'RCP-20260715-002', status: 'paid' },
    { id: 'f3', studentId: 's3', amount: 5000, paidDate: null, receiptNo: null, status: 'pending' },
  ],

  // Mock CRUD operations (replace with Firebase later)
  getStudents() {
    return this.students;
  },
  getStudentById(id) {
    return this.students.find(s => s.id === id);
  },
  addStudent(student) {
    student.id = 's' + Date.now(); // temp id
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
    // Also remove associated fees
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
  // Get all fees (for dashboard)
  getAllFees() {
    return this.fees;
  }
};
