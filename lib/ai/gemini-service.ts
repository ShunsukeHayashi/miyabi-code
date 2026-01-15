/**
 * Gemini AI Service for Course Platform
 * Provides AI-powered content generation, analysis, and assistance
 */

import type {
  Content,
  GenerativeModel,
  GoogleGenerativeAI as GoogleGenerativeAIType,
} from '@google/generative-ai';

// Types for course-related AI operations
export interface CourseContentSuggestion {
  title: string;
  description: string;
  outline: string[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

export interface LessonContent {
  title: string;
  content: string;
  objectives: string[];
  activities: string[];
  assessmentQuestions: string[];
}

export interface ContentAnalysis {
  readabilityScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  suggestedImprovements: string[];
  missingTopics: string[];
  engagementTips: string[];
}

export interface AssessmentGeneration {
  questions: Array<{
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

class GeminiService {
  private client: GoogleGenerativeAIType | null = null;
  private model: GenerativeModel | null = null;
  private initialized = false;

  constructor() {
    // Delay initialization until first use to avoid build-time side effects.
  }

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai') as {
      GoogleGenerativeAI: new (key: string) => GoogleGenerativeAIType;
    };

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.initialized = true;
  }

  private getModel(): GenerativeModel {
    this.ensureInitialized();
    if (!this.model) {
      throw new Error('Gemini model initialization failed');
    }
    return this.model;
  }

  /**
   * Generate course content suggestions based on topic
   */
  async generateCourseSuggestions(topic: string, targetAudience?: string): Promise<CourseContentSuggestion[]> {
    const prompt = `
      Generate 3 comprehensive course suggestions for the topic: "${topic}"
      ${targetAudience ? `Target audience: ${targetAudience}` : ''}

      For each course, provide:
      - A compelling title
      - A detailed description (2-3 sentences)
      - A structured outline with main topics
      - Estimated duration in hours
      - Difficulty level (beginner/intermediate/advanced)
      - Prerequisites needed

      Format as JSON array with the structure:
      {
        "title": "string",
        "description": "string",
        "outline": ["topic1", "topic2", "topic3"],
        "estimatedDuration": number,
        "difficulty": "string",
        "prerequisites": ["prerequisite1", "prerequisite2"]
      }
    `;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error generating course suggestions:', error);
      throw new Error('Failed to generate course suggestions');
    }
  }

  /**
   * Generate detailed lesson content
   */
  async generateLessonContent(
    courseTitle: string,
    lessonTopic: string,
    difficulty: string,
    duration: number,
  ): Promise<LessonContent> {
    const prompt = `
      Create detailed lesson content for:
      Course: "${courseTitle}"
      Lesson Topic: "${lessonTopic}"
      Difficulty: ${difficulty}
      Duration: ${duration} minutes

      Generate:
      - An engaging lesson title
      - Comprehensive lesson content (well-structured, educational, engaging)
      - Clear learning objectives (3-5 objectives)
      - Interactive activities or exercises (2-3 activities)
      - Assessment questions (3-5 questions)

      Format as JSON:
      {
        "title": "string",
        "content": "string (well-formatted with sections)",
        "objectives": ["objective1", "objective2"],
        "activities": ["activity1", "activity2"],
        "assessmentQuestions": ["question1", "question2"]
      }
    `;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error generating lesson content:', error);
      throw new Error('Failed to generate lesson content');
    }
  }

  /**
   * Analyze content quality and provide suggestions
   */
  async analyzeContent(content: string, targetLevel: string): Promise<ContentAnalysis> {
    const prompt = `
      Analyze the following educational content for quality and effectiveness:

      Target Level: ${targetLevel}
      Content: "${content}"

      Provide analysis on:
      - Readability score (0-100, where 100 is most readable)
      - Actual difficulty level detected
      - Specific suggestions for improvement
      - Missing topics or concepts that should be covered
      - Tips to make the content more engaging

      Format as JSON:
      {
        "readabilityScore": number,
        "difficulty": "beginner|intermediate|advanced",
        "suggestedImprovements": ["improvement1", "improvement2"],
        "missingTopics": ["topic1", "topic2"],
        "engagementTips": ["tip1", "tip2"]
      }
    `;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Generate assessment questions for content
   */
  async generateAssessment(
    content: string,
    questionCount: number = 5,
    questionTypes: string[] = ['multiple_choice', 'short_answer'],
  ): Promise<AssessmentGeneration> {
    const prompt = `
      Generate ${questionCount} assessment questions based on this content:

      Content: "${content}"

      Question Types: ${questionTypes.join(', ')}

      For each question, provide:
      - Question type
      - The question text
      - Options (for multiple choice)
      - Correct answer
      - Explanation for the correct answer
      - Difficulty level (easy/medium/hard)

      Format as JSON:
      {
        "questions": [
          {
            "type": "multiple_choice|true_false|short_answer|essay",
            "question": "string",
            "options": ["option1", "option2", "option3", "option4"] (optional),
            "correctAnswer": "string or number",
            "explanation": "string",
            "difficulty": "easy|medium|hard"
          }
        ]
      }
    `;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error generating assessment:', error);
      throw new Error('Failed to generate assessment');
    }
  }

  /**
   * Get intelligent content suggestions based on user context
   */
  async getContentSuggestions(
    userProgress: any,
    currentCourse: string,
    learningGoals: string[],
  ): Promise<string[]> {
    const prompt = `
      Based on the user's learning context, suggest 3-5 relevant next steps:

      Current Course: ${currentCourse}
      Learning Goals: ${learningGoals.join(', ')}
      Progress: ${JSON.stringify(userProgress)}

      Provide specific, actionable suggestions for:
      - Next topics to explore
      - Skills to practice
      - Resources to review
      - Projects to attempt

      Return as JSON array of strings:
      ["suggestion1", "suggestion2", "suggestion3"]
    `;

    try {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      console.error('Error getting content suggestions:', error);
      throw new Error('Failed to get content suggestions');
    }
  }

  /**
   * Chat-based AI assistant for course creation
   */
  async chatAssistant(messages: Content[]): Promise<string> {
    try {
      const chat = this.getModel().startChat({
        history: messages.slice(0, -1), // All messages except the last one
      });

      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text || '');
      return result.response.text();
    } catch (error) {
      console.error('Error in chat assistant:', error);
      throw new Error('Failed to process chat request');
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
