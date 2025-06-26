'use client';
import dynamic from 'next/dynamic';

const VideoCall = dynamic(() => import('../Components/VideoCall/videoCall'), {
  ssr: false,
});

export default function Page() {
  return <VideoCall />;
}
