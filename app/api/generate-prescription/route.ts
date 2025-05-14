// app/api/generate-prescription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface ToothData {
  id: number;
  type: string;
  category: 'Permanent' | 'Deciduous';
  disease?: string;
}

interface MedicineEntry {
  name: string;
  dosage: string;
  duration: string;
}

interface PrescriptionData {
  patientName: string;
  age: string;
  sex: string;
  date: string;
  cc: string;  // Chief Complaint
  mh: string;  // Medical/Dental History
  de: string;  // Diagnosis
  advice: string;
  followupDate: string;
  medicines: MedicineEntry[];
  // New fields from form
  dentalNotation: string;   // Formatted string of selected teeth
  clinicalNotes: string;    // Combined diagnosis and oral exam notes
  selectedTeeth: ToothData[];
}

export async function POST(req: NextRequest) {
  try {
    const data: PrescriptionData = await req.json();
    
    // Load the template PDF
    const templatePath = path.join(process.cwd(), 'public', 'prescription-template.pdf');
    const templateBytes = await fs.readFile(templatePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the first page of the document
    const firstPage = pdfDoc.getPages()[0];
    
    // Embed a standard font
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Text properties
    const textSize = 12;
    const textColor = rgb(0, 0, 0);
    
    // Format date
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
    
    // Patient details - Patient name (maintain existing position)
    firstPage.drawText(data.patientName, {
      x: 260,
      y: firstPage.getHeight() - 173,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Age (maintain existing position)
    firstPage.drawText(data.age, {
      x: 197,
      y: firstPage.getHeight() - 208,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Sex (maintain existing position)
    firstPage.drawText(data.sex, {
      x: 335,
      y: firstPage.getHeight() - 208,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Date (maintain existing position)
    firstPage.drawText(formattedDate, {
      x: 507,
      y: firstPage.getHeight() - 173,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Medical information - Chief Complaint (maintain existing position)
    firstPage.drawText(data.cc || 'N/A', {
      x: 197,
      y: firstPage.getHeight() - 242,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Medical/Dental History (maintain existing position)
    firstPage.drawText(data.mh || 'N/A', {
      x: 197,
      y: firstPage.getHeight() - 281,
      size: textSize,
      font: regularFont,
      color: textColor
    });
    
    // Oral Examination (O/E) - This replaces the Diagnosis field in the PDF template
    let oralExamText = 'None';
    
    // Handle teeth information for prescription
    if (data.selectedTeeth && data.selectedTeeth.length > 0) {
      const teethInfo = data.selectedTeeth.map(tooth => {
        const toothId = tooth.id.toString();
        const quadrant = toothId[0];
        const number = parseInt(toothId.slice(1));
        
        // Convert numbers 9-13 to letters A-E directly
        let displayId;
        if (number >= 9 && number <= 13) {
          const letterIndex = number - 9; // 9->0, 10->1, 11->2, etc.
          const letter = String.fromCharCode('A'.charCodeAt(0) + letterIndex);
          displayId = `${quadrant}${letter}`;
        } else {
          displayId = toothId;
        }
    
        return `#${displayId} (${tooth.disease})`;
      }).join('; ');
    
      // Update dental notation with converted IDs
      data.dentalNotation = teethInfo;
    }

    // Prepare oral examination text with teeth information and clinical notes
    if (data.dentalNotation || data.clinicalNotes) {
      const teethInfo = data.dentalNotation ? `Teeth involved: ${data.dentalNotation}` : '';
      const clinicalInfo = data.clinicalNotes || '';
      
      if (teethInfo && clinicalInfo) {
        oralExamText = `${teethInfo}; ${clinicalInfo}`;
      } else {
        oralExamText = teethInfo || clinicalInfo;
      }
    }
    
    // Handle the Oral Examination text with proper wrapping
    const maxWidth = 340; // Maximum width for the text
    const oralExamLines = splitTextIntoLines(oralExamText, regularFont, textSize, maxWidth);
    const yPos = firstPage.getHeight() - 311;
    
    // Draw each line of the oral examination text
    oralExamLines.forEach((line, index) => {
      firstPage.drawText(line, {
        x: 197,
        y: yPos - (index * 20), // 20 pixels between lines
        size: textSize,
        font: regularFont,
        color: textColor
      });
    });
    
    // Medicines entries - Start after Oral Examination section
    const medicineStartY = yPos - (oralExamLines.length * 20) - 60; // Add some spacing after O/E
    
    let currentPage: PDFPage = firstPage;
    let yPosition = medicineStartY;
    
    // Medicines entries
    const xMedicineName = 160;
    const xDosage = 357;
    const xDuration = 492;
    const lineSpacing = 25; // Increased spacing between lines
    
    data.medicines.forEach((medicine) => {
      // Check if we need a new page
      if (yPosition < 180) {
        // Add a new page
        currentPage = addNewPage(pdfDoc, regularFont);
        yPosition = currentPage.getHeight() - 100;
      }
      
      // Draw medicine information
      currentPage.drawText(medicine.name, {
        x: xMedicineName,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor
      });
      
      currentPage.drawText(medicine.dosage, {
        x: xDosage,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor
      });
      
      currentPage.drawText(medicine.duration, {
        x: xDuration,
        y: yPosition,
        size: textSize,
        font: regularFont,
        color: textColor
      });
      
      yPosition -= lineSpacing;
    });
    
    // Fixed positions for advice and follow-up
    // Advice - fixed at specific coordinates
    const adviceY =180; // Fixed Y position for advice
    
    // If we're not on the first page, add advice to the current page
    if (currentPage !== firstPage) {
      currentPage.drawText(data.advice || 'No specific advice', {
        x: 240,
        y: adviceY,
        size: textSize,
        font: regularFont,
        color: textColor
      });
    } else {
      // Draw advice on first page at fixed position
      firstPage.drawText(data.advice || 'No specific advice', {
        x: 240,
        y: adviceY,
        size: textSize,
        font: regularFont,
        color: textColor
      });
    }
    
    // Follow-up date - fixed at specific coordinates
    const followupY = 126; // Fixed Y position for follow-up
    
    let followupText = 'No follow-up scheduled';
    if (data.followupDate) {
      const followupDate = new Date(data.followupDate).toLocaleDateString('en-US', { 
        day: '2-digit', month: '2-digit', year: 'numeric' 
      });
      followupText = followupDate;
    }
    
    // If we're not on the first page, add follow-up to the current page
    if (currentPage !== firstPage) {
      currentPage.drawText(followupText, {
        x: 225,
        y: followupY,
        size: textSize,
        font: regularFont,
        color: textColor
      });
    } else {
      // Draw follow-up on first page at fixed position
      firstPage.drawText(followupText, {
        x: 225,
        y: followupY,
        size: textSize,
        font: regularFont,
        color: textColor
      });
    }
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Return the PDF as response with proper type conversion
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=prescription-${data.patientName.replace(/\s+/g, '-')}.pdf`,
      },
    });
    
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate prescription PDF' },
      { status: 500 }
    );
  }
}

// Helper function to add a new page with header
function addNewPage(pdfDoc: PDFDocument, font: PDFFont): PDFPage {
  const newPage = pdfDoc.addPage();
  
  // Add header to new page
  newPage.drawText('DANTSRI DENTAL HOSPITAL', {
    x: newPage.getWidth() / 2 - 100,
    y: newPage.getHeight() - 50,
    size: 14,
    font,
    color: rgb(0, 0, 0)
  });
  
  newPage.drawText('Prescription Continued', {
    x: newPage.getWidth() / 2 - 80,
    y: newPage.getHeight() - 70,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  
  return newPage;
}

// Helper function to split text into lines of appropriate width
function splitTextIntoLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (lineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}