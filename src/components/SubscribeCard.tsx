
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Bell, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';
import { handleSubscription } from '@/app/actions';

export default function SubscribeCard() {
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(handleSubscription, { message: '' });
  const [email, setEmail] = useState('');

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
      }
    }
  }, [formState, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formAction(formData);
  };

  return (
    <Card className="mt-12">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline flex items-center justify-center gap-3">
            <Bell className="text-primary"/>
            Never Miss an Update
        </CardTitle>
        <CardDescription>
          Subscribe to get notified via email when new chapters are released.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full max-w-lg mx-auto items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-grow w-full">
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
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending && <Loader2 className="mr-2 animate-spin" />}
            Subscribe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
