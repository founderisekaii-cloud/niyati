import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SettingsAdminPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure UPI and Razorpay payment details. System will auto-detect
            valid Razorpay keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-vpa">UPI VPA (Virtual Payment Address)</Label>
            <Input id="upi-vpa" placeholder="your-name@bank" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razorpay-key">Razorpay Key ID</Label>
            <Input id="razorpay-key" placeholder="rzp_test_..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razorpay-secret">Razorpay Key Secret</Label>
            <Input
              id="razorpay-secret"
              type="password"
              placeholder="••••••••••••••••"
            />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
