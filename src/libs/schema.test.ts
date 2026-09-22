import { describe, expect, it } from 'vitest';
import { EditPlanSchema, validateEditPlan, VideoFixtureSchema } from './schema';

const sampleFixture = {
  videoId: 'test-001',
  durationSeconds: 60,
  scenes: [
    {
      id: 'scene-1',
      startTime: 0,
      endTime: 10,
      transcript: '안녕하세요',
      visualDescription: '인사하는 장면',
    },
  ],
};

describe('VideoFixtureSchema validation', () => {
  it('유효한 fixture를 통과시킨다', () => {
    const result = VideoFixtureSchema.safeParse(sampleFixture);
    expect(result.success).toBeTruthy();
  });

  it('scenes가 빈 배열이면 실패한다', () => {
    const result = VideoFixtureSchema.safeParse({ ...sampleFixture, scenes: [] });
    expect(result.success).toBeFalsy();
  });

  it('필수 필드가 누락되면 실패한다', () => {
    const invalid = { videoId: 'test-001' };
    const result = VideoFixtureSchema.safeParse(invalid);
    expect(result.success).toBeFalsy();
  });
});

describe('EditPlanSchema validation', () => {
  it('필수 필드가 누락되면 실패한다', () => {
    const invalidResponse = { summary: '요약' };
    const result = EditPlanSchema.safeParse(invalidResponse);
    expect(result.success).toBeFalsy();
  });

  it('recommendedClips가 빈 배열이면 실패한다', () => {
    const invalidResponse = { summary: '요약', recommendedClips: [] };
    const result = EditPlanSchema.safeParse(invalidResponse);
    expect(result.success).toBeFalsy();
  });

  it('startTime이 음수이면 실패한다', () => {
    const plan = {
      summary: '요약',
      recommendedClips: [
        {
          sceneId: 'scene-1',
          startTime: -5,
          endTime: 10,
          reason: '테스트',
          suggestedCaption: '자막',
        },
      ],
    };
    const result = EditPlanSchema.safeParse(plan);
    expect(result.success).toBeFalsy();
  });
});

describe('validateEditPlan function', () => {
  it('정상적인 편집 플랜은 에러가 없다', () => {
    const plan = {
      summary: '요약',
      recommendedClips: [
        {
          sceneId: 'scene-1',
          startTime: 0,
          endTime: 10,
          reason: '인상적인 도입부',
          suggestedCaption: '안녕!',
        },
      ],
    };
    const parsedPlan = EditPlanSchema.parse(plan);
    const errors = validateEditPlan(parsedPlan, sampleFixture);
    expect(errors).toHaveLength(0);
  });

  it('시작 시간이 종료 시간보다 크거나 같으면 에러를 반환한다', () => {
    const plan = {
      summary: '요약',
      recommendedClips: [
        {
          sceneId: 'scene-1',
          startTime: 10,
          endTime: 5,
          reason: '테스트',
          suggestedCaption: '자막',
        },
      ],
    };
    const parsedPlan = EditPlanSchema.parse(plan);
    const errors = validateEditPlan(parsedPlan, sampleFixture);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('startTime');
  });

  it('추천 구간이 원본 영상 길이를 넘으면 에러를 반환한다', () => {
    const plan = {
      summary: '요약',
      recommendedClips: [
        {
          sceneId: 'scene-1',
          startTime: 0,
          endTime: 100,
          reason: '테스트',
          suggestedCaption: '자막',
        },
      ],
    };
    const parsedPlan = EditPlanSchema.parse(plan);
    const errors = validateEditPlan(parsedPlan, sampleFixture);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('영상 길이');
  });
});
