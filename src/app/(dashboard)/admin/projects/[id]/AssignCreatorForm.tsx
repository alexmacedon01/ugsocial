'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { UserPlus, X } from 'lucide-react';

interface Creator {
  id: string;
  full_name: string;
  email: string;
}

interface Assignment {
  id: string;
  creator_id: string;
  status: string;
  creator: { full_name: string; email: string };
}

interface Props {
  projectId: string;
  creators: Creator[];
  currentAssignments: Assignment[];
}

export function AssignCreatorForm({ projectId, creators, currentAssignments }: Props) {
  const router = useRouter();
  const [selectedCreator, setSelectedCreator] = useState('');
  const [loading, setLoading] = useState(false);

  const assignedIds = currentAssignments.map((a) => a.creator_id);
  const availableCreators = creators.filter((c) => !assignedIds.includes(c.id));

  const handleAssign = async () => {
    if (!selectedCreator) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('project_assignments').insert({
      project_id: projectId,
      creator_id: selectedCreator,
      assigned_by: user!.id,
      status: 'pending',
    });

    // Update project status if needed
    await supabase
      .from('projects')
      .update({ status: 'creator_assigned' })
      .eq('id', projectId)
      .in('status', ['scripts_approved', 'brief_submitted']);

    setSelectedCreator('');
    setLoading(false);
    router.refresh();
  };

  const handleRemove = async (assignmentId: string) => {
    const supabase = createClient();
    await supabase.from('project_assignments').delete().eq('id', assignmentId);
    router.refresh();
  };

  return (
    <Card>
      <CardTitle>Creator zuweisen</CardTitle>

      {/* Current Assignments */}
      {currentAssignments.length > 0 && (
        <div className="mt-3 space-y-2">
          {currentAssignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {assignment.creator?.full_name}
                </p>
                <Badge variant={assignment.status === 'accepted' ? 'success' : assignment.status === 'in_progress' ? 'info' : 'default'}>
                  {assignment.status === 'pending' ? 'Ausstehend' : assignment.status === 'accepted' ? 'Angenommen' : assignment.status === 'in_progress' ? 'In Arbeit' : assignment.status}
                </Badge>
              </div>
              <button
                onClick={() => handleRemove(assignment.id)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assign New */}
      {availableCreators.length > 0 && (
        <div className="mt-4 space-y-3">
          <Select
            id="creator"
            options={availableCreators.map((c) => ({
              value: c.id,
              label: c.full_name || c.email,
            }))}
            value={selectedCreator}
            onChange={(e) => setSelectedCreator(e.target.value)}
            placeholder="Creator auswählen..."
          />
          <Button
            onClick={handleAssign}
            disabled={!selectedCreator}
            loading={loading}
            size="sm"
            className="w-full"
          >
            <UserPlus size={16} />
            Zuweisen
          </Button>
        </div>
      )}
    </Card>
  );
}
