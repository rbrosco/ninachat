// Usage: node scripts/create_test_conversation.js [apiBase]
// Default apiBase: http://localhost:40001

const apiBase = process.argv[2] || process.env.API_BASE || 'http://localhost:40001';

async function post(path, body) {
  const res = await fetch(`${apiBase}/${path}` , {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => null);
  try { return JSON.parse(text); } catch (e) { return text; }
}

(async () => {
  try {
    const now = new Date().toISOString();
    const conv = {
      id: 'test-conv-' + Date.now().toString(36),
      user: 'testuser',
      metadata: { phone: '5511999887766', title: 'Contato Teste' },
      is_active: true,
      status: 'human',
      created_at: now,
      last_message_at: now,
    };

    console.log('Creating conversation...');
    const c = await post('conversations', conv);
    console.log('Conversation created:', c?.id || c);

    const msgs = [
      { id: 'm1-' + Date.now().toString(36), conversation_id: conv.id, from: conv.user, body: 'Olá! Esta é uma mensagem de teste.', created_at: new Date(Date.now() - 60000).toISOString(), direction: 'inbound' },
      { id: 'm2-' + Date.now().toString(36), conversation_id: conv.id, from: 'agent:system', body: 'Resposta automática de teste.', created_at: new Date().toISOString(), direction: 'outbound' },
    ];

    for (const m of msgs) {
      console.log('Posting message', m.id);
      const r = await post('messages', m);
      console.log('Posted:', r?.id || r);
    }

    console.log('Done. Open the UI and refresh Monitor / Conversations.');
  } catch (err) {
    console.error('Error creating test conversation', err);
  }
})();
