
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Bell, Loader2, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { handleSubscription } from '@/app/actions';

export default function SubscribeCard() {
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(handleSubscription, { message: '' });
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        toast({
          title: 'Subscription Failed',
          description: formState.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Subscription Confirmed!',
          description: formState.message,
        });
        setEmail(''); // Clear input on success
        setPhone(''); // Clear input on success
      }
    }
  }, [formState, toast]);

  return (
    <Card className="mt-12">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline flex items-center justify-center gap-3">
            <Bell className="text-primary"/>
            Never Miss an Update
        </CardTitle>
        <CardDescription>
          Subscribe to get notified via email or WhatsApp when new chapters are released.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="w-full max-w-lg mx-auto space-y-4">
          <div className="relative">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                type="email" 
                name="email"
                placeholder="your.email@example.com" 
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>
          <div className="relative">
             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                type="tel" 
                name="phone"
                placeholder="WhatsApp Number (Optional)" 
                className="pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 animate-spin" />}
            Subscribe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
