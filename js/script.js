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
//  All CRUD operations now read/write to Firebase.
//  No demo data – everything comes from the cloud.
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

  // ---------- CREATE ----------
  async addStudent(student) {
    student.id = 's' + Date.now();
    await firebase.database().ref('students/' + student.id).set(student);
    return student;
  },
  async addFeeRecord(fee) {
    fee.id = 'f' + Date.now();
    await firebase.database().ref('fees/' + fee.id).set(fee);
    return fee;
  },

  // ---------- UPDATE ----------
  async updateStudent(updated) {
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
  }
};

// Auto-init when script loads
DataService.init();
