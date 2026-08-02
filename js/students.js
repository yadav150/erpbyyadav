// ============================================
//  STUDENTS PAGE LOGIC (Firebase Ready)
//  UPDATED: Added "View Profile" button
// ============================================

// Helper: class order for sorting (Nursery → LKG → UKG → 1 → 2 → ... → 8)
function getClassOrder(cls) {
  const order = { 'Nursery': 0, 'LKG': 1, 'UKG': 2 };
  const num = parseInt(cls);
  if (!isNaN(num)) return num + 2; // 1 → 3, 2 → 4, ... 8 → 10
  return order[cls] !== undefined ? order[cls] : 999;
}

function renderStudents(list) {
  const tbody = document.getElementById('studentsTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding: 40px 0;">No students found. Click "Add Student" to get started.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td class="nowrap">${s.name}</td>
      <td>${s.class}</td>
      <td>${s.section}</td>
      <td class="rollno">${s.rollNo}</td>
      <td>${s.email}</td>
      <td class="nowrap">${s.phone}</td>
      <td class="actions">
        <!-- ===== NEW "VIEW PROFILE" BUTTON ===== -->
        <a href="profile.html?id=${s.id}" class="btn btn-primary btn-sm" title="View Profile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </a>
        <!-- ===== EDIT BUTTON ===== -->
        <button class="btn btn-primary btn-sm" onclick="editStudent('${s.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <!-- ===== DELETE BUTTON ===== -->
        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const cls = document.getElementById('classFilter').value;
  const sort = document.getElementById('sortBy').value;

  const students = DataService.getStudents();

  let filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search) || s.class.toLowerCase().includes(search);
    const matchClass = cls === '' || s.class === cls;
    return matchSearch && matchClass;
  });

  filtered.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'class') return getClassOrder(a.class) - getClassOrder(b.class);
    if (sort === 'rollNo') return a.rollNo - b.rollNo;
    return 0;
  });

  renderStudents(filtered);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('classFilter').value = '';
  document.getElementById('sortBy').value = 'name';
  filterStudents();
}

// Add/Edit form handling
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

  if (id) {
    await DataService.updateStudent({ ...studentData, id });
    showToast('Student updated!', 'success');
  } else {
    await DataService.addStudent(studentData);
    showToast('Student added!', 'success');
  }

  closeModal('addStudentModal');
  this.reset();
  document.getElementById('editStudentId').value = '';
  // No need to call filterStudents() – the 'dataChanged' event will trigger it automatically
});

function editStudent(id) {
  const student = DataService.getStudentById(id);
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
}

async function deleteStudent(id) {
  if (confirm('Delete this student and all related fees?')) {
    await DataService.deleteStudent(id);
    showToast('Student deleted', 'info');
    // The 'dataChanged' event will automatically refresh the list
  }
}

// Reset modal on close
document.getElementById('addStudentModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal('addStudentModal');
    document.getElementById('studentForm').reset();
    document.getElementById('editStudentId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Student';
    document.getElementById('saveStudentBtn').textContent = 'Save';
  }
});

// Listen for data changes from Firebase and re-filter
window.addEventListener('dataChanged', function() {
  filterStudents();
});

// Initial render
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to let Firebase load first
  setTimeout(filterStudents, 200);
});
