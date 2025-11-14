
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SubscribeCard() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubscribe = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, you would send this email to your backend/mailing list service.
    toast({
      title: 'Subscription Confirmed!',
      description: `We'll notify ${email} when new chapters are released.`,
    });
    setEmail('');
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
        <div className="flex flex-col sm:flex-row w-full max-w-lg mx-auto items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-grow w-full">
             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                type="email" 
                placeholder="your.email@example.com" 
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" onClick={handleSubscribe} className="w-full sm:w-auto">
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
