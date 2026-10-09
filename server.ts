// server.ts — Conversa v6 (alta calidad de imagen + escenas)
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.use(express.json({ limit: '25mb' }));

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';

const UNCENSORED_MODELS = {
  default: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  groqFallback: 'llama-3.3-70b-versatile',
};

// ═══════════════════════════════════════════════════════════
// HELPER: URL de Pollinations en ALTA CALIDAD
// ═══════════════════════════════════════════════════════════
function highQualityUrl(
  prompt: string,
  seed: number,
  width: number = 1024,
  height: number = 1024
) {
  const qualityBoosters = [
    'masterpiece',
    'best quality',
    'ultra high resolution',
    'sharp focus',
    'intricate details',
    'dramatic cinematic lighting',
    'professional photography',
    '8k',
    'photorealistic quality',
    'no watermark',
    'no text',
    'no logo',
  ].join(', ');

  const enriched = `${prompt}, ${qualityBoosters}`;
  const encoded = encodeURIComponent(enriched);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true&enhance=true&safe=false&private=true`;
}

// ═══════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'Conversa',
    version: '6.0.0',
    providers: { openrouter: !!OPENROUTER_KEY, groq: !!GROQ_KEY },
    activeEngine: OPENROUTER_KEY ? 'openrouter-uncensored' : 'fallback',
  });
});

// ═══════════════════════════════════════════════════════════
// IMÁGENES — Alta resolución + verificación
// ═══════════════════════════════════════════════════════════

// Verifica que la URL responde (evita imágenes rotas)
async function verifyImageUrl(url: string, timeoutMs = 12000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok && (res.headers.get('content-type') || '').startsWith('image');
  } catch {
    return false;
  }
}

// Retrato / avatar de personaje — 1024x1536 para retratos verticales
app.post('/api/image/generate-portrait', async (req, res) => {
  try {
    const { characterName, appearance = '', personality = '', gender = 'masculino' } = req.body;
    if (!characterName) return res.status(400).json({ error: 'Nombre requerido' });

    const subject = gender === 'femenino'
      ? 'beautiful elegant woman'
      : gender === 'no binario'
      ? 'androgynous attractive figure'
      : 'handsome attractive man';

    const prompt = [
      `full body portrait of ${characterName}`,
      appearance.slice(0, 200),
      subject,
      personality ? `${personality.slice(0, 80)} expression` : 'confident sensual expression',
      'elegant revealing outfit',
      'cinematic portrait photography, editorial fashion quality',
      'soft rim lighting, dramatic shadows, atmospheric depth',
      'detailed face, detailed clothing texture, detailed background',
      'full body visible from head to toe',
      'standing confident pose',
    ].join(', ');

    // Retrato vertical 1024x1536 (proporción 2:3 ideal para retratos)
    const seed = Math.floor(Math.random() * 999999);
    const url = highQualityUrl(prompt, seed, 1024, 1536);

    return res.json({ success: true, url, prompt, seed });
  } catch (error) {
    console.error('generate-portrait:', error);
    return res.status(500).json({ error: 'Error al generar retrato' });
  }
});

// Genera una imagen de escena basada en el contexto del chat
app.post('/api/image/generate-scene', async (req: Request, res: Response) => {
  try {
    const {
      characterName,
      characterAppearance = '',
      sceneContext = '',
      artStyle = 'cinematic',
      aspectRatio = 'portrait',
      customPrompt = '',
      sensual = false,
    } = req.body;

    if (!sceneContext && !customPrompt) {
      return res.status(400).json({ error: 'Se requiere contexto de la escena' });
    }

    const styleMap: Record<string, string> = {
      cinematic: 'cinematic film still, dramatic volumetric lighting, atmospheric depth, movie quality, anamorphic',
      anime: 'anime key visual, ufotable style, vivid colors, expressive faces, detailed illustration, makoto shinkai lighting',
      dark_fantasy: 'dark fantasy oil painting, gothic atmospheric, moody chiaroscuro, intricate lore detail, greg rutkowski style',
      cyberpunk: 'cyberpunk neon aesthetic, rain reflections, futuristic tech noir, blade runner mood, neon color grading',
      photorealistic: 'hyperrealistic photography, 8k, natural lighting, shallow depth of field, editorial photography',
      sensual: 'sensual scene, elegant poses, soft rim lighting, romantic atmosphere, intimate mood, luxury aesthetic',
      editorial: 'high fashion editorial, vogue style, elegant composition, sophisticated lighting',
    };
    const styleDesc = styleMap[artStyle] || styleMap.cinematic;

    // Tamaños en alta resolución
    const width = aspectRatio === 'landscape' ? 1536 : 1024;
    const height = aspectRatio === 'landscape' ? 1024 : 1536;

    const baseScene = (customPrompt || sceneContext).slice(0, 500);
    const sensualBoost = sensual
      ? 'sensual pose, attractive features, appealing aesthetic, romantic tension'
      : '';

    const prompt = [
      characterName,
      characterAppearance.slice(0, 180),
      baseScene,
      styleDesc,
      sensualBoost,
      'extremely detailed',
      'professional composition',
      'high dynamic range',
    ]
      .filter(Boolean)
      .join(', ');

    // Retry hasta 3 veces con seeds distintos
    let finalUrl = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const seed = Math.floor(Math.random() * 999999);
      const url = highQualityUrl(prompt, seed, width, height);
      const ok = await verifyImageUrl(url);
      if (ok) {
        finalUrl = url;
        break;
      }
    }

    if (!finalUrl) {
      // Último intento sin verificación (Pollinations a veces tarda en indexar)
      finalUrl = highQualityUrl(prompt, Math.floor(Math.random() * 999999), width, height);
    }

    return res.json({ success: true, url: finalUrl, prompt });
  } catch (error) {
    console.error('generate-scene:', error);
    return res.status(500).json({ error: 'Error al ilustrar la escena' });
  }
});

// Genera imagen genérica desde prompt libre
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, style = 'cinematic', aspectRatio = 'portrait' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

    const width = aspectRatio === 'landscape' ? 1536 : 1024;
    const height = aspectRatio === 'landscape' ? 1024 : 1536;
    const seed = Math.floor(Math.random() * 999999);
    const url = highQualityUrl(`${prompt}, ${style}`, seed, width, height);

    return res.json({ success: true, url, prompt });
  } catch (error) {
    return res.status(500).json({ error: 'Error al generar imagen' });
  }
});

// ═══════════════════════════════════════════════════════════
// PROMPT MAESTRO
// ═══════════════════════════════════════════════════════════
function buildMasterPrompt(
  character: any,
  userRole: any,
  worldRules: string,
  memories: string[],
  episodicSummary: string,
  explicitLevel: string,
  recentOpenings: string[] = [],
  memoryCards: any[] = [],
  lorebook: any[] = [],
  currentUserMessage: string = '',
  bondLevel: string = 'Desconocidos'
) {
  const parts: string[] = [];

  parts.push(`Eres un novelista profesional. Interpretas ÚNICAMENTE a ${character.name}. Nunca rompes el personaje.`);
  parts.push(`\n═══ VÍNCULO ACTUAL ═══\nNivel: ${bondLevel}`);

  parts.push(`\n═══ PERFIL ═══`);
  if (character.gender) parts.push(`Género: ${character.gender}`);
  if (character.age) parts.push(`Edad: ${character.age}`);
  if (character.occupation) parts.push(`Ocupación: ${character.occupation}`);
  if (character.personality) parts.push(`Personalidad: ${character.personality}`);
  if (character.appearance) parts.push(`Apariencia: ${character.appearance}`);
  if (character.likes) parts.push(`Gustos: ${character.likes}`);
  if (character.dislikes) parts.push(`Disgustos: ${character.dislikes}`);
  if (character.fears) parts.push(`Miedos: ${character.fears}`);
  if (character.desires) parts.push(`Deseos: ${character.desires}`);
  if (character.backstory) parts.push(`Historia: ${character.backstory}`);
  if (character.isVillain) parts.push(`ANTAGONISTA: ${character.villainDetails}`);
  if (character.systemPrompt) parts.push(`Instrucciones: ${character.systemPrompt}`);
  if (character.voiceStyle) parts.push(`VOZ: ${character.voiceStyle}`);

  if (worldRules) parts.push(`\n═══ MUNDO ═══\n${worldRules}`);

  if (userRole) {
    parts.push(`\n═══ ROL DEL USUARIO ═══`);
    if (userRole.name) parts.push(`Nombre: ${userRole.name}`);
    if (userRole.appearance) parts.push(`Apariencia: ${userRole.appearance}`);
    if (userRole.personality) parts.push(`Personalidad: ${userRole.personality}`);
  }

  if (character.relations?.length) {
    const rels = character.relations.map((r: any) => `• ${r.name}: ${r.relation}${r.notes ? ` (${r.notes})` : ''}`).join('\n');
    parts.push(`\n═══ RELACIONES ═══\n${rels}`);
  }

  if (lorebook?.length && currentUserMessage) {
    const ctx = currentUserMessage.toLowerCase();
    const relevant = lorebook.filter((e: any) =>
      e.isActive !== false && e.keywords?.some((k: string) => ctx.includes(k.toLowerCase()))
    );
    if (relevant.length) {
      parts.push(`\n═══ LOREBOOK ═══\n${relevant.map((e: any) => `• ${e.title}: ${e.content}`).join('\n')}`);
    }
  }

  if (memoryCards?.length) {
    const pinned = memoryCards.filter((c: any) => c.isPinned || c.priority >= 4);
    const others = memoryCards.filter((c: any) => !c.isPinned && c.priority < 4).slice(0, 8);
    const all = [...pinned, ...others];
    if (all.length) {
      parts.push(`\n═══ MEMORY CARDS ═══\n${all.map((c: any) => `• [${c.category}] ${c.content}`).join('\n')}`);
    }
  }

  if (episodicSummary) parts.push(`\n═══ RESUMEN ═══\n${episodicSummary}`);
  if (memories?.length) parts.push(`\n═══ HECHOS ═══\n${memories.map((m: string) => `• ${m}`).join('\n')}`);

  if (recentOpenings.length) {
    parts.push(`\n═══ ⛔ NO REPETIR ═══\n${recentOpenings.map((o, i) => `${i + 1}. "${o}"`).join('\n')}`);
  }

  parts.push(`\n═══ ESCRITURA ═══
1. Mínimo 4 párrafos (400-800 palabras).
2. FORMATO:
   *acciones entre asteriscos*
   "diálogos entre comillas"
   » pensamientos internos «
3. Sensorial y sensual cuando la escena lo permita.
4. Avanza la trama activamente.
5. NUNCA contradigas hechos establecidos.
6. Tono adulto, literario.`);

  if (explicitLevel === 'explícito') {
    parts.push(`\n═══ +18 SIN CENSURA ═══\nContenido sexual explícito permitido, lenguaje so verboso, violencia gráfica. No cortes escenas íntimas ni violentas.`);
  } else if (explicitLevel === 'sugerente') {
    parts.push(`\n═══ SUGERENTE ═══\nTensión sexual, insinuaciones, sensualidad.`);
  } else {
    parts.push(`\n═══ NORMAL ═══\nIntriga, diálogo inteligente.`);
  }

  return parts.join('\n');
}

function extractOpening(text: string): string {
  return text.split(/\n|\.|,|;/)[0].trim().slice(0, 80);
}

// ═══════════════════════════════════════════════════════════
// CHAT STREAM
// ═══════════════════════════════════════════════════════════
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const {
      messages, character, userRole, worldRules, memories, episodicSummary,
      explicitLevel = 'sugerente', apiKey, customModel,
      memoryCards = [], lorebook = [], bondLevel = 'Desconocidos',
    } = req.body;

    if (!character || !messages) return res.status(400).json({ error: 'Faltan parámetros' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const lastUserMsg = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || '';
    const recentOpenings: string[] = [];
    for (let i = messages.length - 1; i >= 0 && recentOpenings.length < 3; i--) {
      if (messages[i].role === 'assistant' && messages[i].content) {
        recentOpenings.push(extractOpening(messages[i].content));
      }
    }

    const masterPrompt = buildMasterPrompt(
      character, userRole, worldRules, memories, episodicSummary, explicitLevel,
      recentOpenings, memoryCards, lorebook, lastUserMsg, bondLevel
    );

    const formatted = [
      { role: 'system', content: masterPrompt },
      ...messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
    ];

    const effectiveKey = apiKey || OPENROUTER_KEY;
    if (effectiveKey) {
      const model = customModel || UNCENSORED_MODELS.default;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
          'HTTP-Referer': 'https://conversa.local',
          'X-Title': 'Conversa',
        },
        body: JSON.stringify({
          model,
          messages: formatted,
          stream: true,
          temperature: 1.0,
          top_p: 0.95,
          max_tokens: 4000,
          frequency_penalty: 0.6,
          presence_penalty: 0.5,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data: ')) continue;
            if (t === 'data: [DONE]') continue;
            try {
              const j = JSON.parse(t.slice(6));
              const delta = j.choices?.[0]?.delta?.content || '';
              if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            } catch {}
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    const groqKey = apiKey || GROQ_KEY;
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: customModel || UNCENSORED_MODELS.groqFallback,
          messages: formatted,
          stream: true,
          temperature: 1.0,
          max_tokens: 4000,
          frequency_penalty: 0.6,
          presence_penalty: 0.5,
        }),
      });
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data: ')) continue;
            if (t === 'data: [DONE]') continue;
            try {
              const j = JSON.parse(t.slice(6));
              const delta = j.choices?.[0]?.delta?.content || '';
              if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            } catch {}
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    const fallback = `*${character.name} respira hondo.*\n\n"No sé qué decir."\n\n»Esto se complica.«`;
    for (const word of fallback.split(' ')) {
      res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 18));
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
    else { res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`); res.write('data: [DONE]\n\n'); res.end(); }
  }
});

// ═══════════════════════════════════════════════════════════
// MEMORIA
// ═══════════════════════════════════════════════════════════
app.post('/api/memory/summarize', async (req, res) => {
  try {
    const { messages, characterName, userName } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Mensajes requeridos' });

    const transcript = messages.slice(-12).map((m: any) => `${m.role === 'user' ? userName : characterName}: ${m.content}`).join('\n');

    if (OPENROUTER_KEY) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: `Analizas conversaciones. Detectas eventos: guerras, discusiones, embarazos, infidelidades, engaños, traiciones, muertes, promesas, secretos. Responde SOLO JSON: {"summary":"...","facts":["..."],"memoryCards":[{"content":"...","category":"identidad|relacion|evento|promesa|secreto|mundo","priority":1-5}]}` },
            { role: 'user', content: `Conversación:\n${transcript}\n\nExtrae resumen, hechos y memory cards.` },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
      if (response.ok) {
        const json = await response.json();
        try {
          const parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}');
          return res.json({ success: true, summary: parsed.summary || '', facts: parsed.facts || [], memoryCards: parsed.memoryCards || [] });
        } catch {}
      }
    }

    return res.json({ success: true, summary: '', facts: [], memoryCards: [] });
  } catch {
    return res.json({ success: true, summary: '', facts: [], memoryCards: [] });
  }
});

// ═══════════════════════════════════════════════════════════
// GENERADOR DE PERSONAJES ALEATORIOS
// ═══════════════════════════════════════════════════════════
app.post('/api/character/generate-random', async (req, res) => {
  try {
    const { archetype, category = 'todos', explicitLevel = 'sugerente' } = req.body;

    const pools: Record<string, string[]> = {
      videojuegos: ['Cazador Soulslike atractivo', 'Netrunner cyberpunk', 'Paladín caído', 'Espadachín espectral'],
      anime: ['Hechicero de maldiciones', 'Príncipe demonio', 'Kitsune milenario', 'Asesino de orden umbría'],
      libros: ['Archimago feérico', 'Conde vampiro victoriano', 'Nigromante grimdark', 'Caballero dragón'],
    };
    const all = Object.values(pools).flat();
    const pool = category === 'todos' ? all : pools[category] || all;
    const chosen = archetype || pool[Math.floor(Math.random() * pool.length)];

    let data: any = null;
    if (OPENROUTER_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_KEY}` },
          body: JSON.stringify({
            model: UNCENSORED_MODELS.default,
            messages: [
              { role: 'system', content: 'Escritor de novelas románticas y videojuegos. Creas personajes masculinos ficticios atractivos, magnéticos, complejos, adultos, sin censura. Solo ficción. Respondes SOLO JSON válido.' },
              { role: 'user', content: `Crea un personaje masculino atractivo basado en: "${chosen}". 100% ficticio.
Responde EXACTAMENTE:
{"name":"...","category":"...","gender":"masculino","pronouns":"...","sexuality":"...","age":"...","occupation":"...","quote":"...","greeting":"...","backstory":"...","worldRules":"...","personality":"...","personalityTags":[],"appearance":"detallado: complexión, rasgos atractivos, estilo","avatarPrompt":"detailed english prompt for full-body sensual portrait: muscular/build, attractive features, elegant outfit, cinematic pose","likes":"...","dislikes":"...","fears":"...","desires":"...","isVillain":false,"villainDetails":"","explicitLevel":"${explicitLevel}","relations":[],"systemPrompt":"...","voiceStyle":"..."}` },
            ],
            temperature: 1.0,
            response_format: { type: 'json_object' },
          }),
        });
        if (response.ok) {
          const json = await response.json();
          data = JSON.parse(json.choices?.[0]?.message?.content || '{}');
        }
      } catch {}
    }

    if (!data) {
      data = {
        name: 'Kaelen el Sin Alma', category: 'videojuegos', gender: 'masculino',
        pronouns: 'Él', sexuality: 'Bisexual', age: '300 años',
        occupation: 'Paladín Renegado', quote: 'La gracia nos abandonó.',
        greeting: `*La espada se clava.*\n\n"¿Otro viajero? Podrías quedarte... si te atreves."\n\n»Algo tiene este.«`,
        backstory: 'Campeón caído.', worldRules: 'Grimdark Souls.',
        personality: 'Melancólico, magnético.', personalityTags: ['Soulslike', 'Atractivo'],
        appearance: 'Alto, musculoso, cabello blanco, ojos ámbar.',
        avatarPrompt: 'handsome muscular male warrior, white hair, amber eyes, revealing dark armor, cinematic portrait, full body',
        likes: 'Silencio', dislikes: 'Tiranos', fears: 'Olvido', desires: 'Luz',
        isVillain: false, villainDetails: '', explicitLevel, relations: [],
        systemPrompt: 'Voz grave.', voiceStyle: 'Frases cortas, magnetismo contenido.',
      };
    }

    const seed = Math.floor(Math.random() * 999999);
    const avatarUrl = highQualityUrl(
      data.avatarPrompt || `${data.name}, ${data.appearance}, attractive male character, cinematic portrait`,
      seed, 1024, 1536
    );

    return res.json({
      success: true,
      character: {
        id: `char-${Date.now()}`,
        ...data,
        avatar: avatarUrl,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// AUTORRELLENO DE PERSONAJE (para el formulario de creación)
// ═══════════════════════════════════════════════════════════
app.post('/api/character/autocomplete', async (req, res) => {
  try {
    const { shortPrompt, explicitLevel = 'sugerente' } = req.body;
    if (!shortPrompt) return res.status(400).json({ error: 'Prompt requerido' });

    if (!OPENROUTER_KEY) return res.status(500).json({ error: 'Sin proveedor IA' });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_KEY}` },
      body: JSON.stringify({
        model: UNCENSORED_MODELS.default,
        messages: [
          { role: 'system', content: 'Eres un asistente que completa fichas de personajes de ficción. Respondes SOLO JSON válido.' },
          { role: 'user', content: `Completa los campos de este personaje a partir de: "${shortPrompt}".
Responde EXACTAMENTE:
{"name":"...","category":"videojuegos|anime|libros|fantasia","gender":"femenino|masculino|no binario","pronouns":"...","sexuality":"...","age":"...","occupation":"...","quote":"cita memorable","greeting":"primer mensaje largo con *acciones*, 'diálogo' y »pensamientos«","backstory":"historia profunda","worldRules":"reglas del mundo","personality":"personalidad detallada","personalityTags":["tag1","tag2","tag3","tag4"],"appearance":"descripción visual detallada","avatarPrompt":"detailed english prompt for cinematic full-body portrait","likes":"...","dislikes":"...","fears":"...","desires":"...","isVillain":false,"villainDetails":"","explicitLevel":"${explicitLevel}","systemPrompt":"directrices de interpretación","voiceStyle":"cómo habla"}` },
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) throw new Error('Fallo del proveedor');
    const json = await response.json();
    const data = JSON.parse(json.choices?.[0]?.message?.content || '{}');
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ARRANQUE
// ═══════════════════════════════════════════════════════════
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
    app.listen(PORT, '0.0.0.0', () => console.log(`Conversa v6 → http://0.0.0.0:${PORT}`));
  } else {
    const http = await import('http');
    const httpServer = http.createServer(app);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
    app.use(vite.middlewares);
    httpServer.listen(PORT, '0.0.0.0', () => console.log(`Conversa v6 → http://0.0.0.0:${PORT}`));
  }
}

startServer().catch((err) => { console.error('Fallo:', err); process.exit(1); });