'use client';

import { useState } from 'react';
import sampleVideo from '@/fixtures/sample-video.json';

type RecommendedClip = {
  sceneId: string;
  startTime: number;
  endTime: number;
  reason: string;
  suggestedCaption: string;
};

type EditPlan = {
  summary: string;
  recommendedClips: RecommendedClip[];
};

type ApiErrorResponse = {
  error: string;
};

export default function RecommendPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EditPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecommend = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleVideo),
      });

      const data: EditPlan | ApiErrorResponse = await res.json();

      if (!res.ok || 'error' in data) {
        const message = 'error' in data ? data.error : '알 수 없는 오류가 발생했습니다';
        setErrorMessage(message);
        return;
      }

      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        KvidAI Shorts Edit Planner
      </h1>

      <p style={{ marginBottom: 16, color: '#666' }}>
        샘플 영상 데이터를 기반으로 AI가 숏폼 편집 구간을 추천합니다.
      </p>

      <button
        type="button"
        onClick={handleRecommend}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '분석 중...' : '편집 추천 받기'}
      </button>

      {errorMessage && (
        <div
          style={{ marginTop: 20, padding: 16, background: '#fee', borderRadius: 8, color: '#c00' }}
        >
          <strong>에러:</strong> {errorMessage}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>요약</h2>
          <p style={{ marginBottom: 24 }}>{result.summary}</p>

          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>추천 클립</h2>
          {result.recommendedClips.map((clip) => (
            <div
              key={clip.sceneId}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {clip.sceneId} ({clip.startTime}s ~ {clip.endTime}s)
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>추천 이유:</strong> {clip.reason}
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>추천 자막:</strong> {clip.suggestedCaption}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
