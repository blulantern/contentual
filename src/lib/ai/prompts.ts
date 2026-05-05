import { getNicheCategoriesText } from '../data/niche-categories';
import { PlatformConnection, SocialPlatform } from '@/types/platforms';
import { CreatorSurvey } from '@/types/profile';
import { PlanType } from '@/types/plans';

export type CacheKey =
  | 'profile-analysis'
  | 'niche-matching'
  | 'trend-analysis'
  | 'weekly-planning'
  | 'content-ideas';

export const SYSTEM_PROMPTS = {
  contentStrategy: `You are an expert content strategy AI assistant specializing in social media optimization, trend analysis, and content creator guidance. You provide actionable, specific recommendations based on data and best practices.`,

  profileAnalysis: `You are an expert at analyzing content creators and identifying their niche, style, and growth opportunities. You provide comprehensive profiles that help creators understand their positioning and potential.`,

  trendAnalysis: `You are a social media trend expert who identifies viral content patterns, emerging trends, and timely opportunities for content creators.`,

  planningExpert: `You are a content planning strategist who creates detailed, actionable weekly plans for content creators.`,
};

const CACHED_CONTEXTS: Record<CacheKey, string> = {
  'profile-analysis': `
NICHE CATEGORIES REFERENCE:
${getNicheCategoriesText()}

Use these exact categories when matching creators to their niches.
`,

  'niche-matching': `
NICHE MATCHING GUIDELINES:
1. Analyze the creator's platform usernames
2. Match to the top 3 most relevant categories
3. Provide confidence scores for each match
4. Explain the reasoning behind each match
`,

  'trend-analysis': `
TREND ANALYSIS FRAMEWORK:
- Identify viral patterns across platforms
- Note specific hashtags, audio tracks, or formats
- Assess trend longevity
- Provide platform-specific adaptations
`,

  'weekly-planning': `
WEEKLY PLANNING FRAMEWORK:

Full-Time (20+ hours/week):
- 5-7 posting days
- Multiple content pieces per day
- Dedicated creation blocks
- Daily engagement time

Part-Time (5-10 hours/week):
- 3-4 posting days
- 1-2 quality pieces per day
- Weekend creation blocks
- Efficient batching
`,

  'content-ideas': `
CONTENT IDEA FRAMEWORK:
1. Catchy title
2. Clear description
3. Step-by-step guide
4. Required equipment
5. Difficulty level
6. Time estimate
7. Best platforms
8. Related trends
`,
};

export const getCachedContext = (cacheKey: CacheKey): string => {
  return CACHED_CONTEXTS[cacheKey];
};

export const generateProfilePrompt = (
  platforms: PlatformConnection[],
  survey: CreatorSurvey
): string => {
  const platformList = platforms.map((p) => `- ${p.platform}: @${p.username}`).join('\n');
  const recentPosts =
    (survey.recentPostTitles?.length ?? 0) > 0
      ? survey.recentPostTitles.map((t) => `  - ${t}`).join('\n')
      : '  (none provided)';
  const audienceLine = survey.audience ? `\n- Audience: ${survey.audience}` : '';

  return `Create a comprehensive content creator profile.

CRITICAL RULE: Anchor niche matches in the creator's described CONTENT TOPICS and RECENT POSTS below. The username and the goals/equipment fields are weak signals — DO NOT over-weight them. If topics span multiple themes (for example parenting + dating + lifestyle), surface up to 5 distinct niches that together explain what the creator actually posts about. Each niche reasoning MUST quote or paraphrase specific evidence from the topics or recent posts.

CONTENT SIGNAL (highest priority):
- Topics: ${survey.contentTopics || '(none provided)'}
- Recent posts:
${recentPosts}${audienceLine}

PLATFORMS:
${platformList}

GOALS & CONSTRAINTS:
- Goals: ${survey.goals}
- Time: ${survey.timeCommitment} hours/week
- Challenges: ${survey.challenges.join(', ')}
- Formats: ${survey.preferredFormats.join(', ')}
- Equipment: ${survey.equipment.join(', ')}

IMPORTANT: Your entire response must be ONLY valid JSON. Do not include any text before or after the JSON object. Start with { and end with }.

Respond with this exact JSON structure. topNiches MUST contain between 3 and 5 entries — prefer 5 when content spans multiple themes:
{
  "baselineProfile": {
    "summary": "2-3 paragraph overview",
    "contentStyle": "Description",
    "strengths": ["..."],
    "opportunities": ["..."]
  },
  "topNiches": [
    {
      "nicheId": 1,
      "nicheName": "Name from the niche list reference",
      "confidence": 95,
      "reasoning": "Why this matches — cite evidence from topics/recent posts"
    }
  ],
  "similarCreators": [
    {
      "name": "Creator Name",
      "platform": "primary platform",
      "handle": "@username",
      "followerCount": "100K-500K",
      "niche": "Their niche",
      "keySuccessFactors": ["..."],
      "contentStyle": "Brief description"
    }
  ],
  "engagementStrategies": [
    {
      "platform": "instagram",
      "strategies": ["...", "...", "..."]
    }
  ],
  "topInfluencers": [
    {
      "niche": "Niche name",
      "influencers": [
        {
          "name": "Name",
          "platform": "platform",
          "handle": "@username",
          "followersRange": "1M-5M",
          "specialization": "What they do"
        }
      ]
    }
  ]
}

CRITICAL: Return ONLY the JSON object above. Include 3-5 entries in topNiches. Every similarCreator MUST include a "handle" field starting with @. No explanations, no markdown formatting, no code blocks.`;
};

export const analyzeTrendsPrompt = (niches: string[], platforms: SocialPlatform[]): string => {
  return `Analyze current social media trends for these niches: ${niches.join(', ')}

Platforms to consider: ${platforms.join(', ')}

Provide 10-15 trending topics, formats, or challenges that are currently popular.

For EACH hashtag and creator example, list the specific platform(s) where it actually trends — a hashtag may be huge on TikTok but inactive on YouTube, and creators are usually anchored to one or two platforms. Do not assume a hashtag/creator is on every platform the trend itself spans.

Respond in JSON format:
{
  "trends": [
    {
      "title": "Trend name",
      "description": "What the trend is about",
      "niche": "Exact niche name from list",
      "platforms": ["platform1", "platform2"],
      "trendingScore": 85,
      "hashtags": [
        {"tag": "#hashtag1", "platforms": ["tiktok", "instagram"]},
        {"tag": "#hashtag2", "platforms": ["tiktok"]}
      ],
      "audioTrack": "Popular audio if applicable",
      "exampleCreators": [
        {"handle": "@creator1", "platforms": ["tiktok"]},
        {"handle": "@creator2", "platforms": ["instagram", "youtube"]}
      ]
    }
  ]
}

CRITICAL: Return ONLY the JSON object above. Each hashtag and creator MUST be an object with a non-empty "platforms" array. Use ONLY platform names from this list: tiktok, instagram, youtube, twitter. No explanations, no markdown formatting, no code blocks.`;
};

export const generateContentIdeasPrompt = (
  niches: string[],
  platforms: SocialPlatform[],
  trends: string[] = []
): string => {
  const trendContext = trends.length > 0 ? `\n\nRecent trends to incorporate: ${trends.join(', ')}` : '';

  return `Generate 8-10 specific, actionable content ideas for these niches: ${niches.join(', ')}

Platforms: ${platforms.join(', ')}${trendContext}

Respond in JSON format:
{
  "ideas": [
    {
      "title": "Content idea title",
      "description": "Brief description",
      "niche": "Exact niche name",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "timeEstimate": 30,
      "equipment": ["Camera", "Tripod"],
      "platforms": ["tiktok", "instagram"],
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

CRITICAL: Return ONLY the JSON object above. No explanations, no markdown formatting, no code blocks. Just raw JSON starting with { and ending with }.`;
};

export const generateCreatorsForNichePrompt = (
  nicheName: string,
  platforms: SocialPlatform[]
): string => {
  return `List well-known content creators for the "${nicheName}" niche on these platforms: ${platforms.join(', ')}.

Provide BOTH:
1. 4-6 top influencers (large, well-known accounts in this niche)
2. 2-3 peer-level "similar creators" — smaller / mid-sized accounts the user could realistically learn from or compete with

Respond with this exact JSON structure:
{
  "niche": "${nicheName}",
  "influencers": [
    {
      "name": "Creator Name",
      "platform": "instagram",
      "handle": "@username",
      "followersRange": "1M-5M",
      "specialization": "What they're known for"
    }
  ],
  "similarCreators": [
    {
      "name": "Creator Name",
      "platform": "instagram",
      "handle": "@username",
      "followerCount": "100K-500K",
      "keySuccessFactors": ["Factor 1", "Factor 2"],
      "contentStyle": "Brief description"
    }
  ]
}

CRITICAL: Return ONLY the JSON. Every entry MUST include a real, plausible "handle" starting with @. No markdown, no explanations, no code blocks.`;
};

export const generateWeeklyPlanPrompt = (
  planType: PlanType,
  niches: string[],
  platforms: SocialPlatform[],
  trends: string[] = []
): string => {
  const trendContext = trends.length > 0 ? `\n\nIncorporate these trends: ${trends.join(', ')}` : '';

  return `Create a detailed weekly content plan for a ${planType} creator.

Niches: ${niches.join(', ')}
Platforms: ${platforms.join(', ')}${trendContext}

Respond in JSON format with 7 days (Monday-Sunday):
{
  "days": [
    {
      "tasks": [
        {
          "time": "09:00",
          "duration": 60,
          "type": "content-creation" | "posting" | "engagement" | "analytics" | "planning" | "batch-filming" | "editing",
          "title": "Task title",
          "description": "Task description",
          "platform": "instagram" (optional),
          "contentIdea": "Specific content idea" (optional),
          "notes": "Additional notes" (optional)
        }
      ]
    }
  ]
}

CRITICAL: Return ONLY the JSON object above. No explanations, no markdown formatting, no code blocks. Just raw JSON starting with { and ending with }.`;
};
