
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Book, User } from 'lucide-react';
import { NiyatiVerseLogo } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { t, currentLanguage } = useTranslation();
    const [welcomeText, setWelcomeText] = useState('Welcome');

    useEffect(() => {
        if(currentLanguage === 'en') {
            setWelcomeText('Welcome');
            return;
        }

        const translateWelcome = async () => {
            const translated = await t('Welcome');
            setWelcomeText(translated);
        }
        translateWelcome();
    }, [currentLanguage, t]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">{welcomeText}, {user?.displayName || 'Reader'}</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unlocked Chapters</CardTitle>
                        <Book className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">You have access to 1 chapter.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Reader</div>
                        <p className="text-xs text-muted-foreground">Your role in the NiyatiVerse.</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Your Journey</CardTitle>
                    <CardDescription>
                        Continue your reading adventure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <NiyatiVerseLogo className="size-12 text-primary" />
                        <p className="text-muted-foreground">Your reading progress and unlocked content will appear here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
