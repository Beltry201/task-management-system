const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');
const pool = require('../config/database');

async function fetchNewestTasks(limit) {
  const result = await pool.query(
    `SELECT id, title, description FROM tasks ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function callOpenAiForSummary(text) {
  if (!env.openAiApiKey) {
    // No key configured; return a simple naive summary as fallback
    const sentences = text.split(/\n+/).filter(Boolean);
    const top = sentences.slice(0, 3).join(' ');
    return `Summary (fallback): ${top}`;
  }

  // Minimal dependency approach: direct fetch to OpenAI API
  const fetch = global.fetch || (await import('node-fetch')).default;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You summarize task lists into a concise overview.' },
      { role: 'user', content: `Summarize the following tasks for a status update:\n\n${text}` }
    ],
    temperature: 0.3,
    max_tokens: 200
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const textErr = await resp.text();
    throw new AppError(`AI summary failed: ${textErr}`, 502);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return content || 'No summary generated.';
}

async function getSummaryOfNewestTasks(limit, req = null) {
  try {
    const tasks = await fetchNewestTasks(limit);
    if (tasks.length === 0) {
      return { summary: 'No tasks available to summarize.', tasks: [] };
    }

    const text = tasks
      .map((t, i) => `#${i + 1} ${t.title}${t.description ? `: ${t.description}` : ''}`)
      .join('\n');

    const summary = await callOpenAiForSummary(text);

    logger.logEvent('TASKS_SUMMARY_GENERATED', { count: tasks.length }, req);

    return {
      summary,
      count: tasks.length
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getSummaryOfNewestTasks
};


