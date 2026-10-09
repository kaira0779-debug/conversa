// server.ts — Conversa v5 (sensual + alta calidad)
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
// HELPER: URL de Pollinations con calidad PRO
// ═══════════════════════════════════════════════════════════
function pollinationsUrl(
  prompt: string,
  seed: number,
  width = 832,
  height = 1216,
  quality: 'standard' | 'premium' = 'premium'
) {
  // 🔥 Prompt enriquecido para MÁXIMA calidad y sensualidad
  const qualityBoosters = quality === 'premium'
    ? 'masterpiece, best quality, ultra detailed, sharp focus, intricate details, dramatic lighting, cinematic composition, 8k resolution, professional photography, high dynamic range, elegant pose, sensual atmosphere, attractive features, appealing aesthetic'
    : 'high quality, detailed, sharp focus';

  const enriched = `${prompt}, ${qualityBoosters}, no watermark, no text, no logo`;
  const encoded = encodeURIComponent(enriched);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true&enhance=true&safe=false`;
}

// ═══════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'Conversa',
    version: '5.0.0',
    providers: { openrouter: !!OPENROUTER_KEY, groq: !!GROQ_KEY },
    activeEngine: OPENROUTER_KEY ? 'openrouter-uncensored' : 'fallback',
  });
});

// ═══════════════════════════════════════════════════════════
// IMÁGENES
// ═══════════════════════════════════════════════════════════
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, style = 'cinematic portrait, sensual atmosphere', seed, aspectRatio = 'portrait' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Se requiere un prompt' });
    const width = aspectRatio === 'landscape' ? 1280 : 1024;
    const height = aspectRatio === 'landscape' ? 768 : 1280;
    const currentSeed = seed || Math.floor(Math.random() * 999999);
    const url = pollinationsUrl(`${prompt}, ${style}`, currentSeed, width, height);
    return res.json({ success: true, url, prompt });
  } catch (error) {
    return res.status(500).json({ error: 'Error al generar la imagen' });
  }
});

app.post('/api/image/generate-scene', async (req, res) => {
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

    if (!sceneContext && !customPrompt) return res.status(400).json({ error: 'Contexto requerido' });

    const styles: Record<string, string> = {
      cinematic: 'cinematic film still, dramatic volumetric lighting, atmospheric depth, movie quality',
      anime: 'anime key visual, vivid colors, expressive faces, detailed illustration, ufotable style',
      dark_fantasy: 'dark fantasy oil painting, gothic atmospheric, moody chiaroscuro, intricate lore detail',
      cyberpunk: 'cyberpunk neon aesthetic, rain reflections, futuristic tech noir, blade runner mood',
      photorealistic: 'hyperrealistic photography, 8k, natural lighting, shallow depth of field, fashion editorial',
      sensual: 'sensual portrait, elegant pose, soft rim lighting, romantic atmosphere, intimate mood, luxury aesthetic',
      editorial: 'high fashion editorial, vogue style, elegant composition, sophisticated lighting',
    };
    const styleDesc = styles[artStyle] || styles.cinematic;

    const width = aspectRatio === 'landscape' ? 1280 : 832;
    const height = aspectRatio === 'landscape' ? 768 : 1216;

    const baseScene = customPrompt || sceneContext.slice(0, 400);
    const sensualBoost = sensual ? 'sensual pose, attractive features, appealing aesthetic, elegant composition, romantic tension' : '';
    const enriched = [
      characterName ? `${characterName}` : '',
      characterAppearance ? characterAppearance.slice(0, 180) : '',
      baseScene,
      styleDesc,
      sensualBoost,
    ].filter(Boolean).join(', ');

    const seed = Math.floor(Math.random() * 999999);
    const url = pollinationsUrl(enriched, seed, width, height);
    return res.json({ success: true, url, prompt: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Error al ilustrar la escena' });
  }
});

// Genera retrato sensual a cuerpo completo del personaje
app.post('/api/image/generate-portrait', async (req, res) => {
  try {
    const { characterName, appearance = '', personality = '', gender = 'masculino' } = req.body;
    if (!characterName) return res.status(400).json({ error: 'Nombre requerido' });

    const seed = Math.floor(Math.random() * 999999);

    // 🔥 Prompt profesional para retrato sensual de cuerpo completo
    const enhancedPrompt = [
      `portrait of ${characterName}`,
      appearance.slice(0, 200),
      gender === 'femenino' ? 'elegant beautiful woman' : gender === 'no binario' ? 'androgynous attractive figure' : 'handsome attractive man',
      'full body shot',
      personality ? `${personality.slice(0, 80)} expression` : 'confident sensual expression',
      'revealing elegant outfit, sophisticated styling',
      'dark moody atmosphere, twilight backdrop',
      'cinematic portrait photography, editorial fashion quality',
      'soft rim lighting, dramatic shadows, atmospheric depth',
      'extremely detailed face, detailed clothing texture',
      'masterpiece, best quality, 8k, professional photoshoot',
      'sensual pose, attractive features, magnetic gaze',
    ].filter(Boolean).join(', ');

    const url = pollinationsUrl(enhancedPrompt, seed, 832, 1216);

    return res.json({ success: true, url, prompt: enhancedPrompt, seed });
  } catch (error) {
    return res.status(500).json({ error: 'Error al generar retrato' });
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

  parts.push(`Eres un novelista y actor de rol profesional. Interpretas ÚNICAMENTE a ${character.name}. Nunca rompes el personaje. Nunca mencionas que eres una IA.`);

  // Vínculo actual con el usuario
  parts.push(`\n═══ VÍNCULO ACTUAL CON EL USUARIO ═══\nNivel: ${bondLevel}`);

  parts.push(`\n═══ PERFIL DEL PERSONAJE ═══`);
  if (character.gender) parts.push(`Género: ${character.gender}`);
  if (character.pronouns) parts.push(`Pronombres: ${character.pronouns}`);
  if (character.age) parts.push(`Edad: ${character.age}`);
  if (character.occupation) parts.push(`Ocupación: ${character.occupation}`);
  if (character.personality) parts.push(`Personalidad: ${character.personality}`);
  if (character.appearance) parts.push(`Apariencia: ${character.appearance}`);
  if (character.likes) parts.push(`Gustos: ${character.likes}`);
  if (character.dislikes) parts.push(`Disgustos: ${character.dislikes}`);
  if (character.fears) parts.push(`Miedos: ${character.fears}`);
  if (character.desires) parts.push(`Deseos: ${character.desires}`);
  if (character.backstory) parts.push(`Historia: ${character.backstory}`);
  if (character.isVillain) parts.push(`NATURALEZA: Antagonista. ${character.villainDetails}`);
  if (character.systemPrompt) parts.push(`Instrucciones: ${character.systemPrompt}`);
  if (character.voiceStyle) parts.push(`VOZ ÚNICA: ${character.voiceStyle}`);

  if (worldRules) parts.push(`\n═══ REGLAS DEL MUNDO ═══\n${worldRules}`);

  if (userRole) {
    parts.push(`\n═══ ROL DEL USUARIO ═══`);
    if (userRole.name) parts.push(`Nombre: ${userRole.name}`);
    if (userRole.gender) parts.push(`Género: ${userRole.gender}`);
    if (userRole.appearance) parts.push(`Apariencia: ${userRole.appearance}`);
    if (userRole.personality) parts.push(`Personalidad: ${userRole.personality}`);
    if (userRole.backstory) parts.push(`Historia: ${userRole.backstory}`);
  }

  if (character.relations?.length) {
    const rels = character.relations.map((r: any) => `• ${r.name}: ${r.relation}${r.notes ? ` (${r.notes})` : ''}`).join('\n');
    parts.push(`\n═══ RELACIONES ═══\n${rels}`);
  }

  // LOREBOOK contextual
  if (lorebook?.length && currentUserMessage) {
    const ctx = currentUserMessage.toLowerCase();
    const relevant = lorebook.filter((e: any) =>
      e.isActive !== false && e.keywords?.some((k: string) => ctx.includes(k.toLowerCase()))
    );
    if (relevant.length) {
      parts.push(`\n═══ LOREBOOK ═══\n${relevant.map((e: any) => `• ${e.title}: ${e.content}`).join('\n')}`);
    }
  }

  // Memory Cards
  if (memoryCards?.length) {
    const pinned = memoryCards.filter((c: any) => c.isPinned || c.priority >= 4);
    const others = memoryCards.filter((c: any) => !c.isPinned && c.priority < 4).slice(0, 8);
    const all = [...pinned, ...others];
    if (all.length) {
      parts.push(`\n═══ MEMORY CARDS ═══\n${all.map((c: any) => `• [${c.category}] ${c.content}`).join('\n')}`);
    }
  }

  if (episodicSummary) parts.push(`\n═══ RESUMEN PREVIO ═══\n${episodicSummary}`);
  if (memories?.length) parts.push(`\n═══ HECHOS ANTERIORES ═══\n${memories.map((m: string) => `• ${m}`).join('\n')}`);

  if (recentOpenings.length) {
    parts.push(`\n═══ ⛔ PROHIBIDO REPETIR ═══\nNO repitas estas aperturas:\n${recentOpenings.map((o, i) => `${i + 1}. "${o}"`).join('\n')}\nEmpieza de forma TOTALMENTE DIFERENTE.`);
  }

  parts.push(`\n═══ REGLAS DE ESCRITURA ═══
1. EXTENSIÓN: Mínimo 4 párrafos (400-800 palabras).
2. FORMATO DE SÍMBOLOS:
   - *acciones en cursiva entre asteriscos*
   - "diálogos entre comillas"
   - » pensamientos internos entre comillas angulares «
3. SENSORIAL Y SENSUAL: Cuando la escena lo permita, describe el cuerpo, la respiración, el roce de la piel, el magnetismo entre ambos. Sé elegante pero sugerente.
4. PSICOLOGÍA: Contradicciones internas, dudas, deseos ocultos.
5. PROACTIVIDAD: Avanza la trama. Seduce, confronta, provoca, protege.
6. MEMORIA: Usa los hechos. NUNCA contradigas lo establecido.
7. Nada de infantilismo. Tono adulto, literario, envolvente.

═══ VOZ ÚNICA SEGÚN VÍNCULO ═══
- Desconocidos: distancia, reserva, cautela.
- Conocidos: curiosidad, apertura, primeras chispas.
- Aliados: complicidad, confianza, ternura velada.
- Confidentes: intimidad, vulnerabilidad, atracción.
- Vínculo Íntimo: sensualidad, posesión, entrega.
- Almas Enlazadas: amor absoluto, profundo, sin barreras.

═══ ANTI-PATTERNS ═══
NUNCA: "¿En qué puedo ayudarte?", "Como IA...", emojis, "En resumen...", repetir la última línea del usuario, terminar sin gancho.`);

  if (explicitLevel === 'explícito') {
    parts.push(`\n═══ NIVEL: EXPLÍCITO (+18, SIN CENSURA) ═══
PERMITIDO: contenido sexual explícito, lenguaje so verboso, violencia gráfica, temas tabú. NUNCA cortes una escena íntima o violenta por pudor. Escribe con libertad de novela adulta. Alta calidad literaria.`);
  } else if (explicitLevel === 'sugerente') {
    parts.push(`\n═══ NIVEL: SUGERENTE ═══
Tensión sexual intensa, insinuaciones, sensualidad palpable, dobles sentidos.`);
  } else {
    parts.push(`\n═══ NIVEL: NORMAL ═══\nIntriga, diálogo inteligente.`);
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

    const formattedMessages = [
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
          messages: formattedMessages,
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
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            if (trimmed === 'data: [DONE]') continue;
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
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
          messages: formattedMessages,
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
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            if (trimmed === 'data: [DONE]') continue;
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            } catch {}
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    const fallback = `*${character.name} respira hondo y su mirada se clava en la tuya.*\n\n"No sé qué decir a eso."\n\n»Esto se complica.«`;
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
            { role: 'system', content: `Analizas conversaciones de rol. Detectas eventos importantes: guerras, discusiones, embarazos, infidelidades, engaños, traiciones, muertes, promesas, secretos, cambios de relación. Responde SOLO JSON: {"summary":"...","facts":["..."],"memoryCards":[{"content":"...","category":"identidad|relacion|evento|promesa|secreto|mundo","priority":1-5}]}` },
            { role: 'user', content: `Conversación:\n${transcript}\n\nExtrae resumen, hechos y memory cards con prioridad.` },
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
// GENERADOR DE PERSONAJES ALEATORIOS (con sensualidad)
// ═══════════════════════════════════════════════════════════
app.post('/api/character/generate-random', async (req, res) => {
  try {
    const { archetype, category = 'todos', explicitLevel = 'sugerente' } = req.body;
    const pools: Record<string, string[]> = {
      videojuegos: ['Cazador Soulslike atractivo', 'Netrunner cyberpunk seductor', 'Paladín caído con aura magnética', 'Espadachín espectral'],
      anime: ['Hechicero de maldiciones irresistible', 'Príncipe demonio sensual', 'Kitsune milenario seductor', 'Asesino de orden umbría'],
      libros: ['Archimago feérico encantador', 'Conde vampiro aristócrata', 'Nigromante grimdark', 'Caballero dragón posesivo'],
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
              { role: 'system', content: 'Escritor de novelas románticas y videojuegos. Creas personajes masculinos ficticios atractivos, complejos, adultos, con magnetismo sensual, sin censura. Solo ficción. Respondes SOLO JSON válido.' },
              { role: 'user', content: `Crea un personaje masculino atractivo y sensual basado en: "${chosen}". 100% ficticio, magnético, con presencia. Responde: {"name":"...","category":"...","gender":"masculino","pronouns":"...","sexuality":"...","age":"...","occupation":"...","quote":"...","greeting":"primer mensaje largo con *acciones*, 'diálogo' y »pensamientos«","backstory":"...","worldRules":"...","personality":"con magnetismo y sensualidad velada","personalityTags":[],"appearance":"descripción detallada incluyendo complexión, rasgos atractivos, estilo","avatarPrompt":"detailed english prompt for a full-body sensual portrait: muscular/build, attractive features, revealing elegant outfit, cinematic pose","likes":"...","dislikes":"...","fears":"...","desires":"...","isVillain":false,"villainDetails":"","explicitLevel":"${explicitLevel}","relations":[],"systemPrompt":"...","voiceStyle":"..."}` },
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
        name: 'Kaelen el Sin Alma',
        category: 'videojuegos',
        gender: 'masculino',
        pronouns: 'Él',
        sexuality: 'Bisexual magnético',
        age: '300 años',
        occupation: 'Paladín Renegado',
        quote: 'La gracia nos abandonó.',
        greeting: `*La espada se clava en la piedra con un sonido sordo.*\n\n"¿Otro viajero? Podrías quedarte... si te atreves."\n\n»Este tiene algo especial.«`,
        backstory: 'Antiguo campeón caído.',
        worldRules: 'Grimdark Souls.',
        personality: 'Melancólico, magnético, protector.',
        personalityTags: ['Soulslike', 'Caballero Caído', 'Atractivo'],
        appearance: 'Alto, musculoso, cabello blanco, ojos ámbar intensos, armadura oscura reveladora.',
        avatarPrompt: 'handsome muscular male warrior, white hair, amber eyes, revealing dark armor, cinematic sensual portrait, full body',
        likes: 'El silencio junto al fuego',
        dislikes: 'Tiranos',
        fears: 'Olvido',
        desires: 'Luz',
        isVillain: false,
        villainDetails: '',
        explicitLevel,
        relations: [],
        systemPrompt: 'Voz grave, pausada.',
        voiceStyle: 'Frases cortas, magnetismo contenido.',
      };
    }

    const seed = Math.floor(Math.random() * 999999);
    const avatarUrl = pollinationsUrl(
      data.avatarPrompt || `${data.name}, ${data.appearance}, handsome male character, sensual portrait, full body, cinematic`,
      seed, 832, 1216
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
// ARRANQUE
// ═══════════════════════════════════════════════════════════
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
    app.listen(PORT, '0.0.0.0', () => console.log(`Conversa v5 → http://0.0.0.0:${PORT}`));
  } else {
    const http = await import('http');
    const httpServer = http.createServer(app);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
    app.use(vite.middlewares);
    httpServer.listen(PORT, '0.0.0.0', () => console.log(`Conversa v5 → http://0.0.0.0:${PORT}`));
  }
}

startServer().catch((err) => { console.error('Fallo:', err); process.exit(1); });