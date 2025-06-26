'use client';

import React, { useRef, useState } from 'react';
import {
  CallClient,
  LocalVideoStream,
} from '@azure/communication-calling';

import {
  AzureCommunicationTokenCredential,
} from '@azure/communication-common';

import { v4 as uuidv4 } from 'uuid'; // For unique group ID

const VideoCall = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [groupId, setGroupId] = useState(uuidv4());
  const [call, setCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const generateTokenAndId = async () => {
    const response = await fetch('https://azure-backend-1.onrender.com/token');
    const data = await response.json();
    return {
      token: data.token,
      userId: data.userId,
    };
  };

  const startCall = async () => {
    const { token } = await generateTokenAndId();

    const callClient = new CallClient();
    const tokenCredential = new AzureCommunicationTokenCredential(token);
    const callAgent = await callClient.createCallAgent(tokenCredential);

    const deviceManager = await callClient.getDeviceManager();
    await deviceManager.askDevicePermission({ video: true, audio: true });

    const cameras = await deviceManager.getCameras();
    const localStream = new LocalVideoStream(cameras[0]);

    const localMediaStream = await localStream.getMediaStream();
    localVideoRef.current.srcObject = localMediaStream;

    const activeCall = await callAgent.join(
      { groupId },
      {
        videoOptions: { localVideoStreams: [localStream] },
      }
    );

    activeCall.on('remoteParticipantsUpdated', (e) => {
      e.added.forEach((participant) => {
        participant.on('videoStreamsUpdated', (streamEvent) => {
          streamEvent.added.forEach(async (stream) => {
            const remoteMediaStream = await stream.getMediaStream();
            remoteVideoRef.current.srcObject = remoteMediaStream;
          });
        });
      });
    });

    setCall(activeCall); // Store call to handle mute/end
  };

  const handleMute = async () => {
    if (!call) return;
    if (isMuted) {
      await call.unmute();
    } else {
      await call.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleEndCall = () => {
    if (call) {
      call.hangUp();
      setCall(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Azure Video Call</h1>

      <input
        className="border px-3 py-2 mr-2"
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        placeholder="Enter Group ID"
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-yellow-500"
        onClick={startCall}
      >
        Join Call
      </button>

      {/* Call Controls (Mute & End) */}
      {call && (
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleMute}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={handleEndCall}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            End Call
          </button>
        </div>
      )}

      <div className="flex gap-6 mt-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Your Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-80 h-60 bg-black rounded"
          />
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-80 h-60 bg-black rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
