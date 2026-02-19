// src/ai/gemini.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('⚠️  GEMINI_API_KEY not found in environment variables');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.isConfigured = true;
      this.logger.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI:', error.message);
    }
  }

  onModuleInit() {
    if (!this.isConfigured) {
      this.logger.error('❌ Gemini AI service is not configured. Please check GEMINI_API_KEY in .env file');
    }
  }

  private buildSystemPrompt(diagnosisData?: any): string {
    let prompt = `You are VDerm-X AI, a specialized veterinary assistant focusing on cattle diseases, particularly Lumpy Skin Disease (LSD).

Your role:
- Provide accurate information about cattle diseases
- Explain diagnosis results in simple, farmer-friendly terms
- Suggest treatment steps (always recommend veterinary consultation)
- Address farmer concerns with empathy and understanding
- Use simple language that farmers can easily understand
- NEVER give definitive diagnosis - clarify AI limitations
- Always emphasize the importance of physical veterinary examination\n\n`;

    if (diagnosisData) {
      prompt += `Recent Diagnosis Context:
- Disease Classification: ${diagnosisData.prediction?.classification || diagnosisData.classification}
- Confidence Level: ${this.formatConfidence(diagnosisData.prediction?.confidence || diagnosisData.confidence)}
- Date: ${diagnosisData.timestamp || 'Recent'}

Based on this diagnosis result, provide helpful information and answer the user's questions.\n\n`;
    }

    return prompt;
  }

  private formatConfidence(confidence: number[]): string {
    if (!confidence || confidence.length < 2) return 'N/A';
    const lumpyProb = (confidence[0] * 100).toFixed(1);
    const notLumpyProb = (confidence[1] * 100).toFixed(1);
    return `Lumpy: ${lumpyProb}%, Not Lumpy: ${notLumpyProb}%`;
  }

  async sendMessage(
    userMessage: string,
    conversationHistory: any[] = [],
    diagnosisData?: any,
  ): Promise<string> {
    if (!this.isConfigured || !this.model) {
      this.logger.error('Gemini AI is not configured');
      return 'I apologize, but the AI service is not properly configured. Please contact the administrator to set up the GEMINI_API_KEY in the environment variables.';
    }

    try {
      // Build the full conversation context
      const systemPrompt = this.buildSystemPrompt(diagnosisData);
      
      // Format conversation history for Gemini
      let fullPrompt = systemPrompt;
      
      if (conversationHistory.length > 0) {
        // Include last 10 messages for context
        const recentHistory = conversationHistory.slice(-10);
        fullPrompt += 'Previous conversation:\n';
        recentHistory.forEach(msg => {
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          fullPrompt += `${role}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }

      fullPrompt += `User: ${userMessage}\nAssistant:`;

      this.logger.log('Sending message to Gemini AI...');
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log('Received response from Gemini AI');
      return text;

    } catch (error) {
      this.logger.error('Gemini AI error:', error.message);
      
      // Return helpful fallback message
      if (error.message?.includes('API key')) {
        return 'I apologize, but the AI service is not properly configured. Please contact support for assistance with your cattle health concerns.';
      }
      
      return 'I apologize, but I encountered an error processing your request. Please try again or consult with a veterinarian for immediate assistance.';
    }
  }

  async generateConversationTitle(firstMessage: string, diagnosisData?: any): Promise<string> {
    if (diagnosisData?.prediction?.classification || diagnosisData?.classification) {
      const classification = diagnosisData.prediction?.classification || diagnosisData.classification;
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Chat about ${classification} - ${date}`;
    }

    // Generate title from first message
    const shortMessage = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    return `Chat: ${shortMessage}`;
  }
}
