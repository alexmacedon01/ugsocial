'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const STEPS = [
  { id: 'basics', title: 'Projekt-Grundlagen' },
  { id: 'product', title: 'Produkt & Zielgruppe' },
  { id: 'creative', title: 'Kreative Anforderungen' },
  { id: 'references', title: 'Referenzen & Vorgaben' },
  { id: 'review', title: 'Zusammenfassung' },
];

const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Meta Ads', 'Snapchat', 'Pinterest'];
const VIDEO_STYLES = [
  'Testimonial', 'Unboxing', 'Problem-Lösung', 'Day-in-my-Life', 'GRWM',
  'Tutorial/How-To', 'Vorher/Nachher', 'Vergleich', 'Storytelling', 'Product Review',
];
const OBJECTIVES = [
  { value: 'awareness', label: 'Awareness / Bekanntheit' },
  { value: 'conversion', label: 'Conversion / Verkauf' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'lead_generation', label: 'Lead-Generierung' },
];

interface BriefData {
  title: string;
  campaign_objective: string;
  platforms: string[];
  budget_tier: string;
  num_videos: number;
  product_name: string;
  product_description: string;
  key_selling_points: string;
  target_audience: string;
  video_styles: string[];
  key_messaging: string;
  dos: string;
  donts: string;
  reference_video_urls: string;
  timeline: string;
  deadline: string;
  creator_preferences: string;
}

export default function NewBriefPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BriefData>({
    title: '',
    campaign_objective: '',
    platforms: [],
    budget_tier: '',
    num_videos: 1,
    product_name: '',
    product_description: '',
    key_selling_points: '',
    target_audience: '',
    video_styles: [],
    key_messaging: '',
    dos: '',
    donts: '',
    reference_video_urls: '',
    timeline: '',
    deadline: '',
    creator_preferences: '',
  });

  const update = (field: keyof BriefData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: 'platforms' | 'video_styles', value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('projects').insert({
      client_id: user.id,
      title: data.title,
      status: 'brief_submitted',
      campaign_objective: data.campaign_objective,
      platforms: data.platforms,
      budget_tier: data.budget_tier,
      num_videos: data.num_videos,
      video_styles: data.video_styles,
      key_messaging: data.key_messaging.split('\n').filter(Boolean),
      dos: data.dos.split('\n').filter(Boolean),
      donts: data.donts.split('\n').filter(Boolean),
      reference_video_urls: data.reference_video_urls.split('\n').filter(Boolean),
      timeline: data.timeline,
      deadline: data.deadline || null,
      creator_preferences: data.creator_preferences ? { notes: data.creator_preferences } : null,
    });

    if (error) {
      console.error('Error creating project:', error);
      setLoading(false);
      return;
    }

    router.push('/client/projects');
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Neues Projekt erstellen"
        description="Fülle das Briefing aus, damit wir die perfekten UGC-Videos für dich erstellen können."
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                  : 'bg-white/20 text-text-tertiary'
              }`}>
                {i + 1}
              </div>
              <span className={`ml-2 hidden text-sm font-medium sm:inline ${
                i <= step ? 'text-text-primary' : 'text-text-tertiary'
              }`}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-4 h-px w-8 sm:w-16 ${
                  i < step ? 'bg-amber-400' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {/* Step 1: Basics */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">Projekt-Grundlagen</h2>
            <Input
              id="title"
              label="Projektname"
              value={data.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="z.B. Frühjahrskampagne Produktlinie X"
              required
            />
            <Select
              id="objective"
              label="Kampagnenziel"
              options={OBJECTIVES}
              value={data.campaign_objective}
              onChange={(e) => update('campaign_objective', e.target.value)}
              placeholder="Ziel auswählen..."
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Plattformen
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleArray('platforms', p)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      data.platforms.includes(p)
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                        : 'glass-panel-light text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="budget"
                label="Budget-Stufe"
                value={data.budget_tier}
                onChange={(e) => update('budget_tier', e.target.value)}
                placeholder="z.B. Standard, Premium"
              />
              <Input
                id="numVideos"
                label="Anzahl Videos"
                type="number"
                min={1}
                value={data.num_videos}
                onChange={(e) => update('num_videos', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Product & Target Audience */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">Produkt & Zielgruppe</h2>
            <Input
              id="productName"
              label="Produktname"
              value={data.product_name}
              onChange={(e) => update('product_name', e.target.value)}
              placeholder="Name des beworbenen Produkts/Services"
            />
            <Textarea
              id="productDesc"
              label="Produktbeschreibung"
              value={data.product_description}
              onChange={(e) => update('product_description', e.target.value)}
              placeholder="Was ist das Produkt? Was macht es besonders?"
              rows={3}
            />
            <Textarea
              id="sellingPoints"
              label="Key Selling Points (einer pro Zeile)"
              value={data.key_selling_points}
              onChange={(e) => update('key_selling_points', e.target.value)}
              placeholder="Vegan & nachhaltig&#10;Made in Germany&#10;30 Tage Geld-zurück-Garantie"
              rows={4}
            />
            <Textarea
              id="targetAudience"
              label="Zielgruppe"
              value={data.target_audience}
              onChange={(e) => update('target_audience', e.target.value)}
              placeholder="Beschreibe die Zielgruppe: Alter, Interessen, Pain Points, Wünsche..."
              rows={4}
            />
          </div>
        )}

        {/* Step 3: Creative Requirements */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">Kreative Anforderungen</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Video-Stile
              </label>
              <div className="flex flex-wrap gap-2">
                {VIDEO_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleArray('video_styles', style)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      data.video_styles.includes(style)
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                        : 'glass-panel-light text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="keyMessaging"
              label="Key Messages (eine pro Zeile)"
              value={data.key_messaging}
              onChange={(e) => update('key_messaging', e.target.value)}
              placeholder="Diese Punkte MÜSSEN im Video vorkommen..."
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Textarea
                id="dos"
                label="Do's (eine pro Zeile)"
                value={data.dos}
                onChange={(e) => update('dos', e.target.value)}
                placeholder="Produkt in der Hand zeigen&#10;Natürliches Licht verwenden"
                rows={4}
              />
              <Textarea
                id="donts"
                label="Don'ts (eine pro Zeile)"
                value={data.donts}
                onChange={(e) => update('donts', e.target.value)}
                placeholder="Keine Konkurrenzprodukte zeigen&#10;Keine Health Claims"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 4: References */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">Referenzen & Vorgaben</h2>
            <Textarea
              id="referenceUrls"
              label="Referenz-Videos (URLs, eine pro Zeile)"
              value={data.reference_video_urls}
              onChange={(e) => update('reference_video_urls', e.target.value)}
              placeholder="https://www.tiktok.com/@example/video/123&#10;https://www.instagram.com/reel/xyz"
              rows={4}
            />
            <Input
              id="timeline"
              label="Zeitrahmen"
              value={data.timeline}
              onChange={(e) => update('timeline', e.target.value)}
              placeholder="z.B. 2 Wochen, bis Ende des Monats"
            />
            <Input
              id="deadline"
              label="Deadline"
              type="date"
              value={data.deadline}
              onChange={(e) => update('deadline', e.target.value)}
            />
            <Textarea
              id="creatorPrefs"
              label="Creator-Präferenzen (optional)"
              value={data.creator_preferences}
              onChange={(e) => update('creator_preferences', e.target.value)}
              placeholder="z.B. weiblich, 20-30, sportlicher Look, Deutsch als Muttersprache"
              rows={3}
            />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">Zusammenfassung</h2>
            <div className="glass-panel-light rounded-xl p-4 space-y-4">
              <ReviewRow label="Projektname" value={data.title} />
              <ReviewRow label="Kampagnenziel" value={data.campaign_objective} />
              <ReviewRow label="Plattformen" value={data.platforms.join(', ')} />
              <ReviewRow label="Anzahl Videos" value={String(data.num_videos)} />
              <ReviewRow label="Video-Stile" value={data.video_styles.join(', ')} />
              <ReviewRow label="Produktname" value={data.product_name} />
              <ReviewRow label="Deadline" value={data.deadline || 'Keine angegeben'} />
            </div>
            <p className="text-sm text-text-secondary">
              Nach dem Absenden wird unser Team das Briefing prüfen und AI-gestützte Scripts erstellen.
              Du wirst benachrichtigt, sobald die Scripts zur Freigabe bereit sind.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft size={16} />
            Zurück
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Weiter
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              <Send size={16} />
              Brief absenden
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-2 last:border-0">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <span className="text-sm text-text-primary">{value || '—'}</span>
    </div>
  );
}
