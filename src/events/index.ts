import { Socket } from "socket.io";
import { IncomingMessage } from "http";
import { SpeechClient } from "@google-cloud/speech";

interface CustomRequest extends IncomingMessage {
  user: { firstName: string; lastName: string; username: string };
  room: string;
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set"
  );
}

const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

if (!speechClient) {
  throw new Error("Failed to create SpeechClient");
}

export const socketConnectionHandler = async (
  socket: Socket
): Promise<void> => {
  const { user, room } = socket.request as CustomRequest;
  let recognizeStream: ReturnType<
    typeof speechClient.streamingRecognize
  > | null = null;

  socket.join(room);
  console.log(`${user?.username} joined room: ${room}`);

  socket.on("connected", () => console.log("socket connected"));
  socket.emit("notification", { message: "Welcome!" });

  socket.on("startGoogleCloudStream", (audioConfig) => {
    console.log("Starting Google Cloud Stream", audioConfig);

    // Close existing stream if any
    if (recognizeStream) {
      recognizeStream.destroy();
    }

    try {
      recognizeStream = speechClient
        .streamingRecognize({
          config: {
            encoding: audioConfig.encoding || "LINEAR16",
            sampleRateHertz: audioConfig.sampleRateHertz || 16000,
            languageCode: audioConfig.languageCode || "en-US",
            model: "default", // Add model specification
            enableAutomaticPunctuation: true,
            useEnhanced: true, // Use enhanced model if available
          },
          interimResults: true,
        })
        .on("error", (error) => {
          console.error("Recognition error:", error);
          socket.emit("error", { error: error.message });
          recognizeStream = null;
        })
        .on("data", (data) => {
          console.log(
            "Received data from Google Cloud:",
            JSON.stringify(data, null, 2)
          );
          if (
            data.results &&
            data.results[0] &&
            data.results[0].alternatives[0]
          ) {
            const transcription = data.results[0].alternatives[0].transcript;
            const isFinal = data.results[0].isFinal;

            console.log(
              `Transcription: ${transcription} (${
                isFinal ? "final" : "interim"
              })`
            );

            socket.emit("transcription", {
              transcription,
              isFinal,
            });
          }
        })
        .on("end", () => {
          console.log("Recognition stream ended");
          recognizeStream = null;
        });

      console.log("Google Cloud Stream started successfully");
    } catch (error) {
      console.error("Error starting recognition stream:", error);
      socket.emit("error", { error: "Failed to start recognition stream" });
    }
  });

  socket.on("audioData", (data) => {
    // Validate audio data
    if (
      !data ||
      (typeof data !== "string" &&
        !Buffer.isBuffer(data) &&
        !(data instanceof ArrayBuffer))
    ) {
      console.error("Invalid audio data format received:", typeof data);
      return;
    }

    // Convert to Buffer if needed
    let audioBuffer: Buffer;
    try {
      if (Buffer.isBuffer(data)) {
        audioBuffer = data;
      } else if (typeof data === "string") {
        audioBuffer = Buffer.from(data, "base64");
      } else if (data instanceof ArrayBuffer) {
        audioBuffer = Buffer.from(new Uint8Array(data));
      } else {
        throw new Error("Unsupported audio data type");
      }
    } catch (e) {
      console.error("Failed to convert audio data to Buffer:", e);
      return;
    }

    console.log(`Received ${audioBuffer.length} bytes of audio data`);
    if (recognizeStream && !recognizeStream.destroyed) {
      try {
        recognizeStream.write(data);
      } catch (error) {
        console.error("Error writing audio data:", error);
        socket.emit("error", { error: "Failed to process audio chunk" });
      }
    }
  });

  // Stop the recognition stream
  socket.on("endGoogleCloudStream", () => {
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.end();
      recognizeStream = null;
      console.log("Google Cloud Stream ended by client request");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }
  });
};
