"use client";

import { MainLayout } from '@/components/layout/MainLayout';
import { PreviewPlayer } from '@/components/editor/PreviewPlayer';
import { Timeline } from '@/components/editor/Timeline';
import { EditorProvider } from '@/components/editor/EditorContext';

export default function Home() {
  return (
    <EditorProvider>
      <MainLayout>
        <PreviewPlayer />
        <Timeline />
      </MainLayout>
    </EditorProvider>
  );
}
