import { useCallback, useRef, useState } from 'react';
import type { ChatMessage, ChatRequest } from '../types/types';
import { buildChatRequest, chatWithAgent, extractChartHtml } from '../utils';

/**
 * Shared chat logic for HARVEY4API. The caller supplies the datasheet YAML strings
 * that should ground each answer, so the same hook powers both the full assistant
 * page and the per-datasheet bot widget. It also handles on-demand chart generation
 * (force_chart) mirroring the original Harvey behaviour.
 */
export function useHarveyChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingChartIds, setGeneratingChartIds] = useState<Set<string>>(new Set());

  // Keep a live reference to messages so `send` (a stable callback) can read the
  // conversation history without being re-created on every message.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const send = useCallback(
    async (question: string, contextYamls: string[], forceChart = false) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Base request (ask mode). With force_chart we generate the chart up front;
      // without it the backend only reports that a chart is available so the UI can
      // ask before generating it.
      const baseRequest = buildChatRequest(trimmed, contextYamls, history);
      const requestBody: ChatRequest = forceChart
        ? { ...baseRequest, force_chart: true }
        : baseRequest;

      try {
        const data = await chatWithAgent(requestBody);
        const chartHtml = extractChartHtml(data?.result);
        const chartAvailable = data?.chart_available === true;

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer ?? 'No response available.',
          createdAt: new Date().toISOString(),
          chartHtml,
          chartAvailable: !chartHtml && chartAvailable,
          pendingChartRequest: { ...baseRequest, force_chart: true },
          metadata: {
            plan: data.plan ?? undefined,
            result: data.result ?? undefined,
          },
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${(error as Error).message}`,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Ask mode: the user confirmed they want the chart, so re-run the same request
  // with force_chart to actually call the tool and attach the chart HTML.
  const generateChart = useCallback(async (messageId: string) => {
    const target = messagesRef.current.find(m => m.id === messageId);
    if (!target?.pendingChartRequest) return;
    setGeneratingChartIds(prev => {
      if (prev.has(messageId)) return prev;
      return new Set(prev).add(messageId);
    });

    try {
      const data = await chatWithAgent(target.pendingChartRequest);
      const chartHtml = extractChartHtml(data?.result);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, chartHtml, chartAvailable: false, chartError: !chartHtml }
            : m
        )
      );
    } catch (error) {
      console.error('Chart generation failed', error);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, chartAvailable: false, chartError: true } : m))
      );
    } finally {
      setGeneratingChartIds(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setGeneratingChartIds(new Set());
  }, []);

  return { messages, isLoading, generatingChartIds, send, generateChart, reset, setMessages };
}
