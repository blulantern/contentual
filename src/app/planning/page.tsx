'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { PlanService } from '@/lib/services/plan-service';
import { CalendarService } from '@/lib/services/calendar-service';
import { WeeklyPlan } from '@/types/plans';
import { getCurrentWeeklyPlan } from '@/lib/storage/db';
import { Calendar, Download, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { PLATFORM_METADATA } from '@/lib/data/platforms';

export default function PlanningPage() {
  const { profile } = useProfileStore();
  const { config } = useConfigStore();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadPlan = async () => {
    const currentPlan = await getCurrentWeeklyPlan();
    setPlan(currentPlan || null);
  };

  const generatePlan = async () => {
    if (!profile) return;

    setIsGenerating(true);
    try {
      const aiService = new AIService(config);
      const planService = new PlanService(aiService);

      const niches = profile.topNiches.map((n) => n.name);
      const platforms = profile.platforms.map((p) => p.platform);
      const planType = profile.survey.timeCommitment >= 20 ? 'full-time' : 'part-time';

      const newPlan = await planService.generateWeeklyPlan(planType, niches, platforms);
      setPlan(newPlan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCalendar = async () => {
    if (!plan) return;

    setIsExporting(true);
    try {
      const calendarService = new CalendarService();
      const icsContent = await calendarService.exportWeeklyPlan(plan);
      calendarService.downloadCalendar(icsContent, 'contentual-weekly-plan.ics');
    } catch (error) {
      console.error('Failed to export calendar:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 animate-fade-up">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
              Weekly <span className="gradient-text">Content Plan</span>
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl">
              Your personalized content schedule
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {plan && (
              <Button onClick={exportToCalendar} disabled={isExporting} variant="secondary" size="xl" className="whitespace-nowrap">
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Export to Calendar
                  </>
                )}
              </Button>
            )}

            <Button onClick={generatePlan} disabled={isGenerating} size="xl" className="shadow-colored-lg whitespace-nowrap">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {plan ? 'Regenerate Plan' : 'Generate Plan'}
                </>
              )}
            </Button>
          </div>
        </div>

        {plan ? (
          <div className="space-y-8">
            <Card variant="elevated" className="animate-fade-up animation-delay-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-colored">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    {format(plan.weekStart, 'MMM d')} - {format(plan.weekEnd, 'MMM d, yyyy')}
                  </CardTitle>
                  <Badge size="xl" variant={plan.type === 'full-time' ? 'gradient' : 'secondary'} className="shadow-sm">
                    {plan.type === 'full-time' ? 'Full-Time' : 'Part-Time'} Plan
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {plan.days.map((day, dayIdx) => (
              <Card
                key={dayIdx}
                variant="elevated"
                className="animate-fade-up"
                style={{ animationDelay: `${(dayIdx + 2) * 100}ms` }}
              >
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-contentual-coral to-contentual-peach rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-lg">{format(day.date, 'd')}</span>
                    </div>
                    {format(day.date, 'EEEE, MMMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {day.tasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl">😴</span>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">Rest day - No tasks scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {day.tasks.map((task, taskIdx) => (
                        <div
                          key={task.id}
                          className="group flex items-start gap-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 hover:border-contentual-pink/30 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5"
                        >
                          <div className="flex-shrink-0 text-center">
                            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex flex-col items-center justify-center shadow-colored">
                              <div className="text-sm font-bold text-white">{task.time}</div>
                              <div className="text-xs text-white/80">{task.duration} min</div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <h4 className="font-bold text-xl text-gray-800 group-hover:text-contentual-pink transition-colors">
                                {task.title}
                              </h4>
                              {task.platform && (
                                <Badge variant="secondary" size="lg" className="whitespace-nowrap">
                                  {PLATFORM_METADATA[task.platform].icon} {PLATFORM_METADATA[task.platform].name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-base text-gray-700 leading-relaxed mb-3">{task.description}</p>
                            {task.notes && (
                              <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100">
                                <p className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-lg">💡</span>
                                  <span className="flex-1">{task.notes}</span>
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            <button
                              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                                task.completed
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 shadow-colored'
                                  : 'border-gray-300 hover:border-contentual-pink hover:bg-contentual-pink/5'
                              }`}
                            >
                              {task.completed && <CheckCircle2 className="w-6 h-6 text-white" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="border-2 border-dashed border-gray-300 animate-fade-up animation-delay-200">
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-colored-lg">
                <Calendar className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">No Plan Yet</h2>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Generate your personalized weekly content plan to get started
              </p>
              <Button onClick={generatePlan} disabled={isGenerating} size="xl" className="shadow-colored-lg">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate Weekly Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
