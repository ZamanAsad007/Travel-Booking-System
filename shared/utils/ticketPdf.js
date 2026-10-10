import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function generateTicketPdf(ticketData) {
  const {
    ticketNumber = 'TKT-PENDING',
    bookingId = 'N/A',
    amount = 0,
    items = [],
    travelers = [],
  } = ticketData;

  // Generate QR Code Buffer
  const qrPayload = JSON.stringify({
    tkt: ticketNumber,
    bk: bookingId,
    pax: travelers.length || 1,
  });

  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    width: 110,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Header Banner
    doc.rect(0, 0, doc.page.width, 85).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('TravelGo E-TICKET', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Official Boarding Pass & Reservation Voucher', 50, 52);

    // Ticket & Booking Information Box
    const startY = 110;
    doc.fillColor('#1f2937');

    doc.fontSize(11).font('Helvetica-Bold').text('Ticket Number:', 50, startY);
    doc.fontSize(11).font('Helvetica').text(ticketNumber, 150, startY);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Booking ID:', 50, startY + 20);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(bookingId, 150, startY + 20);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Total Paid:', 50, startY + 40);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`$${parseFloat(amount || 0).toFixed(2)} USD`, 150, startY + 40);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Issue Date:', 50, startY + 60);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(new Date().toLocaleDateString(), 150, startY + 60);

    // Embed QR code on the top-right
    try {
      doc.image(qrBuffer, doc.page.width - 160, startY - 10, { width: 100 });
    } catch (e) {
      console.warn('Failed to embed QR code into ticket PDF:', e.message);
    }

    // Divider
    doc
      .moveTo(50, startY + 105)
      .lineTo(doc.page.width - 50, startY + 105)
      .strokeColor('#e5e7eb')
      .stroke();

    // Passengers / Travelers Section
    let currentY = startY + 125;
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1e3a8a')
      .text('TRAVELER DETAILS', 50, currentY);
    currentY += 22;

    if (travelers && travelers.length > 0) {
      travelers.forEach((t, i) => {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(`${i + 1}. ${t.full_name}`, 50, currentY);
        const dobFormatted = t.date_of_birth
          ? new Date(t.date_of_birth).toLocaleDateString()
          : 'N/A';
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#4b5563')
          .text(
            `Passport: ${t.passport_no || 'N/A'}  |  DOB: ${dobFormatted}  |  Seat: ${t.seat_no || 'Assigned at gate'}`,
            65,
            currentY + 14
          );
        currentY += 32;
      });
    } else {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('Primary Traveler / Group Booking', 50, currentY);
      currentY += 24;
    }

    // Divider
    currentY += 10;
    doc
      .moveTo(50, currentY)
      .lineTo(doc.page.width - 50, currentY)
      .strokeColor('#e5e7eb')
      .stroke();
    currentY += 18;

    // Booked Items / Itinerary
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1e3a8a')
      .text('ITINERARY & RESERVATIONS', 50, currentY);
    currentY += 22;

    if (items && items.length > 0) {
      items.forEach((item, i) => {
        const type = (item.item_type || item.itemType || 'Service').toUpperCase();
        const unitPrice = parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2);
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text(`Segment ${i + 1}: ${type} Reservation`, 50, currentY);
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#4b5563')
          .text(
            `Quantity: ${item.quantity || 1}  |  Unit Price: $${unitPrice}  |  Ref: ${item.item_id || item.itemId || 'N/A'}`,
            65,
            currentY + 14
          );
        currentY += 32;
      });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        'Please present this electronic document and valid government photo identification at check-in or boarding. Have a safe journey!',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.end();
  });
}
