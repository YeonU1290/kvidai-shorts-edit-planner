import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { VideoFixtureSchema, EditPlanSchema, validateEditPlan } from '@/libs/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 입력 검증
    const parseResult = VideoFixtureSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: '입력 데이터가 유효하지 않습니다', details: parseResult.error.issues },
        { status: 400 },
      );
    }
    const fixture = parseResult.data;

    // 2. 프롬프트 구성
    const scenesText = fixture.scenes
      .map(
        (s) =>
          `- [${s.id}] ${s.startTime}s~${s.endTime}s: "${s.transcript}" (화면: ${s.visualDescription})`,
      )
      .join('\n');

    const systemPrompt = `당신은 숏폼 영상 편집 전문가입니다. 주어진 영상의 scene 정보를 분석해서, 가장 임팩트 있고 화제가 될 만한(hype) 짧은 클립 구간을 추천해주세요. 
반드시 주어진 scene의 시간 범위 안에서만 추천하고, 각 클립마다 추천 이유와 자막 문구를 제안하세요.`;

    const userPrompt = `영상 길이: ${fixture.durationSeconds}초\n\nScene 목록:\n${scenesText}\n\n이 영상에서 가장 매력적인 편집 구간들을 추천해주세요.`;

    // 3. OpenAI 호출 (Structured Output)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'edit_plan',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              recommendedClips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sceneId: { type: 'string' },
                    startTime: { type: 'number' },
                    endTime: { type: 'number' },
                    reason: { type: 'string' },
                    suggestedCaption: { type: 'string' },
                  },
                  required: ['sceneId', 'startTime', 'endTime', 'reason', 'suggestedCaption'],
                  additionalProperties: false,
                },
              },
            },
            required: ['summary', 'recommendedClips'],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: 'AI 응답이 비어있습니다' }, { status: 502 });
    }

    // 4. AI 응답 검증
    const aiJson = JSON.parse(rawContent);
    const planParseResult = EditPlanSchema.safeParse(aiJson);
    if (!planParseResult.success) {
      return NextResponse.json(
        { error: 'AI 응답 형식이 올바르지 않습니다', details: planParseResult.error.issues },
        { status: 502 },
      );
    }
    const editPlan = planParseResult.data;

    // 5. 비즈니스 규칙 검증 (시간 범위 등)
    const validationErrors = validateEditPlan(editPlan, fixture);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'AI 추천 결과가 규칙을 위반했습니다', details: validationErrors },
        { status: 502 },
      );
    }

    return NextResponse.json(editPlan);
  } catch (error) {
    console.error('recommend API error:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
