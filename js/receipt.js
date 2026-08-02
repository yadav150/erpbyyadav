// ============================================
// js/receipt.js – Fee Receipt Generator
// ============================================

export function generateReceipt(feeData) {
    const receiptWindow = window.open('', '_blank', 'width=600,height=800');
    if (!receiptWindow) {
        alert('Please allow popups to generate receipt.');
        return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Fee Receipt</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1F2937; }
        .receipt { max-width: 500px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 32px; }
        .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; margin: 0; color: #4F46E5; }
        .header p { margin: 4px 0; color: #6B7280; font-size: 14px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E5E7EB; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #4B5563; }
        .value { color: #111827; }
        .total { font-size: 18px; font-weight: 700; color: #4F46E5; margin-top: 12px; padding-top: 12px; border-top: 2px solid #4F46E5; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9CA3AF; }
        .status-badge { display: inline-block; padding: 4px 16px; border-radius: 50px; font-size: 12px; font-weight: 600; }
        .status-paid { background: #DCFCE7; color: #15803D; }
        .status-unpaid { background: #FEE2E2; color: #B91C1C; }
    </style>
    </head>
    <body>
    <div class="receipt">
        <div class="header">
            <h1>Morning Glory English Academy</h1>
            <p>Fee Receipt</p>
        </div>
        <div class="row"><span class="label">Receipt No.</span><span class="value">#${feeData.receiptNo || 'N/A'}</span></div>
        <div class="row"><span class="label">Student</span><span class="value">${feeData.studentName || 'N/A'}</span></div>
        <div class="row"><span class="label">Class</span><span class="value">${feeData.class || 'N/A'}</span></div>
        <div class="row"><span class="label">Month / Year</span><span class="value">${feeData.month || ''} ${feeData.year || ''}</span></div>
        <div class="row"><span class="label">Amount</span><span class="value">₹ ${feeData.amount || 0}</span></div>
        <div class="row"><span class="label">Due Date</span><span class="value">${feeData.dueDate || 'N/A'}</span></div>
        <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge status-${feeData.status}">${feeData.status || 'N/A'}</span></span></div>
        <div class="row total"><span class="label">Total Paid</span><span class="value">₹ ${feeData.amount || 0}</span></div>
        <div class="footer">Thank you for your payment. This is a system-generated receipt.</div>
    </div>
    <script>
        window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); };
    <\/script>
    </body>
    </html>
    `;
    receiptWindow.document.write(html);
    receiptWindow.document.close();
}
