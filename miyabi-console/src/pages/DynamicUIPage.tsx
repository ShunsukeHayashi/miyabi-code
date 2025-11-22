/**
 * Dynamic UI Generator Page
 * Main interface for Intent-driven, SWML-optimized, dynamically generated UI
 *
 * Integration Flow:
 * User Input → Intent Parser → SWML Optimizer → Gemini Service → Code Runner → Live UI
 */

import { useWorldSpace } from '@/contexts/WorldSpaceContext';
import { generateDynamicUI, type GeminiUIResponse } from '@/lib/services/geminiService';
import { swmlOptimizer } from '@/lib/services/swmlOptimizer';
import { calculateIntentMetrics, parseUserInput, type Intent } from '@/types/intent';
import { executeCode } from '@/utils/codeRunner';
import * as HeroUI from '@heroui/react';
import { Button, Card, Chip, Spinner, Textarea } from '@heroui/react';
import { motion } from 'framer-motion';
import * as LucideReact from 'lucide-react';
import { Code2, MessageSquare, Play, Sparkles, Trash2 } from 'lucide-react';
import * as React18 from 'react';
import React, { useEffect, useRef, useState } from 'react';
import * as Recharts from 'recharts';

export default function DynamicUIPage() {
  const { world, updateContext } = useWorldSpace();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<Intent | null>(null);
  const [generatedUI, setGeneratedUI] = useState<GeminiUIResponse | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ intent: string; ui: GeminiUIResponse }>>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Update world context
  useEffect(() => {
    updateContext({ currentPage: 'Dynamic UI Generator' });
  }, [updateContext]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  /**
   * Main generation handler
   */
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    const userInput = input;
    setInput(''); // Clear input immediately for better UX

    try {
      // Step 1: Parse user input into Intent
      console.log('Step 1: Parsing Intent...');
      const intent = parseUserInput(userInput, {
        current_page: world.contextual.user.current_page,
        current_data: null,
      });
      setCurrentIntent(intent);

      const metrics = calculateIntentMetrics(intent);
      console.log('Intent Metrics:', metrics);

      // Step 2: Run SWML optimization
      console.log('Step 2: Running SWML Optimization...');
      const swmlResult = await swmlOptimizer.runFullProcess(intent, world);
      console.log('SWML Result:', swmlResult);
      console.log('SWML Quality:', swmlResult.quality);

      // Step 3: Generate UI with Gemini
      console.log('Step 3: Generating UI with Gemini...');
      const uiResponse = await generateDynamicUI(intent, world, swmlResult.strategy);
      console.log('Gemini Response:', uiResponse);

      setGeneratedUI(uiResponse);

      // Add to history
      setHistory((prev) => [...prev, { intent: userInput, ui: uiResponse }]);
    } catch (err) {
      console.error('Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Clear all
   */
  const handleClear = () => {
    setGeneratedUI(null);
    setCurrentIntent(null);
    setError(null);
    setShowCode(false);
  };

  /**
   * Use suggested prompt
   */
  const useSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Render generated component
   */
  const renderGeneratedComponent = () => {
    if (!generatedUI) return null;

    try {
      // Prepare scope for code execution
      const scope = {
        React: React18,
        useState: React18.useState,
        useEffect: React18.useEffect,
        useRef: React18.useRef,
        useMemo: React18.useMemo,
        useCallback: React18.useCallback,
        ...LucideReact,
        ...Recharts,
        ...HeroUI,
        motion,
      };

      // Execute code
      const Component = executeCode(generatedUI.react_code, scope);

      return (
        <div className="w-full h-full">
          <Component />
        </div>
      );
    } catch (err) {
      console.error('Runtime Error:', err);
      return (
        <div className="p-6 text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Runtime Error</div>
          <div className="text-sm text-gray-600">
            {err instanceof Error ? err.message : 'Failed to render component'}
          </div>
          <Button color="primary" variant="flat" className="mt-4" onPress={() => setShowCode(true)}>
            <Code2 className="w-4 h-4 mr-2" />
            View Code
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              動的UI生成 (Dynamic UI Generator)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Intent-driven, SWML-optimized, Gemini-powered UI generation
            </p>
          </div>
          {currentIntent && (
            <div className="flex gap-2">
              <Chip color="primary" variant="flat">
                Intent Clarity: {(calculateIntentMetrics(currentIntent).clarity * 100).toFixed(0)}%
              </Chip>
              <Chip color="success" variant="flat">
                Feasibility: {(calculateIntentMetrics(currentIntent).feasibility * 100).toFixed(0)}%
              </Chip>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Input & History */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
          {/* Input Section */}
          <div className="p-6 border-b border-gray-200">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  何を作りたいですか？ (What do you want to create?)
                </label>
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="例: エージェントの稼働状況をリアルタイムで表示するダッシュボード"
                  className="w-full"
                  minRows={3}
                  maxRows={8}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isGenerating}
                  isDisabled={!input.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate UI
                    </>
                  )}
                </Button>
                {generatedUI && (
                  <Button color="default" variant="flat" onPress={handleClear}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Strategy & Insights */}
          {generatedUI && (
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">UI Strategy</h3>
                <p className="text-sm text-gray-600">{generatedUI.ui_strategy}</p>
              </div>

              {generatedUI.swml_insights && generatedUI.swml_insights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">SWML Insights</h3>
                  <div className="space-y-1">
                    {generatedUI.swml_insights.slice(0, 3).map((insight, idx) => (
                      <div key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedUI.quality_score && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Quality Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${generatedUI.quality_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {(generatedUI.quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggested Next Prompts */}
          {generatedUI && generatedUI.suggested_next_prompts.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Next Actions</h3>
              <div className="space-y-2">
                {generatedUI.suggested_next_prompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="flat"
                    color="default"
                    className="w-full justify-start text-left"
                    onPress={() => useSuggestedPrompt(prompt)}
                  >
                    <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <div className="text-sm font-semibold text-red-700 mb-1">Error</div>
              <div className="text-xs text-red-600">{error}</div>
            </div>
          )}

          {/* History (scrollable) */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history yet</p>
            ) : (
              <div className="space-y-2">
                {history.reverse().map((item, idx) => (
                  <Card
                    key={idx}
                    isPressable
                    onPress={() => {
                      setInput(item.intent);
                      setGeneratedUI(item.ui);
                    }}
                    className="p-3 hover:bg-gray-50"
                  >
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {item.ui.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {item.intent}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Preview / Code */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Tab Bar */}
          {generatedUI && (
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
              <Button
                size="sm"
                variant={!showCode ? 'solid' : 'flat'}
                color={!showCode ? 'primary' : 'default'}
                onPress={() => setShowCode(false)}
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                variant={showCode ? 'solid' : 'flat'}
                color={showCode ? 'primary' : 'default'}
                onPress={() => setShowCode(true)}
              >
                <Code2 className="w-4 h-4 mr-2" />
                Code
              </Button>
              <div className="ml-auto text-sm text-gray-600">
                {generatedUI.title}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {!generatedUI ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No UI generated yet</p>
                  <p className="text-sm mt-2">Enter your intent to generate dynamic UI</p>
                </div>
              </div>
            ) : showCode ? (
              <div className="p-6">
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-xs font-mono">
                  {generatedUI.react_code}
                </pre>
              </div>
            ) : (
              <div className="h-full">{renderGeneratedComponent()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
