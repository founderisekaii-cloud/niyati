'use server';

import { autoApproveUpiPayment } from '@/ai/flows/auto-approve-upi-payments';
import { z } from 'zod';

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
