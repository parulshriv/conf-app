// Vercel Serverless Function for Claude Highlights Extraction
// Deploy to: api/highlights.js in your GitHub repo

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, apiKey } = req.body;

  // Validate inputs
  if (!transcript || !apiKey) {
    return res.status(400).json({ error: 'Missing transcript or API key' });
  }

  try {
    const systemPrompt = `You are an expert conference note-taker and business analyst. Your task is to extract the most valuable insights from a conference session transcript that would be useful for a team presentation or decision-making.

Extract 5-7 key insights that are:
- Specific and actionable (not generic statements)
- Important for business/technical understanding
- Representative of the speaker's main points
- Useful for sharing with colleagues or leadership

Focus on:
1. New concepts, frameworks, or best practices mentioned
2. Surprising findings or counterintuitive insights
3. Specific recommendations or warnings
4. Technical innovations or breakthroughs
5. Business implications or opportunities
6. Data or statistics that support claims

Format each highlight as a clear, professional bullet point (starting with •). Include context where helpful, but keep each point concise and impactful.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Please extract the key insights from this conference transcript:\n\n${transcript}`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error?.message || 'Claude API error'
      });
    }

    const data = await response.json();
    const highlights = data.content[0].text;

    return res.status(200).json({ highlights });
  } catch (error) {
    console.error('Highlights API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
