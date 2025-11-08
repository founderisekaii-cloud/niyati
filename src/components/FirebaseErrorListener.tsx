'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { auth } from '@/lib/firebase';

async function getAuthDetails() {
  const user = auth.currentUser;
  if (!user) return null;

  const idTokenResult = await user.getIdTokenResult();
  return {
    uid: user.uid,
    token: idTokenResult.claims,
  };
}

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = async (permissionError: FirestorePermissionError) => {
      const authDetails = await getAuthDetails();
      const contextualError = {
        message: 'Firestore Security Rules: Permission Denied',
        details: {
          auth: authDetails,
          request: {
            path: permissionError.context.path,
            method: permissionError.context.operation,
            resource: permissionError.context.requestResourceData,
          },
        },
      };

      // In a Next.js development environment, uncaught errors
      // are displayed in a development overlay.
      throw new Error(JSON.stringify(contextualError, null, 2));
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}