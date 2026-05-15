"use client";




import dynamic from "next/dynamic";

const ZegoUIKitPrebuilt = dynamic(
  () =>
    import("@zegocloud/zego-uikit-prebuilt").then(
      (mod) => mod.ZegoUIKitPrebuilt
    ),
  { ssr: false }
);

import React, { useEffect, useRef } from "react";

function randomID(len = 5) {
  let result = "";
  const chars =
    "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";

  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export default function RoomPage() {
  const meetingRef = useRef(null);

  useEffect(() => {
    const startMeeting = async () => {
      const { ZegoUIKitPrebuilt } = await import(
        "@zegocloud/zego-uikit-prebuilt"
      );

      const roomID =
        new URLSearchParams(window.location.search).get("roomID") ||
        randomID(5);

      const userID = randomID(5);
      const userName = randomID(5);

      const appID = 2080144354;
      const serverSecret = "30a2be0f8afba2dadf71296f7fa88ba7";

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
  appID,
  serverSecret,
  roomID,
  userID,
  userName
);

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: meetingRef.current,
        sharedLinks: [
          {
            name: "Personal link",
            url:
              window.location.origin +
              window.location.pathname +
              "?roomID=" +
              roomID,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
      });
    };

    startMeeting();
  }, []);

  return (
    <div
      ref={meetingRef}
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}