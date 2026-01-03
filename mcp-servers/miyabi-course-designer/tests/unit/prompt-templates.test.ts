/**
 * Unit tests for Prompt Templates
 */

import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  getTemplateNames,
  validateTemplateVariables,
  CONTENT_TEMPLATES,
  COURSE_STRUCTURE_TEMPLATE,
  LESSON_CONTENT_TEMPLATE,
  VIDEO_SCRIPT_TEMPLATE,
  QUIZ_GENERATION_TEMPLATE,
  EXERCISE_TEMPLATE,
  CONTENT_ANALYSIS_TEMPLATE
} from '../../src/lib/prompt-templates.js';

describe('Prompt Templates', () => {
  describe('Template Registry', () => {
    it('should contain all expected templates', () => {
      const templateNames = getTemplateNames();

      expect(templateNames).toContain('courseStructure');
      expect(templateNames).toContain('lessonContent');
      expect(templateNames).toContain('videoScript');
      expect(templateNames).toContain('quiz');
      expect(templateNames).toContain('exercise');
      expect(templateNames).toContain('contentAnalysis');
    });

    it('should return valid template objects', () => {
      Object.entries(CONTENT_TEMPLATES).forEach(([name, template]) => {
        expect(template).toMatchObject({
          type: expect.any(String),
          template: expect.objectContaining({
            name: expect.any(String),
            template: expect.any(String),
            variables: expect.any(Array)
          })
        });
      });
    });
  });

  describe('getTemplate', () => {
    it('should return correct template by name', () => {
      const template = getTemplate('courseStructure');

      expect(template).toBeDefined();
      expect(template?.name).toBe('course_structure');
      expect(template?.template).toContain('{{topic}}');
      expect(template?.variables).toContain('topic');
    });

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('nonExistentTemplate');
      expect(template).toBeUndefined();
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate complete variables successfully', () => {
      const variables = {
        topic: 'JavaScript',
        targetAudience: 'Beginners',
        difficulty: 'beginner',
        duration: '8 weeks',
        language: 'en',
        tone: 'conversational'
      };

      const result = validateTemplateVariables('courseStructure', variables);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing variables', () => {
      const variables = {
        topic: 'JavaScript',
        targetAudience: 'Beginners'
        // Missing: difficulty, duration, language, tone
      };

      const result = validateTemplateVariables('courseStructure', variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('difficulty');
      expect(result.missing).toContain('duration');
      expect(result.missing).toContain('language');
      expect(result.missing).toContain('tone');
    });

    it('should detect empty variables', () => {
      const variables = {
        topic: 'JavaScript',
        targetAudience: '',
        difficulty: 'beginner',
        duration: '8 weeks',
        language: 'en',
        tone: 'conversational'
      };

      const result = validateTemplateVariables('courseStructure', variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('targetAudience');
    });

    it('should handle non-existent template', () => {
      const variables = { topic: 'Test' };

      const result = validateTemplateVariables('nonExistent', variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('Template not found');
    });
  });

  describe('Individual Templates', () => {
    describe('COURSE_STRUCTURE_TEMPLATE', () => {
      it('should have correct structure', () => {
        expect(COURSE_STRUCTURE_TEMPLATE).toMatchObject({
          name: 'course_structure',
          template: expect.stringContaining('Topic: {{topic}}'),
          variables: ['topic', 'targetAudience', 'difficulty', 'duration', 'language', 'tone']
        });
      });

      it('should include JSON response format', () => {
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('Return the response as valid JSON');
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('"title": "string"');
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('"modules": [');
      });

      it('should include learning objectives guidance', () => {
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('Learning Objectives');
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('specific, measurable');
        expect(COURSE_STRUCTURE_TEMPLATE.template).toContain('action verbs');
      });
    });

    describe('LESSON_CONTENT_TEMPLATE', () => {
      it('should have correct variables', () => {
        expect(LESSON_CONTENT_TEMPLATE.variables).toContain('courseTitle');
        expect(LESSON_CONTENT_TEMPLATE.variables).toContain('moduleTitle');
        expect(LESSON_CONTENT_TEMPLATE.variables).toContain('lessonTitle');
        expect(LESSON_CONTENT_TEMPLATE.variables).toContain('lessonType');
        expect(LESSON_CONTENT_TEMPLATE.variables).toContain('duration');
      });

      it('should include content structure guidance', () => {
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('Introduction');
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('Main Content');
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('Summary and Reflection');
      });

      it('should include video-specific instructions', () => {
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('For video content');
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('Visual cues');
        expect(LESSON_CONTENT_TEMPLATE.template).toContain('Interactive moments');
      });
    });

    describe('VIDEO_SCRIPT_TEMPLATE', () => {
      it('should have script formatting guidance', () => {
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('Script Format Requirements');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('[MM:SS]');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('[VISUAL:');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('[INTERACTION:');
      });

      it('should include timing structure', () => {
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('Opening');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('0-30 seconds');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('Closing');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('Last 60 seconds');
      });

      it('should return structured JSON', () => {
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('"lessonId":');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('"script":');
        expect(VIDEO_SCRIPT_TEMPLATE.template).toContain('"visualCues":');
      });
    });

    describe('QUIZ_GENERATION_TEMPLATE', () => {
      it('should specify question type distribution', () => {
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Multiple Choice: 40-50%');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('True/False: 20-25%');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Short Answer: 15-20%');
      });

      it('should specify difficulty distribution', () => {
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Easy (recall/understanding): 30%');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Medium (application/analysis): 50%');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Hard (synthesis/evaluation): 20%');
      });

      it('should include assessment criteria', () => {
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Total questions: 15-25');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('Passing score: 80%');
        expect(QUIZ_GENERATION_TEMPLATE.template).toContain('15-30 minutes');
      });
    });

    describe('EXERCISE_TEMPLATE', () => {
      it('should include exercise types', () => {
        expect(EXERCISE_TEMPLATE.template).toContain('Practice Exercise');
        expect(EXERCISE_TEMPLATE.template).toContain('Application Exercise');
        expect(EXERCISE_TEMPLATE.template).toContain('Project Component');
      });

      it('should specify exercise requirements', () => {
        expect(EXERCISE_TEMPLATE.template).toContain('Clear instructions');
        expect(EXERCISE_TEMPLATE.template).toContain('Success criteria');
        expect(EXERCISE_TEMPLATE.template).toContain('Sample solutions');
        expect(EXERCISE_TEMPLATE.template).toContain('Extension activities');
      });
    });

    describe('CONTENT_ANALYSIS_TEMPLATE', () => {
      it('should include analysis dimensions', () => {
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('Content Quality Assessment');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('Educational Effectiveness');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('Accessibility and Inclusivity');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('Engagement Optimization');
      });

      it('should specify scoring system', () => {
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('0-100 score');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('"contentQualityScore": number');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('"estimatedCompletionRate": number');
      });

      it('should include metadata requirements', () => {
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('"scormCompatible": boolean');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('"accessibilityCompliant": boolean');
        expect(CONTENT_ANALYSIS_TEMPLATE.template).toContain('"tags": ["relevant tags"]');
      });
    });
  });

  describe('Template Quality', () => {
    it('should have all variables properly formatted', () => {
      Object.values(CONTENT_TEMPLATES).forEach(({ template }) => {
        // Check that all variables are in double curly braces
        const variables = template.template.match(/\{\{[^}]+\}\}/g) || [];

        variables.forEach(variable => {
          expect(variable).toMatch(/^\{\{[a-zA-Z][a-zA-Z0-9]*\}\}$/);
        });

        // Check that all declared variables are actually used
        template.variables.forEach(variable => {
          expect(template.template).toContain(`{{${variable}}}`);
        });
      });
    });

    it('should not contain undefined placeholders', () => {
      Object.values(CONTENT_TEMPLATES).forEach(({ template }) => {
        expect(template.template).not.toContain('undefined');
        expect(template.template).not.toContain('{{undefined}}');
        expect(template.template).not.toContain('null');
      });
    });

    it('should have reasonable template lengths', () => {
      Object.values(CONTENT_TEMPLATES).forEach(({ template }) => {
        expect(template.template.length).toBeGreaterThan(500); // Substantial content
        expect(template.template.length).toBeLessThan(10000); // Not too verbose
      });
    });

    it('should include clear instructions', () => {
      Object.values(CONTENT_TEMPLATES).forEach(({ template }) => {
        // Should have some instructional content
        expect(
          template.template.includes('Create') ||
          template.template.includes('Generate') ||
          template.template.includes('Analyze') ||
          template.template.includes('You are')
        ).toBe(true);
      });
    });
  });
});