import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PaymentsAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Manage Payments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and approve incoming payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A list of successful and pending payments will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
