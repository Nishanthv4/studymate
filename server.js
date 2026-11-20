import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;
const MODEL_NAME = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');

// Vite can move to 5174/5175 when its default port is busy. Allow only local browser origins.
app.use(cors({
  origin(origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('This local API only accepts requests from localhost.'));
  },
}));
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!ollamaResponse.ok) {
      return res.json({ ok: false, ollamaConnected: false, modelInstalled: false, model: MODEL_NAME, message: 'Ollama is responding with an error.' });
    }
    const data = await ollamaResponse.json();
    const models = Array.isArray(data.models) ? data.models : [];
    const modelInstalled = models.some((item) => item.name === MODEL_NAME || item.name?.startsWith(`${MODEL_NAME}:`));
    return res.json({
      ok: modelInstalled,
      ollamaConnected: true,
      modelInstalled,
      model: MODEL_NAME,
      message: modelInstalled ? 'The local model is ready.' : `Run ollama pull ${MODEL_NAME} to install the model.`,
    });
  } catch {
    return res.json({ ok: false, ollamaConnected: false, modelInstalled: false, model: MODEL_NAME, message: `Could not reach Ollama at ${OLLAMA_BASE_URL}.` });
  }
});

function baseFormattingRules(dayCount, dailyHours) {
  return `Formatting rules:
- Return only the study plan in clean Markdown. Do not add an introduction, a conclusion, raw links, tables, or long resource lists.
- Create exactly ${dayCount} day sections. Start each day with a heading exactly like: ## Day 1 — C++ and Mathematics.
- Within every day, start each session with a heading like: ### 4:00 PM – 4:45 PM. Every session needs a clear time range.
- Put each task as one top-level bullet. Include its duration in parentheses, such as: - Practice array problems (25 minutes).
- Add at most one short indented sub-bullet under a task to explain the task.
- Put breaks as separate bullets, such as: - Break (10 minutes).
- Keep task titles short, specific, and easy to scan. Avoid Markdown links and URLs.

Planning rules:
- Keep actual focused study time within ${dailyHours} hours per day. Break time is additional and should be reasonable.
- Balance the supplied subjects and topic priorities. Respect any supplied deadlines; never invent exact dates.
- Include active recall, practice questions, and short revision sessions.
- Place foundational topics before topics that depend on them.
- Use realistic session lengths and leave some room for a missed or difficult session.
- Respect complete class-period ranges supplied separately. If no complete class times are available, suggest reasonable personal-study windows and clearly treat them as suggestions, not actual class periods.`;
}

async function callLocalModel(prompt, systemPrompt, maxTokens = 1900) {
  let ollamaResponse;
  try {
    ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      options: { temperature: 0.35, num_predict: maxTokens },
    }),
      signal: AbortSignal.timeout(180000),
    });
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError';
    const error = new Error(timedOut
      ? 'The local model took too long to respond. Try a shorter plan or a smaller model.'
      : `Could not connect to Ollama at ${OLLAMA_BASE_URL}. Make sure Ollama is running.`);
    error.status = timedOut ? 504 : 502;
    throw error;
  }

  const responseText = await ollamaResponse.text();
  let ollamaData;
  try { ollamaData = JSON.parse(responseText); } catch { ollamaData = null; }
  if (!ollamaResponse.ok) {
    const detail = ollamaData?.error || responseText || 'Unknown Ollama error';
    const error = new Error(`Ollama returned an error: ${detail}`);
    error.status = 502;
    throw error;
  }
  const plan = ollamaData?.message?.content?.trim();
  if (!plan) {
    const error = new Error('The model returned an empty response. Please try again.');
    error.status = 502;
    throw error;
  }
  return plan;
}

function validatePlanInput(body) {
  const subjects = body?.subjects;
  const dailyHours = Number(body?.hours);
  const dayCount = Number(body?.days ?? 3);
  if (typeof subjects !== 'string' || !subjects.trim()) return { error: 'Please enter at least one subject.' };
  if (subjects.trim().length > 4000) return { error: 'Keep subjects and topics under 4,000 characters.' };
  if (!Number.isFinite(dailyHours) || dailyHours < 0.5 || dailyHours > 16) return { error: 'Available study time must be between 0.5 and 16 hours per day.' };
  if (![3, 5, 7].includes(dayCount)) return { error: 'Choose a plan length of 3, 5, or 7 days.' };
  const deadlines = typeof body?.deadlines === 'string' ? body.deadlines.trim() : '';
  const goal = typeof body?.goal === 'string' ? body.goal.trim() : '';
  const classTimetable = typeof body?.classTimetable === 'string' ? body.classTimetable.trim() : '';
  const currentDateInput = typeof body?.currentDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.currentDate) ? body.currentDate : '';
  const currentDateParsed = currentDateInput ? new Date(`${currentDateInput}T00:00:00`) : null;
  const currentDate = currentDateParsed && !Number.isNaN(currentDateParsed.getTime())
    && currentDateParsed.getFullYear() === Number(currentDateInput.slice(0, 4))
    && currentDateParsed.getMonth() + 1 === Number(currentDateInput.slice(5, 7))
    && currentDateParsed.getDate() === Number(currentDateInput.slice(8, 10))
    ? currentDateInput
    : (() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; })();
  const currentDayInput = typeof body?.currentDay === 'string' ? body.currentDay.trim() : '';
  const currentDay = /^[A-Za-z]{3,12}$/.test(currentDayInput) ? currentDayInput : new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentTimeInput = typeof body?.currentTime === 'string' ? body.currentTime.trim() : '';
  const currentTime = /^\d{1,2}:\d{2}\s?(?:AM|PM)$/i.test(currentTimeInput) ? currentTimeInput : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const studyStartTimeInput = typeof body?.studyStartTime === 'string' ? body.studyStartTime.trim() : '';
  const studyStartTime = /^\d{1,2}:\d{2}$/.test(studyStartTimeInput) ? studyStartTimeInput : '07:00';
  const studyEndTimeInput = typeof body?.studyEndTime === 'string' ? body.studyEndTime.trim() : '';
  const studyEndTime = /^\d{1,2}:\d{2}$/.test(studyEndTimeInput) ? studyEndTimeInput : '22:00';
  if (deadlines.length > 3000) return { error: 'Keep deadlines under 3,000 characters.' };
  if (goal.length > 500) return { error: 'Keep the main goal under 500 characters.' };
  if (classTimetable.length > 12000) return { error: 'Your class timetable is too large. Please shorten it.' };
  return { subjects: subjects.trim(), dailyHours, dayCount, deadlines, goal, classTimetable, currentDate, currentDay, currentTime, studyStartTime, studyEndTime };
}

app.post('/api/study-plan', async (req, res) => {
  const validated = validatePlanInput(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  const { subjects, dailyHours, dayCount, currentDate, currentDay, currentTime, studyStartTime, studyEndTime } = validated;
  const deadlines = validated.deadlines || 'Not provided';
  const goal = validated.goal || 'Make steady progress across the subjects';
  const classTimetable = validated.classTimetable;
  // Difficulty hints from weak topics
  const difficultyHints = typeof req.body?.difficultyHints === 'string' ? req.body.difficultyHints.trim().slice(0, 1000) : '';

  const prompt = `Create a realistic, useful study schedule for this student.

Current local date: ${currentDate} (${currentDay}). Current local time: ${currentTime}.
Day 1 starts today. Day 2 is the next calendar day, and so on. For Day 1, do not propose sessions earlier than the current local time. Use the actual weekday when applying the saved weekly class timetable.
Earliest personal study start time: ${studyStartTime} and latest wrap-up time: ${studyEndTime} — schedule all independent study strictly within this daily time window.
Subjects and topics: ${subjects}
Available focused study time per day: ${dailyHours} hours
Plan length: exactly ${dayCount} days
Upcoming exams, assignments, or deadlines: ${deadlines}
Main goal: ${goal}
${difficultyHints ? `Difficulty-based priority (give MORE study time to these weak topics): ${difficultyHints}` : ''}
Class periods saved by the student (do not schedule independent study during these occupied times):
${classTimetable || 'No class periods have both a subject and start/end time configured; do not assume a real class timetable.'}

${baseFormattingRules(dayCount, dailyHours)}

End the final day with a short optional catch-up or review task. Do not claim the schedule is guaranteed to fit their real timetable.`;

  try {
    const plan = await callLocalModel(prompt, 'You are a practical study coach. Produce structured, concise Markdown for a visual study planner. Follow the requested day/session/bullet format precisely. Keep each task achievable and keep focused study time within the student\'s limit. Do not invent deadline dates or external resources.');
    return res.json({ plan, model: MODEL_NAME, days: dayCount });
  } catch (error) {
    console.error('Could not generate a local study plan:', error);
    return res.status(error.status || 502).json({ error: error.message || `Could not reach Ollama at ${OLLAMA_BASE_URL}. Make sure Ollama is running and ${MODEL_NAME} is installed.` });
  }
});

app.post('/api/refine-plan', async (req, res) => {
  const validated = validatePlanInput(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  const { subjects, dailyHours, dayCount, currentDate, currentDay, currentTime, studyStartTime, studyEndTime } = validated;
  const currentPlan = String(req.body?.plan || '').trim();
  const instruction = String(req.body?.instruction || '').trim();
  const deadlines = validated.deadlines || 'Not provided';
  const goal = validated.goal || 'Make steady progress across the subjects';
  const classTimetable = validated.classTimetable;

  if (!currentPlan) return res.status(400).json({ error: 'Generate a plan before asking for changes.' });
  if (!instruction) return res.status(400).json({ error: 'Tell the AI what you want to change.' });
  if (instruction.length > 1200) return res.status(400).json({ error: 'Keep the change request under 1,200 characters.' });

  const prompt = `Revise the existing study plan to follow the student's change request. Return the complete revised plan, not just the changed part.

Student details:
Current local date: ${currentDate} (${currentDay}). Current local time: ${currentTime}.
Day 1 starts today. Day 2 is the next calendar day, and so on. For Day 1, do not propose sessions earlier than the current local time. Use the actual weekday when applying the saved weekly class timetable.
Earliest personal study start time: ${studyStartTime} and latest wrap-up time: ${studyEndTime} — schedule all independent study strictly within this daily time window.
Subjects and topics: ${subjects}
Focused study time per day: ${dailyHours} hours
Plan length: exactly ${dayCount} days
Upcoming deadlines: ${deadlines}
Main goal: ${goal}
Class periods saved by the student (do not schedule independent study during these occupied times):
${classTimetable || 'No class periods have both a subject and start/end time configured; do not assume a real class timetable.'}

Requested change:
${instruction}

Current plan:
${currentPlan.slice(0, 10000)}

${baseFormattingRules(dayCount, dailyHours)}

Keep the unchanged parts where they still make sense. Respect deadlines, daily study time, and any complete class periods supplied above. If asked to make the workload lighter, reduce tasks or shorten sessions rather than simply saying it is lighter. Return only the complete revised plan.`;

  try {
    const plan = await callLocalModel(prompt, 'You are a helpful study coach revising a previously generated plan. Make the requested change concrete, keep the plan complete, preserve correct constraints and return concise structured Markdown.');
    return res.json({ plan, model: MODEL_NAME, days: dayCount });
  } catch (error) {
    console.error('Could not refine the local study plan:', error);
    return res.status(error.status || 502).json({ error: error.message || `Could not reach Ollama at ${OLLAMA_BASE_URL}. Make sure Ollama is running and ${MODEL_NAME} is installed.` });
  }
});

// ─── AI Study Assistant ───────────────────────────────────────────────────────
app.post('/api/ai-assistant', async (req, res) => {
  const question = String(req.body?.question || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const context = String(req.body?.context || '').trim();
  if (!question) return res.status(400).json({ error: 'Please ask a question.' });
  if (question.length > 2000) return res.status(400).json({ error: 'Keep questions under 2,000 characters.' });

  const prompt = `A student is asking a study question${subject ? ` about ${subject}` : ''}.
${context ? `Additional context the student provided: ${context.slice(0, 500)}\n` : ''}
Student's question: ${question}

Please give a clear, educational answer. Use simple language. Where helpful, use short bullet points or numbered steps. Keep the answer focused and under 350 words.`;

  try {
    const answer = await callLocalModel(prompt,
      'You are a knowledgeable and friendly study tutor. Explain concepts clearly, use examples where helpful, and keep answers concise and student-friendly. Do not fabricate facts.',
      800
    );
    return res.json({ answer, model: MODEL_NAME });
  } catch (error) {
    console.error('AI assistant error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

// ─── AI Quiz Generator ────────────────────────────────────────────────────────
app.post('/api/generate-quiz', async (req, res) => {
  const subject = String(req.body?.subject || '').trim();
  const topic = String(req.body?.topic || '').trim();
  const difficulty = String(req.body?.difficulty || 'medium').trim();
  const quizType = String(req.body?.type || 'mcq').trim(); // 'mcq' | 'short'
  const count = Math.min(10, Math.max(3, Number(req.body?.count || 5)));
  const notesContext = String(req.body?.notesContext || '').trim();

  if (!subject && !topic) return res.status(400).json({ error: 'Please provide a subject or topic for the quiz.' });

  const topicText = topic || subject;

  let prompt;
  if (quizType === 'short') {
    prompt = `Generate exactly ${count} short-answer study questions about: ${topicText}.
Difficulty level: ${difficulty}.
${notesContext ? `Base the questions on this content: ${notesContext.slice(0, 2000)}\n` : ''}
Format each question as:
Q1. [Question text]
Answer: [Concise answer in 1-2 sentences]

Return only the questions and answers in that format. No introduction or extra commentary.`;
  } else {
    prompt = `Generate exactly ${count} multiple-choice questions about: ${topicText}.
Difficulty level: ${difficulty}.
${notesContext ? `Base the questions on this content: ${notesContext.slice(0, 2000)}\n` : ''}
Format each question as:
Q1. [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Correct: [A/B/C/D]
Explanation: [Brief 1-sentence explanation]

Return only the quiz in that format. No introduction or extra commentary.`;
  }

  try {
    const quiz = await callLocalModel(prompt,
      'You are an expert quiz creator for students. Generate clear, accurate, and educationally valuable questions. Vary the question types (recall, application, conceptual). Return only the formatted quiz.',
      1200
    );
    return res.json({ quiz, model: MODEL_NAME, type: quizType });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

// ─── PDF Notes Analyzer (text extraction happens client-side, we get the text) ─
app.post('/api/analyze-notes', async (req, res) => {
  const notesText = String(req.body?.text || '').trim();
  const mode = String(req.body?.mode || 'summary').trim(); // 'summary' | 'quiz' | 'both'
  const subject = String(req.body?.subject || '').trim();

  if (!notesText) return res.status(400).json({ error: 'No notes text provided to analyze.' });
  if (notesText.length > 8000) return res.status(400).json({ error: 'Keep notes under 8,000 characters for analysis.' });

  const subjectContext = subject ? ` for ${subject}` : '';

  let prompt;
  if (mode === 'quiz') {
    prompt = `Based on the following study notes${subjectContext}, generate 5 multiple-choice questions that test understanding of the key concepts.

Notes:
${notesText.slice(0, 6000)}

Format:
Q1. [Question]
A) [Option] B) [Option] C) [Option] D) [Option]
Correct: [Letter]
Explanation: [1 sentence]

Return only the formatted quiz.`;
  } else if (mode === 'both') {
    prompt = `Analyze the following study notes${subjectContext} and provide:

1. KEY CONCEPTS (bullet list of the 5-7 most important ideas)
2. SUMMARY (2-3 paragraph concise summary)
3. QUIZ (3 multiple-choice questions in format: Q. / A) B) C) D) / Correct: / Explanation:)

Notes:
${notesText.slice(0, 5000)}

Return structured output with clear section headings.`;
  } else {
    prompt = `Analyze the following study notes${subjectContext} and provide:

KEY CONCEPTS: List the 6-8 most important concepts as bullets.
SUMMARY: Write a 2-3 paragraph summary capturing the main ideas.
WEAK AREAS: Identify 2-3 topics that seem incomplete or need more study.
STUDY TIPS: Give 2 specific tips for studying this material effectively.

Notes:
${notesText.slice(0, 6000)}

Return a clear, structured response with those four sections.`;
  }

  try {
    const analysis = await callLocalModel(prompt,
      'You are an expert academic tutor analyzing student notes. Provide clear, structured, and helpful analysis. Focus on what will help the student learn most effectively.',
      1400
    );
    return res.json({ analysis, model: MODEL_NAME, mode });
  } catch (error) {
    console.error('Notes analysis error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

// ─── Weak Topic Detection ─────────────────────────────────────────────────────
app.post('/api/detect-weak-topics', async (req, res) => {
  const subjects = String(req.body?.subjects || '').trim();
  const difficultTopics = req.body?.difficultTopics;
  const quizErrors = req.body?.quizErrors;

  if (!subjects && !difficultTopics) return res.status(400).json({ error: 'Provide subjects or topic data.' });

  const topicLines = Array.isArray(difficultTopics)
    ? difficultTopics.map((t) => `- ${String(t).slice(0, 100)}`).slice(0, 20).join('\n')
    : '';
  const errorLines = Array.isArray(quizErrors)
    ? quizErrors.map((e) => `- ${String(e).slice(0, 100)}`).slice(0, 20).join('\n')
    : '';

  const prompt = `A student is studying: ${subjects || 'various subjects'}.

${topicLines ? `Topics the student marked as difficult or struggled with:\n${topicLines}\n` : ''}
${errorLines ? `Topics where the student got quiz questions wrong:\n${errorLines}\n` : ''}

Based on this data:
1. Identify the TOP 5 weak topics that need the most attention.
2. For each weak topic, explain WHY it is likely difficult (1 sentence).
3. Suggest one specific study action to improve each topic.

Format as:
WEAK TOPIC 1: [topic name]
Why difficult: [reason]
Action: [specific study action]

(Repeat for each topic)

Be specific and practical. Keep the total response under 400 words.`;

  try {
    const analysis = await callLocalModel(prompt,
      'You are an educational analytics assistant. Identify weak areas based on student performance data and give specific, actionable improvement advice.',
      700
    );
    return res.json({ analysis, model: MODEL_NAME });
  } catch (error) {
    console.error('Weak topic detection error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

// ─── Study Plan Explainer ──────────────────────────────────────────────────────
app.post('/api/explain-plan', async (req, res) => {
  const plan = String(req.body?.plan || '').trim();
  const subjects = String(req.body?.subjects || '').trim();
  const goal = String(req.body?.goal || '').trim();
  const hours = Number(req.body?.hours || 2);
  const days = Number(req.body?.days || 3);

  if (!plan) return res.status(400).json({ error: 'No plan provided to explain.' });

  const prompt = `A student generated this study plan. Explain the AI's reasoning in plain, friendly language.

Plan details:
- Subjects: ${subjects || 'various'}
- Daily study time: ${hours} hours
- Plan length: ${days} days
- Goal: ${goal || 'steady progress'}

Study Plan (excerpt):
${plan.slice(0, 3000)}

Please explain:
1. WHY the AI chose this particular ordering of subjects
2. WHY certain subjects got more time than others
3. HOW the session lengths and breaks were decided
4. WHAT the overall strategy is

Write in a friendly, encouraging tone as if explaining to the student directly. Keep it under 300 words. Use bullet points for each section.`;

  try {
    const explanation = await callLocalModel(prompt,
      'You are a helpful study coach explaining your planning decisions to a student. Be friendly, clear, and encouraging. Focus on the reasoning behind the plan structure.',
      700
    );
    return res.json({ explanation, model: MODEL_NAME });
  } catch (error) {
    console.error('Plan explanation error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

// ─── Exam Readiness Score ─────────────────────────────────────────────────────
app.post('/api/exam-readiness', async (req, res) => {
  const subjects = String(req.body?.subjects || '').trim();
  const completedTasks = Number(req.body?.completedTasks || 0);
  const totalTasks = Number(req.body?.totalTasks || 0);
  const studyHours = Number(req.body?.studyHours || 0);
  const targetHours = Number(req.body?.targetHours || 10);
  const quizScores = req.body?.quizScores; // array of {subject, score (0-100)}
  const weakTopics = req.body?.weakTopics; // array of strings
  const daysUntilExam = Number(req.body?.daysUntilExam || 7);

  const quizSummary = Array.isArray(quizScores) && quizScores.length > 0
    ? quizScores.map((q) => `${q.subject || 'General'}: ${q.score}%`).join(', ')
    : 'No quiz scores recorded yet';

  const weakSummary = Array.isArray(weakTopics) && weakTopics.length > 0
    ? weakTopics.slice(0, 5).join(', ')
    : 'None identified';

  const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hoursPct = targetHours > 0 ? Math.round((studyHours / targetHours) * 100) : 0;

  const prompt = `Calculate an exam readiness score for a student and provide feedback.

Student data:
- Subjects: ${subjects || 'various'}
- Days until exam: ${daysUntilExam}
- Syllabus completion: ${taskCompletionPct}% (${completedTasks}/${totalTasks} tasks done)
- Study hours completed: ${studyHours.toFixed(1)}h out of ${targetHours}h target (${hoursPct}%)
- Quiz performance: ${quizSummary}
- Identified weak topics: ${weakSummary}

Based on this data, provide:
1. READINESS SCORE: A number from 0-100 (be realistic and honest)
2. SCORE BREAKDOWN: Brief explanation of how you calculated it
3. VERDICT: One of: "Not Ready", "Partially Ready", "Mostly Ready", "Well Prepared"
4. KEY GAPS: The 2-3 most critical things to address before the exam
5. FINAL PUSH PLAN: 3 specific actions the student should take in the remaining time

Format with clear section headers. Be honest but encouraging. Keep total under 350 words.`;

  try {
    const readiness = await callLocalModel(prompt,
      'You are an academic performance analyst. Give honest, data-driven exam readiness assessments with actionable advice. Be encouraging but realistic.',
      700
    );
    return res.json({ readiness, model: MODEL_NAME });
  } catch (error) {
    console.error('Exam readiness error:', error);
    return res.status(error.status || 502).json({ error: error.message });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'The request body contains invalid JSON.' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request was too large. Shorten the text and try again.' });
  }
  console.error('Local API request error:', error?.message || error);
  return res.status(500).json({ error: 'The local API encountered an unexpected error.' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Study Planner API running at http://127.0.0.1:${PORT}`);
  console.log(`Configured local model: ${MODEL_NAME}`);
});
