/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `...`; // keep exactly as you had it
const DOC_QA_SYSTEM_INSTRUCTION = `...`; // keep exactly as you had it

app.post("/api/chat", async (req, res) => {
  // ...keep this handler exactly as it is
});

app.post("/api/document-qa", async (req, res) => {
  // ...keep this handler exactly as it is
});

app.post("/api/recommend-tools", async (req, res) => {
  // ...keep this handler exactly as it is
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Express backend unhandled error." });
});

export default app;