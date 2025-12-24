import type { Activity, EvaluationResult, ProfileInputs } from "../types";
import { universitiesDB } from "../data/universitiesDB";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export async function evaluateProfileWithChatGPT(
  inputs: ProfileInputs,
  activities: Activity[]
): Promise<EvaluationResult> {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not found, using fallback evaluation");
    return fallbackEvaluation(inputs, activities);
  }

  try {
    // Prepare context about target universities
    const targetUniNames = inputs.targetUniversities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const relevantUniversities = universitiesDB.filter((uni) =>
      targetUniNames.some((name) =>
        uni.name.toLowerCase().includes(name.toLowerCase())
      )
    );

    // Format activities for prompt
    const activitiesText = activities
      .map((act) => {
        const desc = act.aiEnhancedDescription || act.description;
        return `- ${act.title} (${act.role} at ${act.organization}): ${desc}. Category: ${act.category}, Duration: ${act.duration}, Hours: ${act.totalHours || act.hoursPerWeek || "N/A"}`;
      })
      .join("\n");

    // Format university requirements
    const uniRequirements = relevantUniversities
      .map((uni) => {
        const reqs = [];
        if (uni.requirements.sat?.median) {
          reqs.push(`SAT median: ${uni.requirements.sat.median}`);
        }
        if (uni.requirements.gpa?.median) {
          reqs.push(`GPA median: ${uni.requirements.gpa.median}`);
        }
        return `${uni.name}: ${reqs.join(", ")}`;
      })
      .join("\n");

    const prompt = `You are an experienced college admissions counselor helping a high school student assess their competitiveness for international universities.

STUDENT PROFILE:
- GPA: ${inputs.gpa || "Not provided"}
- SAT: ${inputs.sat || "Not provided"}
- IELTS: ${inputs.ielts || "Not provided"}
- TOEFL: ${inputs.toefl || "Not provided"}
- Intended Major: ${inputs.intendedMajor || "Not specified"}

EXTRACURRICULAR ACTIVITIES:
${activities.length > 0 ? activitiesText : "No extracurriculars listed yet."}

TARGET UNIVERSITIES & REQUIREMENTS:
${relevantUniversities.length > 0 ? uniRequirements : inputs.targetUniversities || "Not specified"}

TASK:
Provide a realistic, constructive evaluation. Be specific and actionable. Do NOT fabricate achievements or inflate chances.

1. Determine competitiveness level: "Reach", "Match", "Safety", or "Unclear" (if insufficient info)
2. Write a brief summary (2-3 sentences) explaining the level
3. List 3-5 specific STRENGTHS based on actual activities and scores
4. List 3-5 specific WEAKNESSES/GAPS that need improvement
5. Provide 3-5 SPECIFIC, ACTIONABLE next steps (not generic advice)

Format your response as JSON:
{
  "level": "Reach" | "Match" | "Safety" | "Unclear",
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}

Be honest, specific, and helpful. Focus on what can actually be improved.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // или "gpt-4" если есть доступ
        messages: [
          {
            role: "system",
            content:
              "You are an experienced college admissions counselor. Provide realistic, constructive feedback. Never fabricate achievements."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        level: parsed.level || "Unclear",
        summary: parsed.summary || "",
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        suggestions: parsed.suggestions || []
      };
    }

    // Fallback: try to extract structured info from text
    return parseTextResponse(content, inputs, activities);
  } catch (error) {
    console.error("ChatGPT evaluation error:", error);
    return fallbackEvaluation(inputs, activities);
  }
}

function parseTextResponse(
  text: string,
  inputs: ProfileInputs,
  activities: Activity[]
): EvaluationResult {
  // Simple parsing if JSON extraction fails
  const levelMatch = text.match(/"(Reach|Match|Safety|Unclear)"/);
  const level = (levelMatch?.[1] as EvaluationResult["level"]) || "Unclear";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  // Try to extract lists
  const strengthsMatch = text.match(/strengths?:?\s*([^\n]+(?:\n[^\n]+)*)/i);
  const weaknessesMatch = text.match(/weaknesses?:?\s*([^\n]+(?:\n[^\n]+)*)/i);
  const suggestionsMatch = text.match(/suggestions?:?\s*([^\n]+(?:\n[^\n]+)*)/i);

  return {
    level,
    summary: text.split("\n")[0] || "Evaluation completed.",
    strengths: strengths.length > 0 ? strengths : ["Profile analysis completed."],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Continue building your profile."],
    suggestions: suggestions.length > 0 ? suggestions : ["Focus on specific improvements."]
  };
}

function fallbackEvaluation(
  inputs: ProfileInputs,
  activities: Activity[]
): EvaluationResult {
  // Fallback heuristic evaluation (similar to mockAi but improved)
  const sat = parseFloat(inputs.sat) || 0;
  const gpa = parseFloat(inputs.gpa) || 0;

  let level: EvaluationResult["level"] = "Unclear";
  if (sat >= 1500 && gpa >= 3.9) {
    level = "Reach";
  } else if (sat >= 1400 && gpa >= 3.7) {
    level = "Match";
  } else if (sat >= 1300 && gpa >= 3.5) {
    level = "Safety";
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (activities.length > 0) {
    const leadershipCount = activities.filter(
      (a) => a.category === "Leadership" || a.role.toLowerCase().includes("lead")
    ).length;
    if (leadershipCount > 0) {
      strengths.push(`Strong leadership experience (${leadershipCount} activity/ies)`);
    }

    const longTermActivities = activities.filter((a) => {
      const duration = a.duration.toLowerCase();
      return duration.includes("year") || parseFloat(duration) >= 12;
    });
    if (longTermActivities.length > 0) {
      strengths.push(`Demonstrated commitment with ${longTermActivities.length} long-term activity/ies`);
    }
  } else {
    weaknesses.push("No extracurricular activities listed yet");
    suggestions.push("Start building your portfolio with meaningful activities");
  }

  if (sat > 0 && sat < 1400) {
    weaknesses.push(`SAT score (${sat}) may need improvement for top-tier universities`);
    suggestions.push("Consider retaking the SAT or focusing on test preparation");
  }

  if (gpa > 0 && gpa < 3.7) {
    weaknesses.push(`GPA (${gpa}) may be below average for competitive programs`);
    suggestions.push("Focus on improving grades in core academic subjects");
  }

  return {
    level,
    summary: `Based on your profile, you appear to be a ${level.toLowerCase()} candidate for many target universities.`,
    strengths: strengths.length > 0 ? strengths : ["Keep building your profile"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Continue developing your application"],
    suggestions: suggestions.length > 0 ? suggestions : ["Focus on specific areas for improvement"]
  };
}

