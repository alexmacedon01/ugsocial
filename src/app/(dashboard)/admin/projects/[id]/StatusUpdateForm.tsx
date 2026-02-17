'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const ALL_STATUSES = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'brief_submitted', label: 'Brief eingegangen' },
  { value: 'ai_processing', label: 'AI verarbeitet' },
  { value: 'scripts_in_review', label: 'Scripts in Review' },
  { value: 'scripts_approved', label: 'Scripts genehmigt' },
  { value: 'creator_assigned', label: 'Creator zugewiesen' },
  { value: 'creator_scripting', label: 'Creator schreibt Script' },
  { value: 'script_review', label: 'Script Review' },
  { value: 'client_script_review', label: 'Kunde prüft Script' },
  { value: 'filming', label: 'In Produktion' },
  { value: 'video_uploaded', label: 'Video hochgeladen' },
  { value: 'video_in_review', label: 'Video in Review' },
  { value: 'revision_requested', label: 'Überarbeitung nötig' },
  { value: 'video_approved', label: 'Video genehmigt' },
  { value: 'delivered', label: 'Geliefert' },
  { value: 'completed', label: 'Abgeschlossen' },
];

interface Props {
  projectId: string;
  currentStatus: string;
}

export function StatusUpdateForm({ projectId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (status === currentStatus) return;
    setLoading(true);

    const supabase = createClient();
    await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId);

    setLoading(false);
    router.refresh();
  };

  return (
    <Card>
      <CardTitle>Status ändern</CardTitle>
      <div className="mt-4 space-y-3">
        <Select
          id="status"
          options={ALL_STATUSES}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Button
          onClick={handleUpdate}
          disabled={status === currentStatus}
          loading={loading}
          size="sm"
          className="w-full"
        >
          Status aktualisieren
        </Button>
      </div>
    </Card>
  );
}
