
'use server';

import { autoApproveUpiPayment } from '@/ai/flows/auto-approve-upi-payments';
import { z } from 'zod';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const paymentSchema = z.object({
  chapterId: z.string(),
  expectedAmount: z.coerce.number(),
  paymentProof: z
    .instanceof(File)
    .refine(file => file.size > 0, 'Payment proof is required.')
    .refine(
      file => file.size < 4 * 1024 * 1024,
      'Image must be less than 4MB.'
    )
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only .jpg, .png and .webp formats are supported.'
    ),
  transactionId: z.string().min(1, 'Transaction ID is required.'),
});

export type PaymentState = {
  message: string;
  isApproved?: boolean;
  error?: boolean;
  fieldErrors?: {
    [key: string]: string[];
  };
};

export async function handlePaymentVerification(
  prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  const validatedFields = paymentSchema.safeParse({
    chapterId: formData.get('chapterId'),
    expectedAmount: formData.get('expectedAmount'),
    paymentProof: formData.get('paymentProof'),
    transactionId: formData.get('transactionId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      error: true,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { paymentProof, expectedAmount, transactionId } = validatedFields.data;

  try {
    const buffer = Buffer.from(await paymentProof.arrayBuffer());
    const paymentProofDataUri = `data:${paymentProof.type};base64,${buffer.toString('base64')}`;

    const result = await autoApproveUpiPayment({
      paymentProofDataUri,
      expectedAmount,
      expectedReference: transactionId,
    });

    if (result.isApproved) {
      return {
        message: result.reason,
        isApproved: true,
      };
    } else {
      return {
        message: 'Payment submitted for manual review. ' + result.reason,
        isApproved: false,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred while verifying payment.',
      error: true,
    };
  }
}


type ChapterPdfData = {
    title: string;
    seasonNumber: number;
    chapterNumber: number;
    content: string;
};

export async function generatePdf(chapterData: ChapterPdfData): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const { title, seasonNumber, chapterNumber, content } = chapterData;
    // Strip HTML tags but keep line breaks, and remove any other non-ASCII characters
    const cleanContent = content.replace(/<[^>]*>?/gm, '').replace(/[^\x00-\x7F]/g, "");

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Helper function to draw on every page
    const drawPageChrome = (p: any) => {
        // Header
        const headerText = "Visit our official website to read more content: https://niyati-mu.vercel.app/";
        p.drawText(headerText, {
            x: margin,
            y: height - 30,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Footer
        const footerText = "Not for redistribution. For personal use of the logged-in user only.";
        p.drawText(footerText, {
            x: margin,
            y: 30,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Watermark
        const watermarkText = "CREATED BY VIKAS A DUBEY";
        const watermarkSize = 70;
        const textWidth = timesRomanBoldFont.widthOfTextAtSize(watermarkText, watermarkSize);

        p.drawText(watermarkText, {
            x: width / 2 - textWidth / 2,
            y: height / 2 + watermarkSize / 4,
            font: timesRomanBoldFont,
            size: watermarkSize,
            color: rgb(0, 0.5, 0), // Darker Green
            opacity: 0.1,
            rotate: degrees(-45),
        });
    }

    drawPageChrome(page);

    // --- Centered Title Block ---
    const storyName = "Niyati";
    const fullTitle = `${storyName}: ${title}`;
    const seasonChapterText = `Season ${seasonNumber} | Chapter ${chapterNumber}`;

    const storyNameWidth = timesRomanBoldFont.widthOfTextAtSize(fullTitle, 24);
    const seasonChapterWidth = timesRomanFont.widthOfTextAtSize(seasonChapterText, 18);

    page.drawText(fullTitle, {
        x: width / 2 - storyNameWidth / 2,
        y: y - 20,
        font: timesRomanBoldFont,
        size: 24,
        color: rgb(0.8, 0, 0), // Darker Red
    });
    y -= 50;

    page.drawText(seasonChapterText, {
        x: width / 2 - seasonChapterWidth / 2,
        y,
        font: timesRomanFont,
        size: 18,
        color: rgb(0, 0, 0.8), // Darker Blue
    });
    y -= 60;
    
    // Body Text
    const bodySize = 12;
    const bodyColor = rgb(0, 0, 0); // Black
    const lineHeight = bodySize * 1.5;
    const paragraphs = cleanContent.split('\n').filter(p => p.trim() !== '');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';

      if (y < margin + lineHeight) { // Check if space for a new line + footer
            page = pdfDoc.addPage();
            drawPageChrome(page);
            y = height - margin - 20; // Start a bit lower on new page
      }

      for (const word of words) {
          const testLine = line + word + ' ';
          const lineWidth = timesRomanFont.widthOfTextAtSize(testLine, bodySize);
          
          if (lineWidth < width - margin * 2) {
              line = testLine;
          } else {
              page.drawText(line, { x: margin, y, font: timesRomanFont, size: bodySize, color: bodyColor });
              y -= lineHeight;
              line = word + ' ';

              if (y < margin + lineHeight) {
                  page = pdfDoc.addPage();
                  drawPageChrome(page);
                  y = height - margin - 20;
              }
          }
      }
      page.drawText(line, { x: margin, y, font: timesRomanFont, size: bodySize, color: bodyColor });
      y -= lineHeight * 2; // Add extra space between paragraphs
    }


    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}
