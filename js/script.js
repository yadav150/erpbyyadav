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
  alert(message); // You can later replace this with a custom toast UI
}

// ============================================
//  DATA SERVICE (FIREBASE REALTIME DATABASE)
//  UPDATED: Added gender and status fields
//  All CRUD operations now include gender and status.
// ============================================

const DataService = {
  _students: [],
  _fees: [],
  _listeners: [],

  // ---------- INIT: Start listening to Firebase ----------
  init() {
    // Listen to Students
    firebase.database().ref('students').on('value', (snapshot) => {
      const data = snapshot.val();
      this._students = data ? Object.values(data) : [];
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('dataChanged'));
    });

    // Listen to Fees
    firebase.database().ref('fees').on('value', (snapshot) => {
      const data = snapshot.val();
      this._fees = data ? Object.values(data) : [];
      window.dispatchEvent(new CustomEvent('dataChanged'));
    });
  },

  // ---------- READ ----------
  getStudents() {
    return this._students;
  },
  getStudentById(id) {
    return this._students.find(s => s.id === id);
  },
  getAllFees() {
    return this._fees;
  },
  getFeesForStudent(studentId) {
    return this._fees.filter(f => f.studentId === studentId);
  },

  // ---------- CREATE (ADDED gender AND status) ----------
  async addStudent(student) {
    student.id = 's' + Date.now();
    student.createdAt = Date.now();
    // Add gender and status fields with defaults
    student.gender = student.gender || '';
    student.status = student.status || 'active';
    await firebase.database().ref('students/' + student.id).set(student);
    return student;
  },

  // ---------- UPDATE (PRESERVES gender AND status) ----------
  async updateStudent(updated) {
    // Fetch existing student to preserve any missing fields
    const existing = this.getStudentById(updated.id);
    if (existing) {
      // Preserve gender and status if not provided in update
      updated.gender = updated.gender !== undefined ? updated.gender : (existing.gender || '');
      updated.status = updated.status !== undefined ? updated.status : (existing.status || 'active');
      // Preserve createdAt if not provided
      updated.createdAt = updated.createdAt || existing.createdAt;
    } else {
      // If student doesn't exist locally, set defaults
      updated.gender = updated.gender || '';
      updated.status = updated.status || 'active';
    }
    await firebase.database().ref('students/' + updated.id).update(updated);
    return updated;
  },

  // ---------- DELETE ----------
  async deleteStudent(id) {
    // Delete student
    await firebase.database().ref('students/' + id).remove();
    // Delete all associated fees
    const feesToRemove = this._fees.filter(f => f.studentId === id);
    for (let fee of feesToRemove) {
      await firebase.database().ref('fees/' + fee.id).remove();
    }
  },

  // ---------- FEE RECORDS ----------
  async addFeeRecord(fee) {
    fee.id = 'f' + Date.now();
    await firebase.database().ref('fees/' + fee.id).set(fee);
    return fee;
  }
};

// Auto-init when script loads
DataService.init();
