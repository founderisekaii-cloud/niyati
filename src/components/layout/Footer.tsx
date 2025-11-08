import React from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
  const email = 'satyafromniyati@gmail.com';
  const phone = '8850970654';

  return (
    <footer className="z-10 relative border-t border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container flex flex-col items-center justify-center gap-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-sm text-foreground/60">
          © {new Date().getFullYear()} NiyatiVerse. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-foreground/60 transition-colors hover:text-primary"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </Link>
          <Link
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-foreground/60 transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" />
             <span className="hidden sm:inline">WhatsApp</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
