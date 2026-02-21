// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatConversation, ChatConversationDocument } from './schema/chat-conversation.schema';
import { ChatMessage, ChatMessageDocument } from './schema/chat-message.schema';
import { DiagnosisHistory, DiagnosisHistoryDocument } from '../diagnosis/schema/diagnosis-history.schema';
import { GeminiService } from '../ai/gemini.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatConversation.name) private conversationModel: Model<ChatConversationDocument>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
    @InjectModel(DiagnosisHistory.name) private diagnosisModel: Model<DiagnosisHistoryDocument>,
    private readonly geminiService: GeminiService,
  ) {}

    async createConversation(
    userId: string,
    diagnosisId?: string,
    title?: string,
  ): Promise<ChatConversation> {
    let diagnosisData = null;
    let conversationTitle = title;

    // If diagnosisId is provided, fetch diagnosis data and generate title
    if (diagnosisId) {
      diagnosisData = await this.diagnosisModel.findById(diagnosisId);
      if (!diagnosisData) {
        throw new NotFoundException('Diagnosis not found');
      }
      
      if (!conversationTitle) {
        conversationTitle = await this.geminiService.generateConversationTitle(
          'Diagnosis discussion',
          diagnosisData,
        );
      }
    }

    if (!conversationTitle) {
      conversationTitle = 'New Chat';
    }

    const conversation = new this.conversationModel({
      userId: new Types.ObjectId(userId),
      diagnosisId: diagnosisId ? new Types.ObjectId(diagnosisId) : undefined,
      title: conversationTitle,
    });

    const savedConversation = await conversation.save();

    // If linked to diagnosis, add initial system message with diagnosis context
    if (diagnosisData) {
      const classification = diagnosisData.prediction?.classification || 'Unknown';
      const confidence = diagnosisData.prediction?.confidence || [];
      const confPercent = diagnosisData.prediction?.confidence.confidence_score 
        ? (diagnosisData.prediction.confidence.confidence_score * 100).toFixed(1) 
        : 'N/A';

      console.log('Creating conversation with diagnosis context:', {
        classification,
        confidence,
      });

      console.log('CONFIDNCE SCORE:', diagnosisData.prediction?.confidence.confidence_score);

      const initialMessage = `I've analyzed your image and detected ${classification} with ${confPercent}% confidence. I'm here to help you understand this diagnosis and answer any questions about treatment and care. What would you like to know?`;

      await this.saveMessage(
        savedConversation._id.toString(),
        'assistant',
        initialMessage,
        { predictionData: diagnosisData.prediction },
      );
    }

    return savedConversation;
  }


  // async createConversation(
  //   userId: string,
  //   diagnosisId?: string,
  //   title?: string,
  // ): Promise<ChatConversation> {
  //   let diagnosisData = null;
  //   let conversationTitle = title;

  //   // If diagnosisId is provided, fetch diagnosis data and generate title
  //   if (diagnosisId) {
  //     diagnosisData = await this.diagnosisModel.findById(diagnosisId);
  //     if (!diagnosisData) {
  //       throw new NotFoundException('Diagnosis not found');
  //     }
      
  //     if (!conversationTitle) {
  //       conversationTitle = await this.geminiService.generateConversationTitle(
  //         'Diagnosis discussion',
  //         diagnosisData,
  //       );
  //     }
  //   }

  //   if (!conversationTitle) {
  //     conversationTitle = 'New Chat';
  //   }

  //   const conversation = new this.conversationModel({
  //     userId: new Types.ObjectId(userId),
  //     diagnosisId: diagnosisId ? new Types.ObjectId(diagnosisId) : undefined,
  //     title: conversationTitle,
  //   });

  //   const savedConversation = await conversation.save();

  //   // If linked to diagnosis, add initial system message with diagnosis context
  //   if (diagnosisData) {
  //     const classification = diagnosisData.prediction?.classification || 'Unknown';
  //     const confidence = diagnosisData.prediction?.confidence || [];
  //     const confPercent = confidence.length > 0 ? (confidence[0] * 100).toFixed(1) : 'N/A';

  //     console.log('Creating conversation with diagnosis context:', {
  //       classification,
  //       confidence,
  //     });

  //     const initialMessage = `I've analyzed your image and detected ${classification} with ${confPercent}% confidence. I'm here to help you understand this diagnosis and answer any questions about treatment and care. What would you like to know?`;

  //     await this.saveMessage(
  //       savedConversation._id.toString(),
  //       'assistant',
  //       initialMessage,
  //       { predictionData: diagnosisData.prediction },
  //     );
  //   }

  //   return savedConversation;
  // }

  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    return this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('diagnosisId')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    // Verify conversation exists and belongs to user
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new BadRequestException('You can only send messages to your own conversations');
    }

    // Save user message
    const userMessage = await this.saveMessage(conversationId, 'user', content);

    // Get conversation history for context
    const conversationHistory = await this.getConversationMessages(conversationId);

    // Load diagnosis data if conversation is linked to a diagnosis
    let diagnosisData = null;
    if (conversation.diagnosisId) {
      diagnosisData = await this.diagnosisModel.findById(conversation.diagnosisId);
    }

    // Get AI response
    try {
      const aiResponse = await this.geminiService.sendMessage(
        content,
        conversationHistory.slice(0, -1), // Exclude the message we just added
        diagnosisData,
      );

      // Save AI response
      const aiMessage = await this.saveMessage(conversationId, 'assistant', aiResponse);

      // Update conversation's updatedAt timestamp
      conversation.updatedAt = new Date();
      await conversation.save();

      return { userMessage, aiMessage };

    } catch (error) {
      this.logger.error('Error getting AI response:', error.message);
      
      // Save error message as AI response
      const errorMessage = 'I apologize, but I encountered an error. Please try again or consult with a veterinarian for immediate assistance.';
      const aiMessage = await this.saveMessage(conversationId, 'assistant', errorMessage);

      return { userMessage, aiMessage };
    }
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ timestamp: 1 })
      .exec();
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conversation = await this.conversationModel.findById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new BadRequestException('You can only delete your own conversations');
    }

    // Delete all messages in the conversation
    await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(id) });

    // Delete the conversation
    await this.conversationModel.findByIdAndDelete(id);
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any,
  ): Promise<ChatMessage> {
    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      role,
      content,
      metadata,
      timestamp: new Date(),
    });

    return message.save();
  }
}
