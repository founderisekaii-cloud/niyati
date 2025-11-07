'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chapter } from '@/lib/types';
import Image from 'next/image';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { handlePaymentVerification, type PaymentState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter | null;
};

const getChapterPrice = (releaseDate: string, basePrice: number) => {
  if (!releaseDate) return basePrice;
  const daysSinceRelease = differenceInDays(new Date(), new Date(releaseDate));
  if (daysSinceRelease >= 30) return 0;
  if (daysSinceRelease >= 14) return 2;
  if (daysSinceRelease >= 7) return 3;
  return basePrice;
};

const FormSchema = z.object({
  paymentProof: z.any(),
  transactionId: z.string(),
});

export default function PaymentModal({ isOpen, onClose, chapter }: PaymentModalProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [formState, formAction] = useFormState<PaymentState, FormData>(handlePaymentVerification, {
    message: '',
  });

  const price = useMemo(
    () => (chapter ? getChapterPrice(chapter.releaseDate, chapter.basePrice) : 0),
    [chapter]
  );
  const upiUri = `upi://pay?pa=vikas@dubey&pn=Vikas%20A%20Dubey&am=${price}&cu=INR&tn=NiyatiVerse-${chapter?.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=1A1A2E&color=FFD700&qzone=1`;

  useEffect(() => {
    setPending(false);
    if (formState.message && !formState.fieldErrors) {
      if (formState.isApproved) {
        toast({
          title: 'Payment Approved!',
          description: formState.message,
          variant: 'default',
        });
        setTimeout(onClose, 1000);
      } else if(formState.error) {
         toast({
          title: 'Error',
          description: formState.message,
          variant: 'destructive',
        });
      }
      else {
        toast({
            title: 'Payment Submitted',
            description: formState.message,
            variant: 'default',
        });
        setTimeout(onClose, 1000);
      }
    }
  }, [formState, toast, onClose]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  if (!chapter) return null;

  const onFormSubmit = (data: FormData) => {
    setPending(true);
    formAction(data);
  }

  const renderContent = () => {
     if (formState.isApproved) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-bold">Payment Approved!</h3>
          <p className="text-muted-foreground">{formState.message}</p>
        </div>
      );
    }
    if (formState.isApproved === false && !formState.error) {
       return (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold">Payment Submitted</h3>
          <p className="text-muted-foreground">{formState.message}</p>
        </div>
      );
    }

    return (
       <form action={onFormSubmit}>
        <input type="hidden" name="chapterId" value={chapter.id} />
        <input type="hidden" name="expectedAmount" value={price} />
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">
            Unlock "{chapter.title}"
          </DialogTitle>
          <DialogDescription>
            Support the author by paying ₹{price}. Please complete the UPI
            payment and submit the proof.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="font-semibold">Scan to Pay</p>
            <div className="p-2 bg-primary rounded-lg">
                <Image src={qrCodeUrl} alt="UPI QR Code" width={200} height={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Or use VPA: vikas@dubey
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId">UPI Transaction ID</Label>
              <Input
                id="transactionId"
                {...register('transactionId')}
                name="transactionId"
                placeholder="e.g., 2173... or T2024..."
              />
              {(errors.transactionId || formState.fieldErrors?.transactionId) && (
                <p className="text-red-500 text-sm mt-1">{errors.transactionId?.message || formState.fieldErrors?.transactionId?.[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="paymentProof">Payment Screenshot</Label>
              <Input
                id="paymentProof"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                {...register('paymentProof')}
                name="paymentProof"
              />
              {(errors.paymentProof || formState.fieldErrors?.paymentProof) && (
                 <p className="text-red-500 text-sm mt-1">{errors.paymentProof?.message as string || formState.fieldErrors?.paymentProof?.[0]}</p>
              )}
            </div>
          </div>
        </div>
         {formState.error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-md">
                <XCircle className="h-4 w-4"/>
                <p className="text-sm">{formState.message}</p>
            </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Payment
          </Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
