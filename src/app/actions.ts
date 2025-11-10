
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
    const cleanContent = content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/[^\x00-\x7F]/g, "");

    let page = pdfDoc.addPage();
    
    const drawPageChrome = (p: any) => {
        const pageHeight = p.getSize().height;
        const pageWidth = p.getSize().width;
        const margin = 50;
        
        // Draw Header
        const headerText = "Visit our official website to read more content: https://niyati-mu.vercel.app/";
        p.drawText(headerText, {
            x: margin,
            y: pageHeight - 30,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Draw Footer
        const footerText = "Not for redistribution. For personal use of the logged-in user only.";
        p.drawText(footerText, {
            x: margin,
            y: 30,
            size: 10,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Draw Randomized Watermarks
        const watermarkText = "VIKAS A. DUBEY";
        for (let i = 0; i < 15; i++) {
            const randomSize = Math.random() * 20 + 10; // size between 10 and 30
            const randomRotation = Math.random() * 360;
            const randomX = Math.random() * pageWidth;
            const randomY = Math.random() * pageHeight;
            const randomColorR = Math.random() * 0.5 + 0.5; // Lighter colors
            const randomColorG = Math.random() * 0.5 + 0.5;
            const randomColorB = Math.random() * 0.5 + 0.5;

            p.drawText(watermarkText, {
                x: randomX,
                y: randomY,
                font: timesRomanBoldFont,
                size: randomSize,
                color: rgb(randomColorR, randomColorG, randomColorB),
                opacity: 0.05, // Very subtle
                rotate: degrees(randomRotation),
            });
        }
    }

    drawPageChrome(page);

    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin - 50;

    const storyName = "Niyati";
    const seasonChapterText = `Season ${seasonNumber} | Chapter ${chapterNumber}`;

    // Draw Story Name (Red)
    const storyNameWidth = timesRomanBoldFont.widthOfTextAtSize(storyName, 28);
    page.drawText(storyName, {
        x: width / 2 - storyNameWidth / 2,
        y,
        font: timesRomanBoldFont,
        size: 28,
        color: rgb(0.8, 0.1, 0.1), // Red
    });
    y -= 35;
    
    // Draw Season/Chapter (Blue)
    const seasonChapterWidth = timesRomanFont.widthOfTextAtSize(seasonChapterText, 18);
    page.drawText(seasonChapterText, {
        x: width / 2 - seasonChapterWidth / 2,
        y,
        font: timesRomanFont,
        size: 18,
        color: rgb(0.1, 0.1, 0.8), // Blue
    });
    y -= 30;
    
    // Draw Title (Green)
    const titleWidth = timesRomanBoldFont.widthOfTextAtSize(title, 24);
    page.drawText(title, {
        x: width / 2 - titleWidth / 2,
        y: y,
        font: timesRomanBoldFont,
        size: 24,
        color: rgb(0.1, 0.6, 0.1), // Green
    });
    y -= 60;
    
    const bodySize = 12;
    const bodyColor = rgb(0, 0, 0);
    const lineHeight = bodySize * 1.5;
    const paragraphs = cleanContent.split('\n').filter(p => p.trim() !== '');

    for (const paragraph of paragraphs) {
      let line = '';
      const words = paragraph.split(' ');

      if (y < margin + lineHeight) {
            page = pdfDoc.addPage();
            drawPageChrome(page);
            y = height - margin - 20;
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
      y -= lineHeight * 2;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}
