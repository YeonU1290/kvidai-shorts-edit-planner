import { z } from 'zod';

// 입력: 영상 분석 fixture
export const SceneSchema = z.object({
  id: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  transcript: z.string(),
  visualDescription: z.string(),
});

export const VideoFixtureSchema = z.object({
  videoId: z.string(),
  durationSeconds: z.number().positive(),
  scenes: z.array(SceneSchema).min(1),
});

export type VideoFixture = z.infer<typeof VideoFixtureSchema>;

// 출력: AI가 추천하는 편집 플랜
export const RecommendedClipSchema = z.object({
  sceneId: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  reason: z.string(),
  suggestedCaption: z.string(),
});

export const EditPlanSchema = z.object({
  summary: z.string(),
  recommendedClips: z.array(RecommendedClipSchema).min(1),
});

export type EditPlan = z.infer<typeof EditPlanSchema>;

// 추가 검증: 시작<종료, 원본 영상 길이 초과 안 함
export function validateEditPlan(plan: EditPlan, fixture: VideoFixture): string[] {
  const errors: string[] = [];

  for (const clip of plan.recommendedClips) {
    if (clip.startTime >= clip.endTime) {
      errors.push(
        `Clip ${clip.sceneId}: startTime(${clip.startTime})이 endTime(${clip.endTime})보다 크거나 같음`,
      );
    }
    if (clip.endTime > fixture.durationSeconds) {
      errors.push(
        `Clip ${clip.sceneId}: endTime(${clip.endTime})이 영상 길이(${fixture.durationSeconds})를 초과함`,
      );
    }
    if (clip.startTime < 0) {
      errors.push(`Clip ${clip.sceneId}: startTime이 음수임`);
    }
  }

  return errors;
}
