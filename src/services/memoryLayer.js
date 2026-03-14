const MEMORY_API_URL = import.meta.env.VITE_MEMORY_AGENT_URL || 'http://localhost:8888';
const MEMORY_API_KEY = import.meta.env.VITE_MEMORY_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

export const memoryLayer = {
  async ingest(text, source) {
    try {
      const res = await fetch(`${MEMORY_API_URL}/ingest`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(MEMORY_API_KEY ? { 'Authorization': `Bearer ${MEMORY_API_KEY}` } : {})
        },
        body: JSON.stringify({ text, source })
      });
      return await res.json();
    } catch (e) {
      console.error('Memory Layer Ingest Error:', e);
      return null;
    }
  },

  async query(question) {
    try {
      const res = await fetch(`${MEMORY_API_URL}/query?q=${encodeURIComponent(question)}`, {
        headers: {
          ...(MEMORY_API_KEY ? { 'Authorization': `Bearer ${MEMORY_API_KEY}` } : {})
        }
      });
      return await res.json();
    } catch (e) {
      console.error('Memory Layer Query Error:', e);
      return null;
    }
  }
};
