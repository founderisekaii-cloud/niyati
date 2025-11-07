import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, CreditCard, Settings, Users } from 'lucide-react';

const stats = [
  {
    title: 'Total Chapters',
    value: '4',
    icon: BookOpen,
    description: 'Number of published chapters.',
  },
  {
    title: 'Pending Payments',
    value: '3',
    icon: CreditCard,
    description: 'Manual verification required.',
  },
  {
    title: 'Subscribers',
    value: '1,204',
    icon: Users,
    description: 'Users opted-in for notifications.',
  },
  {
    title: 'Payment Mode',
    value: 'Manual UPI',
    icon: Settings,
    description: 'Razorpay keys not detected.',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A log of recent payments and system events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
