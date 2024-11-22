"use client";

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const FormattedWordsProvider = dynamic(
  () => import('@/app/contexts/FormattedWordsContext').then((mod) => mod.FormattedWordsProvider as any),
  { ssr: false }
) as any;

export const DynamicFormattedWordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormattedWordsProvider>{children}</FormattedWordsProvider>
    </Suspense>
  );
};