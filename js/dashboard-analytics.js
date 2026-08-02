// ============================================
//  DASHBOARD ANALYTICS MODULE (Standalone)
//  Extends existing dashboard without breaking
//  any existing functionality.
// ============================================

(function() {
  // ---- Chart instances ----
  let monthlyChart = null;
  let classDistributionChart = null;
  let feeStatusChart = null;

  // ---- DOM References ----
  const el = {
    totalStudents: document.getElementById('totalStudents'),
    todayCollection: document.getElementById('todayCollection'),
    totalCollection: document.getElementById('totalFeesCollected'),
    pendingFees: document.getElementById('pendingFees'),
    studentsWithDue: document.getElementById('studentsWithDue'),
    recentAdmissions: document.getElementById('recentAdmissions'),
    activityList: document.getElementById('activityList'),
    monthlyChartContainer: document.getElementById('monthlyChartContainer'),
    classChartContainer: document.getElementById('classChartContainer'),
    feeStatusChartContainer: document.getElementById('feeStatusChartContainer')
  };

  // ---- Utility: Get today's date in YYYY-MM-DD ----
  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  // ---- Utility: Get month name ----
  function getMonthName(monthIndex) {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[monthIndex] || '';
  }

  // ---- Utility: Format relative time ----
  function getRelativeTime(dateStr) {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return dateStr;
  }

  // ---- Get class ordering for charts ----
  function getClassOrder(cls) {
    const order = { 'Nursery': 0, 'LKG': 1, 'UKG': 2 };
    const num = parseInt(cls);
    if (!isNaN(num)) return num + 2;
    return order[cls] !== undefined ? order[cls] : 999;
  }

  // ---- Update Summary Cards ----
  function updateSummaryCards() {
    const students = DataService.getStudents();
    const fees = DataService.getAllFees();
    const today = getTodayString();

    // Total Students
    el.totalStudents.textContent = students.length;

    // Today's Collection
    const todayFees = fees.filter(f => f.status === 'paid' && f.paidDate === today);
    const todayTotal = todayFees.reduce((sum, f) => sum + f.amount, 0);
    el.todayCollection.textContent = formatCurrency(todayTotal);

    // Total Collection (already updated by existing dashboard logic)
    // We'll update it here too for consistency
    const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    el.totalCollection.textContent = formatCurrency(totalCollected);

    // Pending Fees
    const pending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
    el.pendingFees.textContent = formatCurrency(pending);

    // Students with Due Fees
    const dueStudents = new Set(fees.filter(f => f.status === 'pending').map(f => f.studentId));
    el.studentsWithDue.textContent = dueStudents.size;

    // Recent Admissions (students added in last 7 days)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recent = students.filter(s => {
      // If student has a createdAt timestamp
      const created = s.createdAt || s.id;
      // Fallback: use the ID timestamp (s1234567890)
      if (typeof created === 'string' && created.startsWith('s')) {
        const ts = parseInt(created.substring(1));
        return !isNaN(ts) && ts > oneWeekAgo;
      }
      return false;
    });
    el.recentAdmissions.textContent = recent.length;
  }

  // ---- Update Recent Activity ----
  function updateRecentActivity() {
    const fees = DataService.getAllFees();
    const students = DataService.getStudents();

    // Combine all events: fee payments and new students
    const events = [];

    // Fee payment events
    fees.forEach(f => {
      if (f.status === 'paid' && f.paidDate) {
        const student = DataService.getStudentById(f.studentId);
        events.push({
          type: 'fee',
          date: f.paidDate,
          timestamp: new Date(f.paidDate + 'T00:00:00').getTime(),
          text: `${student ? student.name : 'Unknown'} paid ${formatCurrency(f.amount)}`,
          meta: `Receipt: ${f.receiptNo || 'N/A'}`,
          icon: 'fee'
        });
      }
    });

    // Student admission events (using ID timestamp)
    students.forEach(s => {
      if (s.id && s.id.startsWith('s')) {
        const ts = parseInt(s.id.substring(1));
        if (!isNaN(ts)) {
          events.push({
            type: 'admission',
            date: new Date(ts).toISOString().split('T')[0],
            timestamp: ts,
            text: `${s.name} was admitted`,
            meta: `Class ${s.class}-${s.section}`,
            icon: 'admission'
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Take top 10
    const recentEvents = events.slice(0, 10);

    const container = el.activityList;
    if (recentEvents.length === 0) {
      container.innerHTML = `<div class="activity-empty">No recent activity</div>`;
      return;
    }

    container.innerHTML = recentEvents.map(e => `
      <div class="activity-item">
        <div class="activity-icon ${e.icon}">
          ${e.icon === 'fee' ? `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ` : `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          `}
        </div>
        <div class="activity-details">
          <div class="activity-text">${e.text}</div>
          <div class="activity-meta">${e.meta}</div>
        </div>
        <div class="activity-time">${getRelativeTime(e.date)}</div>
      </div>
    `).join('');
  }

  // ---- Render Monthly Fee Collection Chart ----
  function renderMonthlyChart() {
    const fees = DataService.getAllFees();
    const paidFees = fees.filter(f => f.status === 'paid' && f.paidDate);

    // Group by month (last 12 months)
    const monthlyData = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }

    paidFees.forEach(f => {
      const date = new Date(f.paidDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += f.amount;
      }
    });

    const labels = Object.keys(monthlyData).map(key => {
      const [year, month] = key.split('-');
      return getMonthName(parseInt(month) - 1) + ` '${year.slice(-2)}`;
    });
    const values = Object.values(monthlyData);

    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    // Destroy existing chart
    if (monthlyChart) {
      monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Fee Collection',
          data: values,
          backgroundColor: 'rgba(5, 150, 105, 0.7)',
          borderColor: 'rgba(5, 150, 105, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatCurrency(context.raw);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000) return '₹' + (value / 1000) + 'k';
                return '₹' + value;
              }
            }
          }
        }
      }
    });
  }

  // ---- Render Class Distribution Chart ----
  function renderClassDistribution() {
    const students = DataService.getStudents();

    // Count by class
    const classCounts = {};
    students.forEach(s => {
      const cls = s.class || 'Unknown';
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });

    // Sort by class order
    const sortedClasses = Object.keys(classCounts).sort((a, b) => getClassOrder(a) - getClassOrder(b));
    const labels = sortedClasses;
    const values = sortedClasses.map(c => classCounts[c]);

    const colors = [
      'rgba(5, 150, 105, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(234, 179, 8, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(99, 102, 241, 0.8)'
    ];

    const ctx = document.getElementById('classDistributionChart');
    if (!ctx) return;

    if (classDistributionChart) {
      classDistributionChart.destroy();
    }

    classDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                size: 12
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  // ---- Render Fee Status Chart ----
  function renderFeeStatus() {
    const fees = DataService.getAllFees();
    const paid = fees.filter(f => f.status === 'paid').length;
    const pending = fees.filter(f => f.status === 'pending').length;

    const ctx = document.getElementById('feeStatusChart');
    if (!ctx) return;

    if (feeStatusChart) {
      feeStatusChart.destroy();
    }

    feeStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Pending'],
        datasets: [{
          data: [paid, pending],
          backgroundColor: ['rgba(5, 150, 105, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                size: 12
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  // ---- Update All Charts ----
  function updateAllCharts() {
    renderMonthlyChart();
    renderClassDistribution();
    renderFeeStatus();
  }

  // ---- Full Dashboard Refresh ----
  function refreshDashboard() {
    updateSummaryCards();
    updateRecentActivity();
    updateAllCharts();
  }

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    // Initial load with a small delay to let Firebase data populate
    setTimeout(refreshDashboard, 300);

    // Listen for real-time changes
    window.addEventListener('dataChanged', function() {
      refreshDashboard();
    });

    // Also listen for resize events to redraw charts (optional)
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (monthlyChart) monthlyChart.resize();
        if (classDistributionChart) classDistributionChart.resize();
        if (feeStatusChart) feeStatusChart.resize();
      }, 250);
    });
  });
})();
