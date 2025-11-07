import React from 'react';

export default function Footer() {
  return (
    <footer className="z-10 relative border-t border-border/40">
      <div className="container flex items-center justify-center py-4">
        <p className="text-sm text-foreground/60">
          © {new Date().getFullYear()} NiyatiVerse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
