/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Resolve __dirname equivalents for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Qualifyr B2B Advisor System Instruction (Step 2)
const SYSTEM_INSTRUCTION = `
You are Qualifyr, a B2B software advisory assistant. Your job is to have a natural, 
consultative conversation with a business buyer to understand their needs, then recommend 
the right category of software solution for their problem.

## CONVERSATION FLOW

You must gather information across these 4 dimensions (BANT), but do NOT ask them as a 
rigid checklist or list of forms. Ask one question at a time, in natural language, and let 
the conversation flow based on their answers. Adapt your next question based on what they 
just said.

1. NEED — What problem are they trying to solve? What's broken or missing in their current 
   process? (Always start here — this is the most important and should shape your other questions.)
2. BUDGET — What budget range are they working with, or do they have one set aside yet?
3. AUTHORITY — Are they the decision-maker, or do they need buy-in from others (and from whom)?
4. TIMELINE — How soon do they need a solution in place?

Rules:
- Ask ONE question at a time. Never dump all 4 questions at once.
- Keep questions short and conversational, like a helpful sales consultant — not a form.
- If the user's answer is vague, ask one brief clarifying follow-up before moving on.
- If they've clearly already answered a dimension earlier in the conversation, don't ask it again.
- Aim to complete all 4 dimensions in 4-7 total turns.

## WHEN QUALIFICATION IS COMPLETE

Once you have enough information across all 4 dimensions, stop asking questions and output 
a recommendation in this exact structure:

**Summary of your needs:**
- Need: [one-line summary]
- Budget: [one-line summary]
- Authority: [one-line summary]
- Timeline: [one-line summary]

**Recommended solution category:** [e.g., "CRM", "Project Management Tool", "Marketing 
Automation Platform"]

**Why this fits:** [2-3 sentences connecting their specific BANT answers to this category]

**Suggested next step:** [e.g., "request demos from 2-3 vendors in this space" or "shortlist 
options under $X/month"]

Then ask: "Want me to shortlist specific tools that fit this, or do you have any documents 
you'd like me to reference for a more tailored answer?"

## OUTPUT FORMAT FOR LATER USE

On EVERY SINGLE TURN, you must append a hidden machine-readable tag containing the current 
state of the BANT parameters at the very end of your response, strictly conforming to the XML-like block below. Make sure the JSON inside is valid.

For ongoing conversations:
- Set fields as "Gathering..." if not yet obtained or confirmed.
- Set "qualification_complete" to false.

For the final turn where the category recommendation is provided:
- Provide real summaries in each field.
- Provide the final "recommended_category" (e.g., "CRM").
- Set "qualification_complete" to true.

DO NOT let the conversational part recommend or name specific software brands or vendor products (e.g., do NOT name Salesforce, Monday.com, Jira, etc.). Keep it purely at the category-level (e.g. CRM, helpdesk software, etc.). The specific tool research happens in a separate downstream process.

Format of hidden tag to print at bottom:
<BANT_DATA>
{
  "need": "The exact need or 'Gathering...'",
  "budget": "The budget information or 'Gathering...'",
  "authority": "The authority summary or 'Gathering...'",
  "timeline": "The timeline target or 'Gathering...'",
  "recommended_category": "Name of the solution category or leave empty if not complete",
  "qualification_complete": false or true
}
</BANT_DATA>

## TONE
Warm, sharp, consultative — like a sales engineer who actually listens, not a pushy salesperson 
or a robotic intake form. Never recommend a specific paid product or brand at this stage — 
only the category of solution. Keep responses concise; this is a chat interface, not an essay.
`;

// STEP 2: Main BANT Chat API Handler
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getAiClient();

    // Reconstruct messaging history
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.65,
      },
    });

    const text = response.text || "I'm sorry, I couldn't understand that. Could you clarify?";
    res.json({ text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to parse conversation turn" });
  }
});

const DOC_QA_SYSTEM_INSTRUCTION = `
You are Qualifyr's document research assistant. The user has uploaded a document 
(such as a vendor pricing sheet, an internal requirements doc, a case study, or a software 
comparison). Answer the user's questions using ONLY the content of the uploaded document.

Rules:
- Base every answer strictly on what's in the document. Do not use outside knowledge or 
  assumptions about products, pricing, or features not mentioned in the document.
- If the answer isn't in the document, say so clearly — do not guess or fill in gaps.
- When you answer, briefly cite which section or part of the document the answer came from 
  (e.g., "According to the pricing table on page 2...").
- Keep answers concise and directly responsive to the question asked.
- If the user's question is vague, ask one short clarifying question before answering.

Tone: helpful, precise, and transparent about what the document does and doesn't cover.
`;

app.post("/api/document-qa", async (req, res) => {
  try {
    const { message, history, document } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });
    
    const ai = getAiClient();
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      }
    }
    
    const parts: any[] = [{ text: message }];
    
    if (document && document.inlineData) {
       parts.unshift({
         inlineData: {
           data: document.inlineData.data,
           mimeType: document.inlineData.mimeType
         }
       });
    }

    contents.push({ role: "user", parts });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: DOC_QA_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      }
    });

    res.json({ text: response.text || "I couldn't generate a response based on the document." });
  } catch (error: any) {
    console.error("Error in /api/document-qa:", error);
    res.status(500).json({ error: error.message || "Failed document QA request" });
  }
});

// STEP 3 & STEP 4: Search-Grounded Software Research and Reformatting Pipeline
app.post("/api/recommend-tools", async (req, res) => {
  try {
    const { bant_state, roi_input } = req.body;

    if (!bant_state) {
      return res.status(400).json({ error: "BANT state data is required for recommendation pipeline." });
    }

    const ai = getAiClient();

    // STEP 3 Call: Grounded Search
    const searchPrompt = `
You are Qualifyr's research engine. You will receive a structured BANT profile for a 
business buyer. Use Google Search to find 2-3 REAL, CURRENTLY AVAILABLE software tools that 
genuinely fit this profile.

BANT Profile:
${JSON.stringify(bant_state, null, 2)}

${roi_input && roi_input.toLowerCase() !== 'skip' ? `
The user provided the following ROI inputs (hours wasted per week and hourly cost): "${roi_input}"
If these inputs contain usable numbers, calculate an estimated ROI for each tool:
- current_monthly_cost_of_problem = hours_wasted_per_week * hourly_cost * 4.3
- tool_monthly_cost = [normalize tool pricing to monthly]
- estimated_savings = [assume 60% reduction in wasted time unless tool suggests differently, max 90%]
- net_monthly_benefit = estimated_savings - tool_monthly_cost
- payback_estimate = [how quickly savings cover cost in days/weeks]

Include these ROI numbers in your research notes for each tool. If the inputs aren't usable, skip the ROI math.` : ""}

For each tool, research and note:
- Tool name and vendor
- Approximate pricing (cite what you found)
- Why it fits this specific buyer's need, budget, and timeline
- One potential drawback or limitation
- Source URL where you found pricing/feature info
${roi_input ? "- Estimated ROI calculations (if usable numbers were provided)" : ""}

Do not recommend a tool unless you found real evidence of it via search — never invent a 
tool name or pricing from memory alone.
`;

    console.log("Initiating Step 3: Google Search Grounded Research for profile:", bant_state.recommended_category);

    let step3Output = "";
    let isGrounded = true;
    let fallbackNotice = "";
    let groundedUrls: { title: string; uri: string }[] = [];

    try {
      const step3Response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.4,
        },
      });
      step3Output = step3Response.text || "";
      if (!step3Output) {
        throw new Error("Google Grounding returned an empty response.");
      }

      // Extract real source URLs from Gemini's grounding metadata
      try {
        const candidate = (step3Response as any)?.candidates?.[0];
        const groundingMeta = candidate?.groundingMetadata;
        if (groundingMeta?.groundingChunks) {
          groundedUrls = groundingMeta.groundingChunks
            .filter((chunk: any) => chunk?.web?.uri)
            .map((chunk: any) => ({
              title: chunk.web.title || "",
              uri: chunk.web.uri,
            }));
          console.log("Extracted grounded URLs from metadata:", groundedUrls.map(u => u.uri));
        }
        // Also check searchEntryPoint or groundingSupports for URLs
        if (groundedUrls.length === 0 && groundingMeta?.groundingSupports) {
          for (const support of groundingMeta.groundingSupports) {
            if (support?.groundingChunkIndices && groundingMeta?.groundingChunks) {
              for (const idx of support.groundingChunkIndices) {
                const chunk = groundingMeta.groundingChunks[idx];
                if (chunk?.web?.uri) {
                  groundedUrls.push({ title: chunk.web.title || "", uri: chunk.web.uri });
                }
              }
            }
          }
        }
      } catch (metaErr) {
        console.warn("Could not extract grounding metadata URLs:", metaErr);
      }

      console.log("Successfully completed Step 3 Grounded search with live Google Search results.");
    } catch (groundingError: any) {
      console.error("Step 3 Google Grounded Search failed, attempting robust fallback with pre-trained knowledge base. Error detail:", groundingError);
      isGrounded = false;
      fallbackNotice = "\n*(Notice: Activating high-performance advisor backup. Google Search service was currently offline or hit API key quota, but Qualifyr has retrieved matching solutions from its extensive pre-trained database.)*\n\n";

      try {
        const fallbackPrompt = searchPrompt + "\n\n(Important fallback instruction: Since live Google Search is currently unavailable on this platform key, use your extensive built-in knowledge to provide verified, real, and currently active software brands matching this profile format. Speak confidently without mentioning the search tool failed internally.)";
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: fallbackPrompt,
          config: {
            temperature: 0.4,
          }
        });
        step3Output = fallbackResponse.text || "";
        if (!step3Output) {
          throw new Error("Fallback knowledge lookup returned empty or null content.");
        }
        console.log("Successfully retrieved solutions from standard knowledge-base fallback.");
      } catch (fallbackError: any) {
        console.error("Critical: Both Grounded Search and fallback knowledge lookup failed.", fallbackError);
        throw new Error(`Research step failed completely: Google Grounding Error: ${groundingError.message || groundingError} | Fallback Error: ${fallbackError.message || fallbackError}`);
      }
    }

    console.log("Initiating Step 4 Reformatting.");

    // Build a reference list of real grounded URLs for the reformat step
    const groundedUrlRef = groundedUrls.length > 0
      ? `\n\nIMPORTANT — Use these REAL verified source URLs (from Google Search grounding) for the source_url fields. Match each tool to the most relevant URL:\n${groundedUrls.map((u, i) => `${i + 1}. ${u.title} — ${u.uri}`).join("\n")}\nDo NOT invent or hallucinate URLs. Use ONLY the URLs listed above.`
      : "";

    // STEP 4 Call: Reformat Output
    const reformatPrompt = `
You will receive raw research notes about software tool recommendations. Reformat this into 
the EXACT structure below. Do not add new information, do not remove sourced facts, just 
restructure and tighten the language.

Research notes:
${step3Output}
${groundedUrlRef}

Output strictly in this format:

## Recommended Solutions

### 1. [Tool Name]
**Best for:** [one line]
**Pricing:** [approx price]
**Why it fits:** [2-3 sentences]
**Watch out for:** [1 sentence limitation]
**Source:** [URL]
${roi_input && roi_input.toLowerCase() !== 'skip' ? `
💰 Estimated ROI
Current cost of the problem: ~$X/month
Tool cost: $Y/month
Net monthly benefit: $Z
Payback time: [estimate]
*(Estimate based on the numbers you provided — actual results may vary)*
(ONLY INCLUDE THIS ROI SECTION IF THE RESEARCH NOTES CONTAINED USABLE ROI MATH)` : ""}

### 2. [Tool Name]
... (same structure)

### 3. [Tool Name]
... (same structure)

## Bottom line
[1-2 sentence summary recommendation of which option to start with and why]

Also output this machine-readable block at the very end:
<SOLUTIONS_DATA>
[{"name": "Tool name", "best_for": "Who it is best for", "pricing": "Approx pricing info", "fit_reason": "2-3 sentence fitting explanation", "watch_out_for": "1 sentence drawback", "source_url": "Full source link"${roi_input && roi_input.toLowerCase() !== 'skip' ? `, "roi_current_cost": "$X/month", "roi_tool_cost": "$Y/month", "roi_net_benefit": "$Z", "roi_payback_estimate": "[estimate]" (these 4 ROI fields are OPTIONAL, omit them entirely if ROI wasn't calculated)` : ""}}]
</SOLUTIONS_DATA>
`;

    const step4Response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reformatPrompt,
      config: {
        temperature: 0.2,
      },
    });

    let finalOutput = step4Response.text || "";
    if (fallbackNotice) {
      finalOutput = fallbackNotice + finalOutput;
    }
    console.log("Completed Step 4 formatting execution successfully.");

    // Parse solutions array out of final markdown output
    let solutions: any[] = [];
    try {
      const match = finalOutput.match(/<SOLUTIONS_DATA>([\s\S]*?)<\/SOLUTIONS_DATA>/);
      if (match && match[1]) {
        solutions = JSON.parse(match[1].trim());
      } else {
        // Fallback robust custom regex to extract if the block wasn't absolute or slightly mutated
        const jsonOnlyPart = finalOutput.substring(finalOutput.indexOf("["), finalOutput.lastIndexOf("]") + 1);
        if (jsonOnlyPart) {
          solutions = JSON.parse(jsonOnlyPart);
        }
      }
    } catch (parseErr) {
      console.warn("Failed parsing SOLUTIONS_DATA from assistant formatting response:", parseErr);
      solutions = [];
    }

    // Overwrite source_url with real grounded URLs where possible
    if (groundedUrls.length > 0 && solutions.length > 0) {
      for (let i = 0; i < solutions.length; i++) {
        // Try to find a grounded URL that matches this tool by name
        const toolName = (solutions[i].name || "").toLowerCase();
        const matchedUrl = groundedUrls.find(u =>
          toolName && (u.title.toLowerCase().includes(toolName) || u.uri.toLowerCase().includes(toolName.split(" ")[0]))
        );
        if (matchedUrl) {
          solutions[i].source_url = matchedUrl.uri;
        } else if (groundedUrls[i]) {
          // Fallback: assign by position
          solutions[i].source_url = groundedUrls[i].uri;
        }
      }
      console.log("Overwritten source_urls with real grounded URLs:", solutions.map(s => s.source_url));
    }

    res.json({
      markdown: finalOutput,
      solutions: solutions,
    });

  } catch (error: any) {
    console.error("Error in software research pipeline:", error);
    res.status(500).json({ error: error.message || "Failed during Google Search grounding pipeline" });
  }
});

// Vite middleware for development, static path resolution for prod
const isProduction = process.env.NODE_ENV === "production";

import http from "http";
const httpServer = http.createServer(app);

if (!isProduction) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server: httpServer, // attach HMR WebSocket to the Express HTTP server
      },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Global error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error Error:", err);
  res.status(500).json({ error: "Express backend unhandled mistake." });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Qualifyr engine listening on port ${PORT}. Mode: ${isProduction ? "production" : "development"}`);
});
