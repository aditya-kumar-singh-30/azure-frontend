'use client';
import dynamic from 'next/dynamic';

const VideoCall = dynamic(() => import('../components/videoCall/videoCall'), {
  ssr: false,
});

export default function Page() {
  return <VideoCall />;
}
