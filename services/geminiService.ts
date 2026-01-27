
import { GoogleGenAI, Type } from "@google/genai";
import { Conversation, AnalysisResult, EngineSettings } from "../types";

const API_KEY = process.env.API_KEY;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeConversations = async (
  conversations: Conversation[],
  settings: EngineSettings,
  onProgress?: (current: number, total: number) => boolean | void,
  onStatus?: (status: 'batching' | 'consolidating') => void
): Promise<AnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const totalConvos = conversations.length;
  const batchSize = settings.batchSize;
  const numBatches = Math.ceil(totalConvos / batchSize);
  const batchResults: any[] = [];

  const msPerRequest = 60000 / settings.rpm;
  
  if (onStatus) onStatus('batching');

  // Step 1: Map - Process in batches
  for (let i = 0; i < numBatches; i++) {
    const startTime = Date.now();

    if (onProgress) {
      const shouldHalt = onProgress(i + 1, numBatches) === false;
      if (shouldHalt && batchResults.length > 0) {
        break; 
      }
    }
    
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalConvos);
    const batch = conversations.slice(start, end).map(c => ({
      id: c.id,
      domain: c.metadata?.domain || c.metadata?.domainName,
      intent: c.metadata?.primaryIntent || c.metadata?.metrics?.find(m => m.code === 'TriggeredIntent')?.value,
      topics: c.metadata?.topics?.map(t => t.topicName),
      executedGoals: c.metadata?.metrics?.find(m => m.code === 'executed_goals')?.value,
      channel: c.metadata?.initialChannel,
      resolution: c.metadata?.resolutionStatus,
      snippet: c.messages?.[0]?.text?.substring(0, 100)
    }));

    const batchPrompt = `Analyze these ${batch.length} conversation records. Identify the specific USE CASES (Vertical, Audience, Task, Channel). 
    For each use case found IN THIS BATCH, provide a count of how many conversations matched it.
    
    Data: ${JSON.stringify(batch)}`;

    const response = await ai.models.generateContent({
      model: settings.model,
      contents: batchPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            useCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  vertical: { type: Type.STRING },
                  audience: { type: Type.STRING },
                  task: { type: Type.STRING },
                  channel: { type: Type.STRING },
                  description: { type: Type.STRING },
                  count: { type: Type.NUMBER }
                },
                required: ["vertical", "audience", "task", "channel", "description", "count"]
              }
            },
            sentiment: {
              type: Type.OBJECT,
              properties: {
                positive: { type: Type.NUMBER },
                neutral: { type: Type.NUMBER },
                negative: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    try {
      batchResults.push(JSON.parse(response.text));
    } catch (e) {
      console.error("Batch parsing error", e);
    }

    if (i < numBatches - 1) {
      const elapsedTime = Date.now() - startTime;
      const waitTime = Math.max(0, msPerRequest - elapsedTime);
      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }
  }

  if (batchResults.length === 0) {
    throw new Error("No analysis data was generated.");
  }

  // Step 2: Reduce - Consolidate results
  if (onStatus) onStatus('consolidating');
  
  const consolidationPrompt = `I have analyzed a conversation report in ${batchResults.length} batches. 
  Here are the raw results: ${JSON.stringify(batchResults)}
  
  Please provide a FINAL, GLOBAL analysis for the dataset:
  1. MERGE identical or overlapping Use Cases. If the Task and Channel are the same, they MUST be merged.
  2. SUM the counts for merged use cases.
  3. Create a unified Executive Summary.
  4. Aggregate top issues and suggest improvements.
  5. Average the sentiment distribution.`;

  const finalResponse = await ai.models.generateContent({
    model: settings.model,
    contents: consolidationPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          identifiedUseCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                vertical: { type: Type.STRING },
                audience: { type: Type.STRING },
                task: { type: Type.STRING },
                channel: { type: Type.STRING },
                description: { type: Type.STRING },
                count: { type: Type.NUMBER }
              },
              required: ["vertical", "audience", "task", "channel", "description", "count"]
            }
          },
          commonPatterns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                frequency: { type: Type.STRING }
              }
            }
          },
          topIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentimentDistribution: {
            type: Type.OBJECT,
            properties: {
              positive: { type: Type.NUMBER },
              neutral: { type: Type.NUMBER },
              negative: { type: Type.NUMBER }
            }
          },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "identifiedUseCases", "commonPatterns", "topIssues", "sentimentDistribution", "keyTakeaways", "suggestedImprovements"]
      }
    }
  });

  const result = JSON.parse(finalResponse.text) as AnalysisResult;

  // Client-side deduplication safety check
  const mergedUseCases: Record<string, any> = {};
  result.identifiedUseCases.forEach(uc => {
    // Unique key based on vertical, audience, task, and channel
    const key = `${uc.vertical}|${uc.audience}|${uc.task}|${uc.channel}`.toLowerCase().replace(/\s+/g, '');
    if (mergedUseCases[key]) {
      mergedUseCases[key].count += uc.count;
    } else {
      mergedUseCases[key] = { ...uc };
    }
  });
  result.identifiedUseCases = Object.values(mergedUseCases);

  return result;
};
