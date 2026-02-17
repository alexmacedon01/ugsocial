'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Check, Circle, Upload } from 'lucide-react';

interface Props {
  assignmentId: string;
  projectId: string;
  assignmentStatus: string;
  hasAiScripts: boolean;
  hasCreatorScript: boolean;
  hasVideos: boolean;
}

const STEPS = [
  { id: 'review_brief', label: 'Brief & Brand-Info lesen' },
  { id: 'watch_references', label: 'Referenz-Videos ansehen' },
  { id: 'review_scripts', label: 'AI-Scripts lesen' },
  { id: 'rewrite_script', label: 'Script in deiner Stimme umschreiben' },
  { id: 'submit_script', label: 'Script zur Freigabe einreichen' },
  { id: 'wait_approval', label: 'Auf Freigabe warten' },
  { id: 'film_video', label: 'Video drehen' },
  { id: 'upload_video', label: 'Video hochladen' },
  { id: 'wait_review', label: 'Auf Review warten' },
  { id: 'revisions', label: 'Ggf. Überarbeitung' },
  { id: 'done', label: 'Fertig!' },
];

export function CreatorWorkflow({ assignmentId, projectId, assignmentStatus, hasAiScripts, hasCreatorScript, hasVideos }: Props) {
  const router = useRouter();
  const [scriptBody, setScriptBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScriptForm, setShowScriptForm] = useState(false);

  // Determine which steps are completed
  const getStepStatus = (stepId: string) => {
    if (stepId === 'review_brief' && assignmentStatus !== 'pending') return 'completed';
    if (stepId === 'review_scripts' && hasAiScripts) return 'completed';
    if (stepId === 'rewrite_script' && hasCreatorScript) return 'completed';
    if (stepId === 'submit_script' && hasCreatorScript) return 'completed';
    if (stepId === 'upload_video' && hasVideos) return 'completed';
    if (stepId === 'done' && assignmentStatus === 'completed') return 'completed';
    return 'pending';
  };

  const handleAccept = async () => {
    const supabase = createClient();
    await supabase
      .from('project_assignments')
      .update({ status: 'accepted' })
      .eq('id', assignmentId);
    router.refresh();
  };

  const handleSubmitScript = async () => {
    if (!scriptBody.trim()) return;
    setSubmitting(true);

    const supabase = createClient();
    await supabase.from('scripts').insert({
      project_id: projectId,
      assignment_id: assignmentId,
      type: 'creator_rewrite',
      body: scriptBody,
      approval_status: 'pending',
    });

    // Update assignment status
    await supabase
      .from('project_assignments')
      .update({ status: 'in_progress' })
      .eq('id', assignmentId);

    setScriptBody('');
    setShowScriptForm(false);
    setSubmitting(false);
    router.refresh();
  };

  return (
    <Card>
      <CardTitle>Workflow-Checkliste</CardTitle>
      <div className="mt-4 space-y-3">
        {STEPS.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-center gap-3">
              {status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Check size={14} />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center">
                  <Circle size={14} className="text-zinc-300 dark:text-zinc-700" />
                </div>
              )}
              <span className={`text-sm ${status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {assignmentStatus === 'pending' && (
          <Button onClick={handleAccept} className="w-full">
            Auftrag annehmen
          </Button>
        )}

        {assignmentStatus !== 'pending' && !hasCreatorScript && (
          <>
            {!showScriptForm ? (
              <Button onClick={() => setShowScriptForm(true)} variant="secondary" className="w-full">
                Script umschreiben
              </Button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  label="Dein Script"
                  value={scriptBody}
                  onChange={(e) => setScriptBody(e.target.value)}
                  placeholder="Schreibe das Script in deiner eigenen Stimme um..."
                  rows={8}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitScript} loading={submitting} size="sm" className="flex-1">
                    Script einreichen
                  </Button>
                  <Button onClick={() => setShowScriptForm(false)} variant="ghost" size="sm">
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
