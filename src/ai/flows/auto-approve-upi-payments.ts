'use server';

/**
 * @fileOverview Implements a Genkit flow to automatically approve UPI payments by using OCR to parse the uploaded payment proof.
 *
 * - autoApproveUpiPayment - A function that handles the automatic approval of UPI payments.
 * - AutoApproveUpiPaymentInput - The input type for the autoApproveUpiPayment function.
 * - AutoApproveUpiPaymentOutput - The return type for the autoApproveUpiPayment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoApproveUpiPaymentInputSchema = z.object({
  paymentProofDataUri: z
    .string()
    .describe(
      "A screenshot or image of the UPI payment proof, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedAmount: z.number().describe('The expected amount of the UPI payment.'),
  expectedReference: z.string().describe('The expected reference or transaction ID of the UPI payment.'),
});
export type AutoApproveUpiPaymentInput = z.infer<typeof AutoApproveUpiPaymentInputSchema>;

const AutoApproveUpiPaymentOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the UPI payment is automatically approved.'),
  extractedAmount: z.number().optional().describe('The amount extracted from the payment proof via OCR, if available.'),
  extractedReference: z
    .string()
    .optional()
    .describe('The reference or transaction ID extracted from the payment proof via OCR, if available.'),
  reason: z
    .string()
    .describe('The reason for approval or rejection, providing more detail about the decision.'),
});
export type AutoApproveUpiPaymentOutput = z.infer<typeof AutoApproveUpiPaymentOutputSchema>;

export async function autoApproveUpiPayment(
  input: AutoApproveUpiPaymentInput
): Promise<AutoApproveUpiPaymentOutput> {
  return autoApproveUpiPaymentFlow(input);
}

const ocrPrompt = ai.definePrompt({
  name: 'ocrPrompt',
  input: {schema: AutoApproveUpiPaymentInputSchema},
  output: {schema: z.object({extractedText: z.string()})},
  prompt: `Extract the payment amount and transaction reference ID from the following text, which was extracted from an image of a UPI payment proof:

  {{media url=paymentProofDataUri}}
  `,
});

const autoApproveUpiPaymentFlow = ai.defineFlow(
  {
    name: 'autoApproveUpiPaymentFlow',
    inputSchema: AutoApproveUpiPaymentInputSchema,
    outputSchema: AutoApproveUpiPaymentOutputSchema,
  },
  async input => {
    try {
      const ocrResult = await ocrPrompt(input);
      const extractedText = ocrResult.output?.extractedText || '';

      // Simple regex to find amount and reference (improve as needed)
      const amountRegex = /(\d+(\.\d+)?)/;
      const referenceRegex = /([A-Za-z0-9]+)/;

      const extractedAmountMatch = extractedText.match(amountRegex);
      const extractedReferenceMatch = extractedText.match(referenceRegex);

      const extractedAmount = extractedAmountMatch ? parseFloat(extractedAmountMatch[1]) : undefined;
      const extractedReference = extractedReferenceMatch ? extractedReferenceMatch[1] : undefined;

      if (
        extractedAmount !== undefined &&
        extractedReference !== undefined &&
        extractedAmount === input.expectedAmount &&
        extractedReference.includes(input.expectedReference)
      ) {
        return {
          isApproved: true,
          extractedAmount: extractedAmount,
          extractedReference: extractedReference,
          reason: 'Payment automatically approved: Amount and reference match the expected values.',
        };
      } else {
        return {
          isApproved: false,
          extractedAmount: extractedAmount,
          extractedReference: extractedReference,
          reason: `Payment not approved: Amount or reference do not match the expected values. Extracted Amount: ${extractedAmount}, Expected Amount: ${input.expectedAmount}, Extracted Reference: ${extractedReference}, Expected Reference: ${input.expectedReference}`,
        };
      }
    } catch (error: any) {
      console.error('Error during auto-approval process:', error);
      return {
        isApproved: false,
        reason: `Payment not approved due to processing error: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
