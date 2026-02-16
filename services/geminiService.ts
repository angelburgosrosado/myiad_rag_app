
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, DocumentFile, RAGMode } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async summarize(documents: DocumentFile[]): Promise<string> {
    if (documents.length === 0) return "No documents to summarize.";
    
    let prompt = "Please provide a comprehensive summary of the following documents. Identify the main topics, key themes, and how they relate to each other if applicable.\n\nDOCUMENTS:\n";
    documents.forEach(doc => {
      prompt += `\n--- DOCUMENT: ${doc.name} ---\n${doc.content}\n`;
    });

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are an expert document analyst. Provide clear, structured, and insightful summaries of provided text data."
        }
      });
      return response.text || "Failed to generate summary.";
    } catch (error) {
      console.error("Summary error:", error);
      throw error;
    }
  }

  async chat(
    messages: Message[], 
    documents: DocumentFile[], 
    mode: RAGMode
  ): Promise<{ text: string; sources: any[] }> {
    const modelName = 'gemini-3-pro-preview';
    
    let systemInstruction = "You are Nexus, a specialized RAG assistant. ";
    
    if (mode === RAGMode.LONG_CONTEXT && documents.length > 0) {
      systemInstruction += `
You have access to ${documents.length} documents provided below. 
Your primary goal is to answer questions based STRICTLY on these documents.
If a question cannot be answered using the documents, clearly state: "I cannot find the answer in the provided context."
Keep your answers professional, accurate, and concise unless a detailed explanation is requested.

DOCUMENTS CONTEXT:
`;
      documents.forEach(doc => {
        systemInstruction += `\n--- START DOC: ${doc.name} ---\n${doc.content}\n--- END DOC ---\n`;
      });
    } else if (mode === RAGMode.SEARCH_GROUNDING) {
      systemInstruction += "Use Google Search grounding to provide real-time, accurate information. Cite your sources with the provided URLs.";
    }

    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const config: any = {
      systemInstruction,
      temperature: 0.1, // High precision for RAG
    };

    if (mode === RAGMode.SEARCH_GROUNDING) {
      config.tools = [{ googleSearch: {} }];
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: modelName,
        contents,
        config
      });

      const text = response.text || "No response generated.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return {
        text,
        sources: groundingChunks
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
