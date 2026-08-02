// ============================================
//  RECEIPT SETTINGS MODULE (Standalone)
//  Allows admins to customize school details
//  for all receipts. Saves to Firebase.
//  Does NOT modify or break existing functionality.
// ============================================

(function() {
  // ---- DOM References ----
  const form = document.getElementById('receiptSettingsForm');
  const saveBtn = document.getElementById('saveSettingsBtn');
  const resetBtn = document.getElementById('resetSettingsBtn');

  // ---- Load settings from Firebase ----
  function loadSettings() {
    firebase.database().ref('receiptSettings').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Populate form fields
        document.getElementById('settingSchoolName').value = data.schoolName || '';
        document.getElementById('settingSchoolAddress').value = data.schoolAddress || '';
        document.getElementById('settingContactNumber').value = data.contactNumber || '';
        document.getElementById('settingEmail').value = data.email || '';
        document.getElementById('settingWebsite').value = data.website || '';
        document.getElementById('settingReceiptTitle').value = data.receiptTitle || '';
        document.getElementById('settingFooterText').value = data.footerText || '';
      }
    });
  }

  // ---- Save settings to Firebase ----
  async function saveSettings() {
    const settings = {
      schoolName: document.getElementById('settingSchoolName').value.trim(),
      schoolAddress: document.getElementById('settingSchoolAddress').value.trim(),
      contactNumber: document.getElementById('settingContactNumber').value.trim(),
      email: document.getElementById('settingEmail').value.trim(),
      website: document.getElementById('settingWebsite').value.trim(),
      receiptTitle: document.getElementById('settingReceiptTitle').value.trim(),
      footerText: document.getElementById('settingFooterText').value.trim()
    };

    try {
      await firebase.database().ref('receiptSettings').set(settings);
      showToast('Receipt settings saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save settings: ' + error.message, 'error');
    }
  }

  // ---- Reset settings to defaults ----
  function resetSettings() {
    if (!confirm('Reset all settings to default values?')) return;

    const defaults = {
      schoolName: 'Yadav School ERP',
      schoolAddress: '123 Education Street, City, State',
      contactNumber: '+91 9876543210',
      email: 'info@yadavschool.edu',
      website: 'www.yadavschool.edu',
      receiptTitle: 'Payment Receipt',
      footerText: 'Thank you for your payment. This is a system-generated receipt.'
    };

    document.getElementById('settingSchoolName').value = defaults.schoolName;
    document.getElementById('settingSchoolAddress').value = defaults.schoolAddress;
    document.getElementById('settingContactNumber').value = defaults.contactNumber;
    document.getElementById('settingEmail').value = defaults.email;
    document.getElementById('settingWebsite').value = defaults.website;
    document.getElementById('settingReceiptTitle').value = defaults.receiptTitle;
    document.getElementById('settingFooterText').value = defaults.footerText;

    showToast('Form reset to default values. Click "Save" to apply.', 'info');
  }

  // ---- Event Listeners ----
  document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    loadSettings();

    // Save button
    saveBtn.addEventListener('click', saveSettings);

    // Reset button
    resetBtn.addEventListener('click', resetSettings);
  });
})();
