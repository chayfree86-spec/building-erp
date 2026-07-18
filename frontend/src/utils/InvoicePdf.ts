import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

export function generateInvoicePdf(invoice: any) {
  const doc = new jsPDF() as any;

  // Add theme header
  doc.setFillColor(37, 99, 235); // Royal Blue
  doc.rect(0, 0, 210, 30, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BUILD ERP', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Building Materials ERP & Logistics System', 15, 24);

  // Invoice Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 145, 20);

  // Invoice Details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const invDate = invoice.invoice_date || invoice.created_at;
  const custName = invoice.customer_name_snapshot || invoice.customer?.name || 'Walk-in Customer';
  const custMobile = invoice.customer_mobile_snapshot || invoice.customer?.mobile || '-';
  const custGst = invoice.customer_gst_snapshot || invoice.customer?.gst_number || 'N/A';

  doc.text(`Invoice No:  ${invoice.invoice_number || 'Draft'}`, 15, 45);
  doc.text(`Date:            ${formatDate(invDate)}`, 15, 51);
  doc.text(`Status:          ${String(invoice.status).toUpperCase()}`, 15, 57);

  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name:    ${custName}`, 120, 51);
  doc.text(`Mobile:  ${custMobile}`, 120, 57);
  doc.text(`GSTIN:   ${custGst}`, 120, 63);

  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.line(15, 70, 195, 70);

  // Items Table
  const headers = [['#', 'Item Description', 'Qty', 'Unit', 'Rate', 'Disc.', 'GST%', 'Total']];
  const rows = (invoice.items || []).map((item: any, index: number) => {
    const desc = item.product_name_snapshot || item.product?.name || 'Unknown Item';
    const unitName = item.unit?.short_name || '-';
    return [
      index + 1,
      desc,
      Number(item.quantity).toFixed(2),
      unitName,
      formatCurrency(item.rate),
      formatCurrency(item.discount_amount),
      `${item.gst_rate}%`,
      formatCurrency(item.line_total),
    ];
  });

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 75,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
    columnStyles: {
      0: { width: 8 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', width: 15 },
      3: { halign: 'center', width: 15 },
      4: { halign: 'right', width: 22 },
      5: { halign: 'right', width: 20 },
      6: { halign: 'right', width: 15 },
      7: { halign: 'right', width: 24 },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Invoice Summary (Totals)
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 120, finalY);
  doc.text(formatCurrency(invoice.subtotal), 170, finalY, { align: 'right' });

  doc.text(`Discount:`, 120, finalY + 6);
  doc.text(`-${formatCurrency(invoice.item_discount || invoice.discount_amount || 0)}`, 170, finalY + 6, { align: 'right' });

  doc.text(`Taxable Amount:`, 120, finalY + 12);
  doc.text(formatCurrency(invoice.taxable_amount), 170, finalY + 12, { align: 'right' });

  doc.text(`Tax (GST):`, 120, finalY + 18);
  doc.text(formatCurrency(invoice.tax_amount), 170, finalY + 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Grand Total:`, 120, finalY + 26);
  doc.text(formatCurrency(invoice.total_amount), 170, finalY + 26, { align: 'right' });

  // Paid / Outstanding Summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Paid Amount:`, 120, finalY + 34);
  doc.text(formatCurrency(invoice.paid_amount || 0), 170, finalY + 34, { align: 'right' });

  const remaining = (Number(invoice.total_amount) || 0) - (Number(invoice.paid_amount) || 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Balance Due:`, 120, finalY + 40);
  doc.text(formatCurrency(Math.max(0, remaining)), 170, finalY + 40, { align: 'right' });

  // Add footer note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for your business!', 15, 280);
  doc.text('This is a computer-generated invoice and requires no signature.', 15, 285);
}
