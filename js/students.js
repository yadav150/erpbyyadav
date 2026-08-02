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
      <td>${s.name}</td>
      <td>${s.class}</td>
      <td>${s.section}</td>
      <td>${s.rollNo}</td>
      <td>${s.email}</td>
      <td>${s.phone}</td>
      <td style="text-align:center; white-space:nowrap;">
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

// ... (rest of filter, add, edit, delete functions remain the same as before)
// Ensure they call renderStudents() after changes.
