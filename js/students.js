// ============================================
//  STUDENTS PAGE LOGIC
// ============================================

let students = DataService.getStudents();
let currentFiltered = [...students];

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
        <button class="btn btn-primary btn-sm" onclick="editStudent('${s.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const cls = document.getElementById('classFilter').value;
  const sort = document.getElementById('sortBy').value;

  let filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search) || s.class.includes(search);
    const matchClass = cls === '' || s.class === cls;
    return matchSearch && matchClass;
  });

  filtered.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'class') return a.class.localeCompare(b.class);
    if (sort === 'rollNo') return a.rollNo - b.rollNo;
    return 0;
  });

  currentFiltered = filtered;
  renderStudents(filtered);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('classFilter').value = '';
  document.getElementById('sortBy').value = 'name';
  filterStudents();
}

// Add/Edit form handling
document.getElementById('studentForm').addEventListener('submit', function(e) {
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
    const updated = { ...studentData, id };
    DataService.updateStudent(updated);
    students = DataService.getStudents();
    showToast('Student updated!', 'success');
  } else {
    DataService.addStudent(studentData);
    students = DataService.getStudents();
    showToast('Student added!', 'success');
  }

  closeModal('addStudentModal');
  this.reset();
  document.getElementById('editStudentId').value = '';
  filterStudents();
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

function deleteStudent(id) {
  if (confirm('Delete this student and all related fees?')) {
    DataService.deleteStudent(id);
    students = DataService.getStudents();
    filterStudents();
    showToast('Student deleted', 'info');
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

// Initial render
document.addEventListener('DOMContentLoaded', filterStudents);
