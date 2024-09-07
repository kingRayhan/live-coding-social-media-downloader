import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { s3Client } from "./s3.client";

const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export const videoDeletionQueue = new Queue("file-deletion-queue", {
  connection: redis,
});

new Worker(
  "file-deletion-queue",
  async (job) => {
    console.log("Job", JSON.stringify(job));
    const s3Key = job.data.s3Key;
    const deleteCommend = new DeleteObjectCommand({
      Bucket: "social-media-downloader-files",
      Key: s3Key,
    });
    await s3Client.send(deleteCommend);
    console.log("Deleted file from s3");
  },
  { connection: redis }
);
