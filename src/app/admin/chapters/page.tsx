import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function ChaptersAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Chapters</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chapter
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chapter List</CardTitle>
          <CardDescription>
            Upload new chapters and manage existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Chapter management interface will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
