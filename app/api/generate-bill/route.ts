// app/api/generate-bill/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
export const runtime = 'nodejs';

// TypeScript declarations
interface BillItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'medicine' | 'procedure' | 'consultation' | 'other';
}

interface BillData {
  clinic: {
    name: string;
    // Add other clinic details if needed
  };
  patient: {
    name: string;
    age: string;
    sex: string;
    date: string;
    id?: string;
    contactDetails?: string;
  };
  invoice: {
    number: string;
    date: string;
    paymentMethod: string;
    paymentStatus: string; // Add this field
  };
  items: BillItem[];
  financials: {
    consultationFee: number;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    total: number;
    amountPaid: number; // Add this field
    balanceDue: number; // Add this field
  };
  teeth?: string;
  diagnosis?: string;
}

export async function POST(request: NextRequest) {
  try {
    const billData: BillData = await request.json();

    // Create a PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document properties
    doc.setProperties({
      title: `Dental Bill - ${billData.patient.name}`,
      author: billData.clinic.name,
      subject: 'Dental Bill',
      keywords: 'dental, invoice, bill',
      creator: 'Dental Clinic Billing System'
    });

    // Generate the PDF content
    generatePDF(doc, billData);

    // Convert the PDF to bytes
    const pdfBytes = doc.output('arraybuffer');
    
    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set(
      'Content-Disposition',
      `attachment; filename=bill-${billData.patient.name.replace(/\s+/g, '-')}-${billData.invoice.date}.pdf`
    );

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating bill PDF:', error);
    return NextResponse.json({ 
      message: 'Failed to generate bill PDF', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

function generatePDF(doc: jsPDF, billData: BillData): void {
  // Define colors
  const primaryColor = '#1a56db'; // Blue
  const secondaryColor = '#064e3b'; // Teal

  // Set default font
  doc.setFont('helvetica');
  
  // Margins
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = margin;
  
  // Helper function to center text
  const centerText = (text: string, y: number, fontSize: number) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
    const textX = (pageWidth - textWidth) / 2;
    doc.text(text, textX, y);
  };

  // Add clinic header
  doc.setTextColor(primaryColor);
  doc.setFontSize(18);
  centerText(billData.clinic.name, yPos, 18);
  yPos += 7;
  
  doc.setTextColor('#666666');
  doc.setFontSize(10);
  centerText('Professional Dental Care Services', yPos, 10);
  yPos += 5;
  
  doc.setFontSize(8);
  centerText('123 Dental Avenue, Medical District', yPos, 8);
  yPos += 4;
  centerText('Mumbai, Maharashtra - 400001', yPos, 8);
  yPos += 4;
  centerText('Phone: +91 98765 43210 | Email: info@dantsridental.com', yPos, 8);
  yPos += 8;

  // Add horizontal line
  doc.setDrawColor(primaryColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Add invoice title
  doc.setTextColor(secondaryColor);
  doc.setFontSize(14);
  centerText('INVOICE', yPos, 14);
  yPos += 10;

  // Add invoice and patient info in two columns
  const colWidth = (pageWidth - (2 * margin)) / 2;
  const leftCol = margin;
  const rightCol = margin + colWidth;
  
  // Invoice details (left column)
  doc.setTextColor('#000000');
  doc.setFontSize(10);
  
  // Left column labels
  doc.text('Invoice No:', leftCol, yPos);
  doc.text('Date:', leftCol, yPos + 7);
  doc.text('Payment Method:', leftCol, yPos + 14);
  
  // Left column values (right-aligned)
  doc.setFont('helvetica', 'normal');
  const invoiceNoX = leftCol + colWidth - 5 - doc.getStringUnitWidth(billData.invoice.number) * 10 / doc.internal.scaleFactor;
  doc.text(billData.invoice.number, invoiceNoX, yPos);
  
  const formattedDate = formatDate(billData.invoice.date);
  const dateX = leftCol + colWidth - 5 - doc.getStringUnitWidth(formattedDate) * 10 / doc.internal.scaleFactor;
  doc.text(formattedDate, dateX, yPos + 7);
  
  const paymentMethodX = leftCol + colWidth - 5 - doc.getStringUnitWidth(billData.invoice.paymentMethod) * 10 / doc.internal.scaleFactor;
  doc.text(billData.invoice.paymentMethod, paymentMethodX, yPos + 14);
  doc.text('Payment Status:', leftCol, yPos + 21);
  const paymentStatusX = leftCol + colWidth - 5 - doc.getStringUnitWidth(billData.invoice.paymentStatus) * 10 / doc.internal.scaleFactor;
  doc.text(billData.invoice.paymentStatus, paymentStatusX, yPos + 21);

  yPos+=7;
  // Patient details (right column)
  doc.text('Patient Name:', rightCol, yPos);
  doc.text('Age/Sex:', rightCol, yPos + 7);
  doc.text('Patient ID:', rightCol, yPos + 14);
  
  // Right column values (right-aligned)
  const patientNameX = pageWidth - margin - doc.getStringUnitWidth(billData.patient.name) * 10 / doc.internal.scaleFactor;
  doc.text(billData.patient.name, patientNameX, yPos);
  
  const ageSexText = `${billData.patient.age} / ${billData.patient.sex}`;
  const ageSexX = pageWidth - margin - doc.getStringUnitWidth(ageSexText) * 10 / doc.internal.scaleFactor;
  doc.text(ageSexText, ageSexX, yPos + 7);
  
  const patientIdText = billData.patient.id || 'N/A';
  const patientIdX = pageWidth - margin - doc.getStringUnitWidth(patientIdText) * 10 / doc.internal.scaleFactor;
  doc.text(patientIdText, patientIdX, yPos + 14);
  
  yPos += 25;

  // Add treatment information if available
  if (billData.diagnosis || billData.teeth) {
    doc.setTextColor(secondaryColor);
    doc.setFontSize(12);
    doc.text('Treatment Information', margin, yPos);
    doc.setLineWidth(0.1);
    doc.line(margin, yPos + 1, margin + 40, yPos + 1);
    yPos += 7;
    
    doc.setTextColor('#000000');
    doc.setFontSize(9);
    
    if (billData.diagnosis) {
      doc.text(`Diagnosis: ${billData.diagnosis}`, margin, yPos);
      yPos += 5;
    }
    
    if (billData.teeth) {
      doc.text(`Teeth Treated: ${billData.teeth}`, margin, yPos);
      yPos += 5;
    }
    
    yPos += 5;
  }

  // Add bill items table section title
  doc.setTextColor(secondaryColor);
  doc.setFontSize(12);
  doc.text('Bill Items', margin, yPos);
  yPos += 7;

  // Define custom table dimensions and properties
  const tableX = margin;
  const tableWidth = pageWidth - (2 * margin);
  
  // Define column widths (percentage of table width)
  const colWidths = [
    0.08 * tableWidth, // S.No (8%)
    0.42 * tableWidth, // Description (42%)
    0.10 * tableWidth, // Qty (10%)
    0.20 * tableWidth, // Unit Price (20%)
    0.20 * tableWidth  // Total (20%)
  ];
  
  // Column X positions
  const colX = [
    tableX,                               // S.No
    tableX + colWidths[0],                // Description
    tableX + colWidths[0] + colWidths[1], // Qty
    tableX + colWidths[0] + colWidths[1] + colWidths[2], // Unit Price
    tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] // Total
  ];
  
  // Row height
  const rowHeight = 8;
  
  // Table header
  doc.setFillColor(26, 86, 219); // Blue header
  doc.rect(tableX, yPos, tableWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // IMPORTANT: Use doc.text(text, x, y, options) with align options to prevent unwanted character
  
  // S.No
  doc.text('S.No', colX[0] + colWidths[0]/2, yPos + 5.5, {
    align: 'center'
  });
  
  // Description
  doc.text('Description', colX[1] + colWidths[1]/2, yPos + 5.5, {
    align: 'center'
  });
  
  // Qty
  doc.text('Qty', colX[2] + colWidths[2]/2, yPos + 5.5, {
    align: 'center'
  });
  
  // Unit Price
  doc.text('Unit Price (in INR)', colX[3] + colWidths[3]/2, yPos + 5.5, {
    align: 'center'
  });
  
  // Total
  doc.text('Total (in INR)', colX[4] + colWidths[4]/2, yPos + 5.5, {
    align: 'center'
  });
  
  yPos += rowHeight;
  
  // Table data rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Black text
  
  // Combine regular items with consultation fee
  const allItems = [
    ...billData.items,
    {
      id: billData.items.length + 1,
      description: 'Consultation Fee',
      quantity: 1,
      unitPrice: billData.financials.consultationFee,
      total: billData.financials.consultationFee,
      itemType: 'consultation' as const
    }
  ];
  
  // Draw rows
  allItems.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(240, 240, 240); // Light gray
      doc.rect(tableX, yPos, tableWidth, rowHeight, 'F');
    }
    
    // Highlight consultation fee with different color
    if (item.itemType === 'consultation') {
      doc.setFillColor(230, 240, 255); // Light blue
      doc.rect(tableX, yPos, tableWidth, rowHeight, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    // Add row data with improved cell alignment using proper jsPDF text alignment options
    
    // S.No - center aligned
    doc.text((index + 1).toString(), colX[0] + colWidths[0]/2, yPos + 5.5, {
      align: 'center'
    });
    
    // Description - left aligned with padding
    let description = item.description;
    if (description.length > 40) {
      description = description.substring(0, 37) + '...';
    }
    doc.text(description, colX[1] + 3, yPos + 5.5); // Left align with small padding
    
    // Quantity - center aligned
    doc.text(item.quantity.toString(), colX[2] + colWidths[2]/2, yPos + 5.5, {
      align: 'center'
    });
    
    // Unit Price - right aligned with proper alignment options
    doc.text(formatCurrency(item.unitPrice), colX[3] + colWidths[3] - 3, yPos + 5.5, {
      align: 'right'
    });
    
    // Total - right aligned with proper alignment options
    doc.text(formatCurrency(item.total), colX[4] + colWidths[4] - 3, yPos + 5.5, {
      align: 'right'
    });
    
    // Draw horizontal line at bottom of row
    doc.setDrawColor(200, 200, 200);
    doc.line(tableX, yPos + rowHeight, tableX + tableWidth, yPos + rowHeight);
    
    yPos += rowHeight;
  });
  
  // Draw vertical lines for columns
  doc.setDrawColor(200, 200, 200);
  const tableBottom = yPos;
  const tableTop = tableBottom - (allItems.length + 1) * rowHeight; // +1 for header
  
  colX.forEach((x, i) => {
    if (i > 0) { // Skip first column start
      doc.line(x, tableTop, x, tableBottom);
    }
  });
  
  // Draw table outline
  doc.setDrawColor(26, 86, 219); // Blue border
  doc.setLineWidth(0.5);
  doc.rect(tableX, tableTop, tableWidth, tableBottom - tableTop);
  
  // Reset line width
  doc.setLineWidth(0.1);
  
  // Add space after table
  yPos += 10;
  
  // Add totals section
  const totalsWidth = 70;
  const totalsX = pageWidth - margin - totalsWidth;
  
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  
  // Subtotal with right alignment
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(billData.financials.subtotal), pageWidth - margin, yPos, {
    align: 'right'
  });
  yPos += 7;
  
  // Discount with right alignment
  const discountText = `Discount (${billData.financials.discountPercent}%):`;

  doc.text(discountText, totalsX, yPos);
  doc.text(formatCurrency(billData.financials.discountAmount), pageWidth - margin, yPos, {
    align: 'right'
  });
  yPos += 10;
  
  // Total amount box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(59, 130, 246);
  doc.rect(totalsX - 3, yPos - 5, pageWidth - totalsX - margin + 5, 10, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', totalsX, yPos);
  
  // Total amount with right alignment
  doc.text(formatCurrency(billData.financials.total), pageWidth - margin, yPos, {
    align: 'right'
  });
  yPos += 6;
  
  // 2. Add to the generatePDF function - after the "Total amount box" section
// Add payment status information
if (billData.invoice.paymentStatus !== 'Full Payment') {
  yPos += 10;
  
  // Amount Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Amount Paid:', totalsX, yPos);
  doc.text(formatCurrency(billData.financials.amountPaid), pageWidth - margin, yPos, {
    align: 'right'
  });
  
  // Balance Due with highlighted box
  yPos += 9;
  doc.setFillColor(254, 226, 226); // Light red background
  doc.setDrawColor(239, 68, 68); // Red border
  doc.rect(totalsX - 3, yPos - 5, pageWidth - totalsX - margin + 5, 10, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28); // Darker red text
  doc.text('Balance Due:', totalsX, yPos);
  doc.text(formatCurrency(billData.financials.balanceDue), pageWidth - margin, yPos, {
    align: 'right'
  });
  
  // Reset text color
  doc.setTextColor('#000000');
}


  yPos+=15
  // Add footer
  doc.setTextColor('#666666');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  centerText('Thank you for choosing Dantsri Dental Clinic for your dental care needs.', yPos, 9);
  yPos += 5;
  centerText('We wish you a speedy recovery and the best of health.', yPos, 9);
  yPos += 5;
  
  // Terms and conditions at the bottom of the page
  const pageHeight = doc.internal.pageSize.getHeight();
  yPos = pageHeight - 35;
  
  doc.setTextColor('#999999');
  doc.setFontSize(8);
  doc.text('Terms & Conditions:', margin, yPos);
  doc.text('1. This is a computer-generated invoice and does not require a signature.', margin, yPos + 5);
  doc.text('2. Please bring this invoice for any future reference or in case of follow-up visits.', margin, yPos + 10);
  doc.text('3. Payment is due at the time of service.', margin, yPos + 15);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Format currency with proper spacing
function formatCurrency(amount: number): string {
  return 'INR ' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
