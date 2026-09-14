import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, Sparkles } from "lucide-react";
import { Badge } from "@/components/accounting-os";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useOfficeStore } from "@/data/store";
import {
  brl,
  capacityForecast,
  capacityRecommendations,
  churnRisks,
  clientProfitability,
  clients,
  departmentCapacity,
  employeeCapacity,
  healthScores,
  insights,
  margin,
  officeCapacityOverview,
  profitabilityDashboard,
  revenueOpportunities,
  totals,
} from "@/data/office";
import { answerQuestion, COPILOT_DEMO_DISCLAIMER, type CopilotAction, type CopilotAnswer, type CopilotContext } from "@/lib/copilot-engine";

const SUGGESTED_QUESTIONS = [
  "Como está o escritório?",
  "Quais clientes estão dando prejuízo?",
  "Quem está sobrecarregado?",
  "Quais clientes têm oportunidade de reajuste?",
  "Quais obrigações vencem essa semana?",
  "Quais clientes estão em risco?",
  "O que devo fazer hoje?",
  "Por que nossa margem caiu?",
  "Quais tarefas estão em risco?",
];

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: CopilotAnswer };

function genMsgId() {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AICopilot({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { tasks, pendencies, communications, obligations, reassignTask, createPendency, confirmAction } = useOfficeStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cancelledActions, setCancelledActions] = useState<Set<string>>(new Set());
  const [doneActions, setDoneActions] = useState<Set<string>>(new Set());
  const [thinking, setThinking] = useState(false);

  const context: CopilotContext = useMemo(
    () => ({
      clients,
      tasks,
      pendencies,
      communications,
      obligations,
      clientProfitability,
      profitabilityDashboard,
      revenueOpportunities,
      healthScores,
      churnRisks,
      employeeCapacity,
      departmentCapacity,
      officeCapacityOverview,
      capacityForecast,
      capacityRecommendations,
      insights,
      totals,
      margin,
      formatCurrency: brl,
    }),
    [tasks, pendencies, communications, obligations],
  );

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { id: genMsgId(), role: "user", text: q }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const answer = answerQuestion(q, context);
      setMessages((m) => [...m, { id: genMsgId(), role: "assistant", answer }]);
      setThinking(false);
    }, 450 + Math.round(Math.random() * 350));
  };

  const executeAction = (action: CopilotAction) => {
    if (action.payload.kind === "reassign-tasks") {
      for (const taskId of action.payload.taskIds) reassignTask(taskId, action.payload.targetAssignee);
    } else if (action.payload.kind === "create-pendency") {
      createPendency({
        clientId: action.payload.clientId,
        category: action.payload.category,
        title: action.payload.title,
        description: action.payload.description,
        assignee: action.payload.assignee,
        priority: action.payload.priority,
        dueDate: "2026-09-20",
      });
    } else if (action.payload.kind === "navigate") {
      void navigate({ to: action.payload.to as "/" });
    }
    setDoneActions((s) => new Set(s).add(action.id));
  };

  const reviewAction = (action: CopilotAction) => {
    if (action.payload.kind === "navigate") {
      executeAction(action);
      return;
    }
    confirmAction({
      title: action.label,
      description: action.description,
      impact: "operacional",
      successMessage: "Ação executada.",
      onConfirm: () => executeAction(action),
    });
  };

  const cancelAction = (actionId: string) => setCancelledActions((s) => new Set(s).add(actionId));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full max-w-lg border-glass-line bg-background/95 p-0 backdrop-blur-2xl">
        <SheetHeader className="border-b border-glass-line p-5">
          <SheetTitle className="flex items-center gap-2 font-display">
            <span className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand to-accent text-brand-foreground"><Sparkles className="size-4" /></span>
            ContaAI Copilot
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-[calc(100vh-80px)] flex-col p-5">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                Pergunte sobre clientes, rentabilidade, capacidade, obrigações, tarefas ou risco — respondo com os dados reais do sistema e cito o que sustenta a resposta.
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary p-3 text-sm text-primary-foreground">{m.text}</div>
              ) : (
                <div key={m.id} className="max-w-[95%] rounded-2xl rounded-bl-sm bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><Bot className="size-4" /> Análise com dados do sistema</div>
                  <p className="text-sm leading-relaxed">{m.answer.text}</p>

                  {m.answer.citations.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-glass-line pt-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Dados que sustentam essa resposta</p>
                      {m.answer.citations.slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{c.label}</span>
                          <span className="text-right font-medium">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.answer.suggestedActions.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-glass-line pt-3">
                      {m.answer.suggestedActions.map((a) => {
                        const cancelled = cancelledActions.has(a.id);
                        const done = doneActions.has(a.id);
                        return (
                          <div key={a.id} className="rounded-xl bg-brand/10 p-3">
                            <p className="text-sm font-medium">{a.label}?</p>
                            {done ? (
                              <Badge tone="good" className="mt-2">Executado</Badge>
                            ) : cancelled ? (
                              <Badge tone="neutral" className="mt-2">Cancelado</Badge>
                            ) : (
                              <div className="mt-2 flex gap-2">
                                <Button size="sm" onClick={() => reviewAction(a)}>Revisar</Button>
                                <Button size="sm" variant="outline" onClick={() => cancelAction(a.id)}>Cancelar</Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {m.answer.link && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void navigate({ to: m.answer.link as "/" })}>Ver evidências</Button>
                    </div>
                  )}
                </div>
              ),
            )}
            {thinking && (
              <div className="max-w-[95%] rounded-2xl rounded-bl-sm bg-muted p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand"><Bot className="size-4" /> Analisando os dados do sistema…</div>
                <div className="mt-2 flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="mt-2">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Perguntas sugeridas</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Button key={q} size="sm" variant="outline" className="rounded-full" onClick={() => ask(q)}>{q}</Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2 border-t border-glass-line pt-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              disabled={thinking}
              className="min-h-10 resize-none"
              placeholder={thinking ? "Analisando…" : "Pergunte sobre sua operação…"}
            />
            <Button size="icon" className="h-10 w-10 shrink-0" disabled={thinking || !input.trim()} onClick={() => ask(input)}><ArrowRight /></Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">{COPILOT_DEMO_DISCLAIMER}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
