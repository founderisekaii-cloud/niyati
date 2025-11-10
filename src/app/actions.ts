
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

    const { title, seasonNumber, chapterNumber, content } = chapterData;
    // Strip HTML tags and any non-ASCII characters to prevent encoding errors
    const cleanContent = content.replace(/<[^>]*>?/gm, '').replace(/[^\x00-\x7F]/g, "");

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Header
    const headerText = "Visit our official website to read more content and more stories, don't copy it without author's permission.";
    page.drawText(headerText, {
        x: margin,
        y: height - 30,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
    });

    // Chapter Title
    page.drawText(title, {
        x: margin,
        y,
        font: timesRomanFont,
        size: 18,
        color: rgb(1, 0, 0), // Red
    });
    y -= 30;

    // Season/Chapter Number
    page.drawText(`Season ${seasonNumber} | Chapter ${chapterNumber}`, {
        x: margin,
        y,
        font: timesRomanFont,
        size: 16,
        color: rgb(0, 0, 1), // Blue
    });
    y -= 40;
    
    const drawContentOnPage = (p: any) => {
        // Footer
        const footerText = "For latest reading latest release visit https://niyati-mu.vercel.app/ and sign in.";
        p.drawText(footerText, {
            x: margin,
            y: 30,
            size: 8,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
        });

        // Watermark
        const watermarkText = "CREATED BY VIKAS A DUBEY";
        const watermarkSize = 50;
        const textWidth = timesRomanFont.widthOfTextAtSize(watermarkText, watermarkSize);
        const textHeight = timesRomanFont.heightAtSize(watermarkSize);
        p.drawText(watermarkText, {
            x: width / 2 - textWidth / 2,
            y: height / 2 + textHeight / 2,
            font: timesRomanFont,
            size: watermarkSize,
            color: rgb(0, 1, 0), // Green
            opacity: 0.1,
            rotate: degrees(-45),
        });
    }

    drawContentOnPage(page);

    // Body Text
    const bodySize = 12;
    const bodyColor = rgb(0, 0, 0); // Black
    const paragraphs = cleanContent.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';

      if (y < margin + 40) { // Check if space for a new line + footer
            page = pdfDoc.addPage();
            drawContentOnPage(page);
            y = height - margin - 20; // Start a bit lower on new page
      }

      for (const word of words) {
          const testLine = line + word + ' ';
          const lineWidth = timesRomanFont.widthOfTextAtSize(testLine, bodySize);
          
          if (lineWidth < width - margin * 2) {
              line = testLine;
          } else {
              page.drawText(line, { x: margin, y, font: timesRomanFont, size: bodySize, color: bodyColor });
              y -= bodySize * 1.5;
              line = word + ' ';

              if (y < margin + 40) {
                  page = pdfDoc.addPage();
                  drawContentOnPage(page);
                  y = height - margin - 20;
              }
          }
      }
      page.drawText(line, { x: margin, y, font: timesRomanFont, size: bodySize, color: bodyColor });
      y -= bodySize * 1.5; // Move to next line for the start of the next paragraph
    }


    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}
