import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import express, { Request } from "express";

import cors from "cors";
import { exec as commandExecuter } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { videoDeletionQueue } from "./tasks";
import { s3Client } from "./s3.client";

/**
 * Load environment variables from .env file
 */
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "API is running! 🔥🔥🔥",
  });
});

// api.downloader.com/download
// > POST { url: '' }

app.post("/download", async (req: Request, res) => {
  const url = req.body.url;

  const schema = z.object({
    url: z.string().url(),
  });
  const _validated = schema.safeParse(req.body);

  if (_validated.error) {
    return res.status(422).json(_validated.error);
  }

  // comand
  // ./yt-dlp -o "{randomID}.mp4" -f "[ext=mp4]" {url}
  const cliLocation = path.resolve(__dirname, "../cli/yt-dlp");
  const videoID = randomUUID();
  const projectRootPath = path.resolve(__dirname, "../");

  const download = await promisify(commandExecuter)(
    `${cliLocation} -o "${projectRootPath}/downloads/${videoID}.mp4" -f "[ext=mp4]" ${_validated.data.url}`
  );

  console.log(download);

  // upload file to s3
  const putObjectCommand = new PutObjectCommand({
    Bucket: "social-media-downloader-files",
    Key: `${videoID}.mp4`,
    Body: fs.readFileSync(`${projectRootPath}/downloads/${videoID}.mp4`),
  });

  await s3Client.send(putObjectCommand);

  // generate a signed url
  const downloadUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: "social-media-downloader-files",
      Key: `${videoID}.mp4`,
    }),
    { expiresIn: 30 }
  );

  fs.unlinkSync(`${projectRootPath}/downloads/${videoID}.mp4`);

  // Run a queue to delete file from s3
  // trigger a task with some meta data
  videoDeletionQueue.add(
    "file-deletion-queue",
    { s3Key: `${videoID}.mp4` },
    { delay: 1000 * 60 * 60 * 24 }
  );

  res.json({
    downloadUrl,
    fileName: `${videoID}.mp4`,
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
