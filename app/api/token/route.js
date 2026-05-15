import { generateToken04 } from "zego-server-assistant";

export async function POST(req) {
  const { userId, roomID } = await req.json();

  const appID = 2080144354;
  const serverSecret = "30a2be0f8afba2dadf71296f7fa88ba7";

  const effectiveTimeInSeconds = 3600;

  const payloadObject = {
    room_id: roomID,
    privilege: {
      1: 1,
      2: 1,
    },
    stream_id_list: null,
  };

  const payload = JSON.stringify(payloadObject);

  const token = generateToken04(
    appID,
    userId,
    serverSecret,
    effectiveTimeInSeconds,
    payload
  );

  return Response.json({ token });
}