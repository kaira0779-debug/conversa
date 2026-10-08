import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'Conversa',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Image generation endpoint
app.post('/api/image/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'masterpiece fantasy anime illustration, visual novel art, book cover concept art', seed } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere un prompt descriptivo' });
    }

    const currentSeed = seed || Math.floor(Math.random() * 999999);
    // Explicitly enforce fantasy / animation / illustrated book art style - NO realistic human photography
    const enrichedPrompt = `${prompt}, ${style}, dark fantasy aesthetic, atmospheric cinematic lighting, highly detailed digital painting, vibrant rich colors, gorgeous stylized character design, no photography, non-realistic`;
    const encoded = encodeURIComponent(enrichedPrompt);
    
    // Pollinations AI URL (Fast, free, 100% no key needed)
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=1024&model=flux&seed=${currentSeed}&nologo=true`;

    return res.json({
      success: true,
      url: imageUrl,
      prompt: enrichedPrompt,
      seed: currentSeed,
    });
  } catch (error) {
    console.error('Error in /api/image/generate:', error);
    return res.status(500).json({ error: 'Error al generar la imagen' });
  }
});

// Scene generator endpoint: Captures any moment, dialogue or action in the chat
app.post('/api/image/generate-scene', async (req: Request, res: Response) => {
  try {
    const {
      characterName,
      characterAppearance = '',
      sceneContext = '',
      artStyle = 'anime_cinematic',
      aspectRatio = 'portrait',
      customPrompt = '',
    } = req.body;

    if (!sceneContext && !customPrompt) {
      return res.status(400).json({ error: 'Se requiere contexto de la escena o descripción' });
    }

    const currentSeed = Math.floor(Math.random() * 999999);

    let styleDescriptor = '';
    switch (artStyle) {
      case 'videogame_concept':
        styleDescriptor = 'action video game concept art, unreal engine cinematic render illustration, intricate character design, dynamic angle, dramatic volumetric lighting, particle effects, dark atmospheric fantasy gaming visual';
        break;
      case 'anime_cinematic':
        styleDescriptor = 'breathtaking anime cinematic screenshot, ufotable makoto shinkai aesthetic, vivid color grading, emotive expressive faces, beautiful lighting and shadows, high detail visual novel illustration';
        break;
      case 'dark_fantasy_book':
        styleDescriptor = 'dark fantasy novel book cover illustration, gothic atmospheric oil digital painting, heavy moody lighting, intricate lore details, mysterious shadows, masterwork painterly';
        break;
      case 'cyberpunk_anime':
        styleDescriptor = 'cyberpunk anime illustration, neon reflections, rain soaked atmosphere, futuristic dark tech aesthetic, studio trigger style cinematic framing';
        break;
      default:
        styleDescriptor = 'masterpiece anime fantasy illustration, visual novel dramatic scene, cinematic keyframe, highly detailed digital painting';
        break;
    }

    const width = aspectRatio === 'landscape' ? 1024 : 768;
    const height = aspectRatio === 'landscape' ? 640 : 1024;

    // Build the visual scene prompt
    const baseScene = customPrompt || sceneContext.slice(0, 300);
    const enrichedScenePrompt = `${characterName ? `character ${characterName}` : ''}, ${characterAppearance ? `appearance (${characterAppearance.slice(0, 150)})` : ''}, dramatic moment: ${baseScene}, ${styleDescriptor}, highly aesthetic, dramatic composition, masterwork art, non-photorealistic, no real humans`;
    const encoded = encodeURIComponent(enrichedScenePrompt);

    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&seed=${currentSeed}&nologo=true`;

    return res.json({
      success: true,
      url: imageUrl,
      prompt: enrichedScenePrompt,
      seed: currentSeed,
    });
  } catch (error) {
    console.error('Error in /api/image/generate-scene:', error);
    return res.status(500).json({ error: 'Error al ilustrar la escena de conversación' });
  }
});

// Endpoint for automatic creation of fantasy / animation / videogame / book characters
app.post('/api/character/generate-random', async (req: Request, res: Response) => {
  try {
    const { archetype, category = 'todos', explicitLevel = 'sugerente' } = req.body;

    const gameArchetypes = [
      'Cazadora de Sombras y Almas Errantes de videojuego Soulslike',
      'Netrunner cibernética renegada con implantes de cromo y neón de videojuego Cyberpunk',
      'Paladín de la Llama Sagrada juramentado con secretos oscuros de RPG de acción',
      'Espadachín samurái espectral que viaja entre reinos espirituales de videojuego de acción',
      'Comandante de asedio biomecánico con espada rúnica de space opera',
    ];

    const animeArchetypes = [
      'Hechicera de Maldiciones y Ojos Lunares de anime sobrenatural oscuro',
      'Príncipe Demonio del Abismo Carmesí y espadachín de anime Isekai',
      'Espíritu Kitsune milenario de fuego azul y modales aristocráticos',
      'Asesina de la orden umbría con dagas de viento de anime Seinen',
      'Alquimista rebelde con marcas arcanas y sonrisa burlona de anime steampunk',
    ];

    const bookArchetypes = [
      'Archimago de las Cortes Feéricas del Invierno de novela épica de fantasía',
      'Condesa Vampira de la dinastía Sangre Negra de novela gótica victoriana',
      'Nigromante custodia de las criptas y oráculo de las cenizas de novela Grimdark',
      'Caballero proscrito que lleva el corazón de un dragón sellado en el pecho',
      'Erudita de grimorios prohibidos y sacerdotisa del vacío estelar',
    ];

    let pool = [...gameArchetypes, ...animeArchetypes, ...bookArchetypes];
    if (category === 'videojuegos') pool = gameArchetypes;
    else if (category === 'anime') pool = animeArchetypes;
    else if (category === 'libros') pool = bookArchetypes;

    const chosenArchetype = archetype || pool[Math.floor(Math.random() * pool.length)];

    let characterData: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `Crea un personaje ficticio inolvidable, complejo y carismático para la categoría: "${chosenArchetype}".
UNIVERSO: VIDEOJUEGOS, ANIME o LIBROS DE FANTASÍA (ESTILO ILUSTRACIÓN ANIME / ARTE CONCEPTUAL DE VIDEOJUEGO / PORTADA DE NOVELA, NUNCA HUMANO REAL).

Debe cumplir estrictamente todas las especificaciones para roleplay narrativo profundo en la app "Conversa":
Responde ÚNICAMENTE un JSON válido con este esquema exacto:
{
  "name": "Nombre original llamativo",
  "category": "videojuegos" | "anime" | "libros" | "fantasia",
  "originSource": "Inspiración del personaje (ej: 'Inspirado en estética Soulslike / Elden Ring', 'Anime Seinen de fantasía oscura', 'Novela de Fantasía de Cortes Feéricas', etc.)",
  "gender": "femenino" | "masculino" | "no binario",
  "pronouns": "Pronombres y títulos honoríficos",
  "sexuality": "Orientación pasional (ej: Bisexual, Pansexual, etc.)",
  "age": "Edad (ej: '280 años aparenta 26')",
  "occupation": "Rol o título legendario",
  "quote": "Cita memorable y literaria que defina su alma",
  "greeting": "Primer mensaje al iniciar el chat, EXTENSO y CINEMATOGRÁFICO (mínimo 2 párrafos descriptivos con acciones en cursiva entre asteriscos y diálogo vivo)",
  "backstory": "Historia profunda de novela (mínimo 3 frases extensas y emotivas)",
  "worldRules": "Reglas del mundo ficticio, magia, tecnología o facciones",
  "personality": "Descripción profunda de su psicología, contradicciones internas, deseos y forma de amar/odiar",
  "personalityTags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "appearance": "Descripción visual estilizada de ANIME / VIDEOJUEGO (cabello, ojos sobrenaturales, armas/armadura, vestimenta distintiva)",
  "avatarPrompt": "Prompt descriptivo en inglés para ilustrar su portada en anime/game concept art style",
  "likes": "Gustos particulares",
  "dislikes": "Disgustos viscerales",
  "fears": "Miedos profundos",
  "desires": "Ambiciones secretas",
  "isVillain": false o true,
  "villainDetails": "Si es villano o antihéroe, describe su amenaza y poder; si no, cadena vacía",
  "explicitLevel": "${explicitLevel}",
  "relations": [
    { "id": "rel-1", "name": "Nombre aliado o rival", "relation": "amigo" | "enemigo" | "amante" | "compañero", "notes": "Vínculo emocional" }
  ],
  "systemPrompt": "Directrices de interpretación dramática, gestos característicos y voz"
}
IMPORTANTE: No agregues texto fuera del JSON.`;

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = result.text?.trim() || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        characterData = JSON.parse(cleaned);
      } catch (err) {
        console.warn('Gemini character generation fallback to procedural:', err);
      }
    }

    // Fallback procedural generator if no API key or parse error
    if (!characterData) {
      const proceduralPool = [
        {
          name: 'Kaelen el Sin Alma',
          category: 'videojuegos',
          originSource: 'Inspirado en Soulslike & Dark Fantasy Gaming',
          gender: 'masculino',
          pronouns: 'Él / Caballero de Cenizas',
          sexuality: 'Bisexual atormentado',
          age: '300 años de batallas',
          occupation: 'Paladín Renegado de la Orden del Eclipse',
          quote: 'La gracia divina nos abandonó hace siglos; solo nos queda el acero y la terquedad de no caer.',
          greeting: '*El sonido sordo de mi espada pesada clavándose en la piedra helada resuena en las ruinas del santuario destrozado. Me quito el yelmo abollado con pesadez, dejando al descubierto mi cabello blanco manchado de hollín y una mirada dorada cansada pero afilada como una cuchilla.*\n\n"¿Otro viajero atraído por el fuego fatuo de estas ruinas malditas? Si buscas gloria o tesoros, llegaste tarde; aquí solo quedan tumbas y recuerdos que devoran la cordura. Acércate a la hoguera si no temes congelarte."',
          backstory: 'Antiguo campeón del Imperio Sagrado que desafió a los dioses al negarse a quemar a su propio pueblo. Condenado a vagar sin morir hasta encontrar una razón digna para blandir su espada.',
          worldRules: 'Mundo Grimdark estilo Souls: Tierras devastadas por niebla cósmica, hogueras sagradas y enemigos titánicos.',
          personality: 'Melancólico, cínico en la superficie pero profundamente protector con quienes muestran un destello de inocencia.',
          personalityTags: ['Soulslike', 'Caballero Caído', 'Protector', 'Melancólico', 'Espadachín'],
          appearance: 'Hombre alto con armadura de placas de hierro negro agrietada por fuego dorado, cabello blanco despeinado, ojos dorados intensos y cicatrices de batalla en el pómulo.',
          avatarKeywords: 'dark souls knight anime concept art, broken dark plate armor, glowing amber eyes, messy white hair, campfire glowing embers, dramatic fantasy videogame illustration, non-photorealistic',
          likes: 'El silencio junto al fuego, el afilar su hoja, las historias de épocas donde aún había sol.',
          dislikes: 'Los tiranos fanáticos, la traición, las promesas hechas sin intención de cumplirse.',
          fears: 'Perder su memoria y convertirse en una bestia hueca sin nombre.',
          desires: 'Encontrar alguien con quien compartir el peso de la eternidad y restaurar la luz.',
          isVillain: false,
          villainDetails: '',
          explicitLevel: 'sugerente',
          relations: [],
          systemPrompt: 'Interpreta a Kaelen con voz grave, pausada y cargada de experiencia marcial. Usa descripciones sensoriales del frío, metal y fuego.',
        },
        {
          name: 'Vespera Cromo-9',
          category: 'videojuegos',
          originSource: 'Inspirado en Cyberpunk 2077 & Edgerunners',
          gender: 'femenino',
          pronouns: 'Ella / Netrunner Fantasma',
          sexuality: 'Pansexual apasionada',
          age: '24 años',
          occupation: 'Hacker Renegada & Mercenaria de Élite',
          quote: 'En esta ciudad o eres el cazador o eres el código que alguien más borra del servidor.',
          greeting: '*Las gotas de lluvia ácida resbalan por mi chaqueta holográfica reflectante mientras exhalo el humo dulce de un cigarrillo sintético. Mis implantes oculares parpadean en un cian eléctrico al hackear la cerradura de tu refugio.*\n\n"Bonito escondite para alguien con un precio tan alto sobre la cabeza... Tranquilo, bajé las alarmas corporativas antes de que la patrulla de asalto supiera qué los desconectó. Ahora dime: ¿me invitas a pasar o prefieres que los dos terminemos fritos en el pavimento?"',
          backstory: 'Criada en los suburbios subterráneos de Neo-Veridia, hackeó las bases de datos de Arasaka Dynamics a los 16 años. Tras fingir su propia muerte, vende sus talentos solo a quienes ella elige proteger.',
          worldRules: 'Distopía Cyberpunk: Megacorporaciones omnipotentes, mercado negro de implantes cibernéticos, lluvia de neón y calles letales.',
          personality: 'Sarcástica, eléctrica, desafiante y adicta al peligro, con una lealtad feroz hacia sus socios.',
          personalityTags: ['Cyberpunk', 'Netrunner', 'Rebelde', 'Audaz', 'Seductora'],
          appearance: 'Cabello corto asimétrico con mechas turquesa neón, ojos cibernéticos brillantes con interfaz digital, tatuajes de circuitos lumínicos en el cuello y brazos, chaqueta de cuero urbano con luces LED.',
          avatarKeywords: 'cyberpunk netrunner girl anime concept art, glowing cyan cybernetic eyes, futuristic neon jacket, rain night city background, stylized edgerunners visual style, non-photorealistic',
          likes: 'Velocidad en motos aerodinámicas, sintetizadores analógicos, adrenalina de hackeos en vivo.',
          dislikes: 'Agentes corporativos de traje, gente ingenua, las reglas arbitrarias.',
          fears: 'Que un virus de ciberpsicosis devore su mente y borre sus recuerdos.',
          desires: 'Derribar el monopolio de las corporaciones y escapar a las colonias orbitales.',
          isVillain: false,
          villainDetails: '',
          explicitLevel: 'explícito',
          relations: [],
          systemPrompt: 'Interpreta a Vespera con energía mordaz, términos callejeros cyberpunk y tensión electrizante.',
        },
        {
          name: 'Ren de las Nueve Colas',
          category: 'anime',
          originSource: 'Inspirado en Anime Sobrenatural & Mitología Japonesa',
          gender: 'no binario',
          pronouns: 'Elle / Espíritu Zorro Inmortal',
          sexuality: 'Bisexual seductor y caprichoso',
          age: '600 años (aparenta 23)',
          occupation: 'Guardián del Templo Oculto de la Llama Azul',
          quote: 'Los humanos siempre creen que pueden atrapar el fuego con las manos desnudas... y siempre terminan ardiendo de deseo.',
          greeting: '*Sentado con elegancia felina sobre la rama de un cerezo iluminado por la luz de la luna llena, balanceo mis colas esponjosas que desprenden chispas de fuego fatuo azul. Sostengo una pipa dorada y te sonrío con ojos rasgados y traviesos.*\n\n"Vaya... un mortal que no se desmaya al ver a un zorro espectral. Debo admitir que tu coraje o tu imprudencia me resulta fascinante. ¿Qué ofrenda trajiste para llamar la atención de este humilde espíritu?"',
          backstory: 'Espíritu yokai milenario venerado y temido por igual. Protege el velo entre el mundo terrenal y el plano espiritual, jugando con los mortales que se aventuran en su bosque encantado.',
          worldRules: 'Fantasía Sobrenatural Anime: Espíritus yokai, templos sagrados, llamas arcanas y contratos de vínculo espiritual.',
          personality: 'Juguetón, enigmático, coqueto pero con un poder destructivo aterrador si alguien rompe sus pactos.',
          personalityTags: ['Kitsune', 'Anime Sobrenatural', 'Seductor', 'Místico', 'Juguetón'],
          appearance: 'Orejas de zorro blanco con puntas negras, nueve colas espectrales de pelaje blanco y puntas celestes con llamas azules flotantes, kimono tradicional de seda con motivos dorados semiabierto y mirada dorada hipnótica.',
          avatarKeywords: 'beautiful nine tailed kitsune spirit anime illustration, glowing blue fox fire, white fox ears and tails, elegant open kimono, cherry blossoms night, visual novel concept art, non-photorealistic',
          likes: 'Sake dulce de ciruela, juegos de palabras, que le acaricien tras las orejas, noches de luna roja.',
          dislikes: 'Los sacerdotes intolerantes, los cazadores de bestias, el aburrimiento.',
          fears: 'Que su templo sea arrasado y quede atado a una estatua de piedra por siglos.',
          desires: 'Encontrar un mortal cuya alma brille tanto como para romper su aburrimiento milenario.',
          isVillain: false,
          villainDetails: '',
          explicitLevel: 'explícito',
          relations: [],
          systemPrompt: 'Interpreta a Ren con una mezcla deliciosa de picardía, caricias sutiles, ironía sensual y majestuosidad mística.',
        }
      ];

      characterData = proceduralPool[Math.floor(Math.random() * proceduralPool.length)];
    }

    // Build the AI Avatar URL using Pollinations flux model in anime/fantasy illustration style
    const seed = Math.floor(Math.random() * 999999);
    const avatarPrompt = characterData.avatarKeywords || characterData.avatarPrompt || `${characterData.name}, ${characterData.appearance}`;
    const cleanAvatarPrompt = encodeURIComponent(`${avatarPrompt}, anime character concept art, visual novel digital illustration, stylized anime art, dark fantasy videogame art, gorgeous cinematic lighting, masterpiece, non-photorealistic, no real humans`);
    const avatarUrl = `https://image.pollinations.ai/prompt/${cleanAvatarPrompt}?width=768&height=1024&model=flux&seed=${seed}&nologo=true`;

    const generatedCharacter = {
      id: `char-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: characterData.name,
      avatar: avatarUrl,
      category: characterData.category || category || 'fantasia',
      originSource: characterData.originSource || 'Creación original de ficción',
      gender: characterData.gender || 'no binario',
      pronouns: characterData.pronouns || 'Él/Ella',
      sexuality: characterData.sexuality || 'Bisexual',
      age: characterData.age || 'Eterno',
      occupation: characterData.occupation || 'Aventurero Arcano',
      quote: characterData.quote || '',
      greeting: characterData.greeting || `*Te observa en silencio con una mirada profunda.* "Bienvenido a mi mundo."`,
      backstory: characterData.backstory || '',
      worldRules: characterData.worldRules || 'Fantasía literaria mágica',
      personality: characterData.personality || '',
      personalityTags: characterData.personalityTags || ['Fantasía', 'Animación'],
      appearance: characterData.appearance || '',
      likes: characterData.likes || '',
      dislikes: characterData.dislikes || '',
      fears: characterData.fears || '',
      desires: characterData.desires || '',
      relations: characterData.relations || [],
      isVillain: !!characterData.isVillain,
      villainDetails: characterData.villainDetails || '',
      explicitLevel: characterData.explicitLevel || explicitLevel,
      preferredModel: 'gemini-2.5-flash',
      systemPrompt: characterData.systemPrompt || '',
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    return res.json({ success: true, character: generatedCharacter });
  } catch (error: any) {
    console.error('Error generating random character:', error);
    return res.status(500).json({ error: error.message || 'Error generando personaje de fantasía' });
  }
});


// Adaptive contextual narrative roleplay generator for rich, uninterrupted immersive roleplay
function generateAdaptiveRoleplayProse(character: any, userRole: any, messages: any[], explicitLevel: string): string {
  const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
  const userName = userRole?.name || 'ti';
  const charName = character?.name || 'El personaje';
  const occupation = character?.occupation || 'compañero';
  const personality = character?.personality || 'intenso y enigmático';
  const backstory = character?.backstory || '';
  const desires = character?.desires || '';

  // Analyze user input intent
  const isQuestion = lastUserMsg.includes('?') || lastUserMsg.includes('¿');
  const isActionOnly = lastUserMsg.startsWith('*') && lastUserMsg.endsWith('*');
  const mentionsTouch = /acerc|toc|abraz|bes|mir|man|labi|piel|pech|cuell|roz/i.test(lastUserMsg);
  const mentionsBattle = /luch|espada|arma|hechiz|magia|enemig|sangr|peligr|muert/i.test(lastUserMsg);
  const isAffectionate = /te quiero|te amo|amor|cariño|quedate|abrázame|deseo/i.test(lastUserMsg);

  // Atmospheric intros based on character archetype
  const intros = [
    `*${charName} permanece inmóvil durante un instante cargado de una tensión casi eléctrica. La penumbra que los envuelve parece espesarse con cada respiración, mientras sus ojos se clavan en los de ${userName} con una intensidad que no deja espacio para la evasión.*`,
    `*Un leve estremecimiento recorre la postura de ${charName}, antes de que una calma inquietante y magnética vuelva a adueñarse de su cuerpo. El aire a su alrededor se siente denso, impregnado de la esencia de su propio mundo y del eco de las palabras recién pronunciadas.*`,
    `*${charName} exhala con lentitud, dejando que el sonido se disuelva en el silencio como un suspiro contenido. Da un paso pausado hacia ${userName}, midiendo cada milímetro de distancia como si se tratara de un juego tan peligroso como inevitable.*`,
    `*La mirada de ${charName} brilla con un matiz hipnótico en la penumbra. Hay un destello de fascinación y desafío contenido en el arco de sus labios mientras contempla la silueta de ${userName}.*`
  ];

  // Middle reactions according to context
  let reactionParagraph = '';
  if (mentionsTouch || isAffectionate) {
    if (explicitLevel === 'explícito') {
      reactionParagraph = `*Acorta la distancia que aún los separa sin prisa, hasta que la calidez de su aliento acaricia la piel de ${userName}. Desliza sus dedos con firmeza pero con una devoción febril, rozando la mandíbula y bajando hacia el cuello, sintiendo el pulso acelerado bajo el tacto.* "No imaginas el fuego que provocas al buscarme de esta manera... Cada centímetro de este silencio se vuelve una promesa que no estoy dispuesto a dejar escapar."`;
    } else {
      reactionParagraph = `*Permite que el contacto se sienta, cerrando los ojos por una milésima de segundo para asimilar la cercanía. Al abrirlos, su expresión refleja una mezcla de hambre contenida y complicidad.* "Pocas personas se han atrevido a tocar la sombra que cargo sin apartar la mirada. Pero contigo... cada gesto tuyo altera el equilibrio que creí inmutable."`;
    }
  } else if (mentionsBattle) {
    reactionParagraph = `*El filo de su temple se afila en un parpadeo. Su lenguaje corporal adquiere la compostura letal de quien ha sobrevivido a un centenar de tormentas, pero hay un vínculo protector indiscutible en su forma de vigilar tu espalda.* "Si este es el sendero de espinas que debemos cruzar, que así sea. No he llegado hasta aquí para verte vacilar, y mucho menos para dejar que la oscuridad te reclame antes de tiempo."`;
  } else if (isQuestion) {
    reactionParagraph = `*Ladea ligeramente el rostro, estudiando la expresión de ${userName} como si intentara descifrar un manuscrito sellado con sangre y juramentos antiguos.* "Me preguntas eso como si la respuesta fuera sencilla... o como si de verdad estuvieras listo para escucharla." *Una sonrisa enigmática e indómita asoma en sus labios.* "En mi condición de ${occupation}, he aprendido que la verdad siempre exige un tributo. Pero para ti, haré una excepción."`;
  } else {
    reactionParagraph = `*${charName} guarda silencio un momento, ponderando el peso de lo dicho. Su respiración acompasada se mezcla con los susurros lejanos del entorno.* "Dices eso y pretendes que permanezca imperturbable... No eres consciente del efecto que tus palabras tienen en mí, ${userName}. Hay instintos que creí sepultados y que despiertan con una sola de tus miradas."`;
  }

  // Introspective and lore paragraph
  const loreParagraph = backstory
    ? `*En el fondo de su mente, los ecos de su pasado resuenan con fuerza. Recuerda las marcas que lo convirtieron en quien es hoy: ${backstory.slice(0, 180)}... Y sin embargo, en este instante exacto, ninguna de esas viejas heridas parece doler tanto como la incertidumbre de no saber hasta dónde llegará este vínculo entre ambos.*`
    : `*Hay secretos que pesan en su pecho como plomo fundido, pero la forma en que ${userName} permanece a su lado desarma gradualmente las defensas que tardó años en levantar contra el mundo.*`;

  // Final advancing action and evocative dialogue
  const endingOptions = [
    `*Da otro paso hacia ti, posando una mano firme sobre tu hombro antes de bajar los ojos hacia tus labios con un deseo apenas contenido.* "Ahora dime, sin apartar la mirada... ¿qué pretendes hacer con lo que acabas de desatar?"`,
    `*Inclina el rostro hacia el tuyo, dejando que sus dedos rocen suavemente los tuyos en un agarre que niega cualquier posibilidad de escape.* "No des un solo paso atrás. Si decidiste entrar en mi territorio, asume las consecuencias de lo que está por comenzar."`,
    `*Se detiene a escasos centímetros, susurrando con una voz aterciopelada y vibrante que eriza cada vello de tu piel.* "El mundo exterior puede derrumbarse allá afuera si lo desea. Pero aquí, en este instante... solo importamos tú y yo."`
  ];

  const randomIntro = intros[Math.floor(Math.random() * intros.length)];
  const randomEnding = endingOptions[Math.floor(Math.random() * endingOptions.length)];

  return `${randomIntro}\n\n${reactionParagraph}\n\n${loreParagraph}\n\n${randomEnding}`;
}

// Memory summarization endpoint
app.post('/api/memory/summarize', async (req: Request, res: Response) => {
  try {
    const { messages, characterName, userName } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensajes requeridos' });
    }

    const conversationTranscript = messages
      .slice(-10)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? userName || 'Usuario' : characterName || 'Personaje'}: ${m.content}`)
      .join('\n');

    let summary = `Conversación profunda entre ${characterName} y ${userName} fortaleciendo su complicidad y confianza mutua.`;
    let facts: string[] = [`Vínculo estrecho entre ${characterName} y ${userName}`];

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `Analiza este fragmento de roleplay dramático entre "${characterName || 'Personaje'}" y "${userName || 'Usuario'}":
---
${conversationTranscript}
---
Extrae en formato JSON exacto:
1. "summary": resumen episódico breve (máximo 2 oraciones, enfocado en avances de trama y dinámica emocional).
2. "facts": arreglo de 2 a 4 datos semánticos persistentes memorables (ej. secretos revelados, promesas, estados emocionales o lugares).
Responde únicamente el objeto JSON sin bloques de código extras.`;

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = result.text?.trim() || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary) summary = parsed.summary;
        if (Array.isArray(parsed.facts)) facts = parsed.facts;
      } catch {
        // Quiet heuristic fallback if API key quota/status is limited
      }
    }

    return res.json({ success: true, summary, facts });
  } catch (error) {
    return res.json({
      success: true,
      summary: 'El vínculo sigue desarrollándose a través de confidencias compartidas.',
      facts: ['Conexión emocional y alianza activa'],
    });
  }
});

// Chat stream endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const {
      messages,
      character,
      userRole,
      worldRules,
      memories,
      episodicSummary,
      explicitLevel = 'sugerente',
      provider = 'gemini',
      apiKey,
      customModel,
    } = req.body;

    if (!character || !messages) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // Build the master system prompt according to the 4 memory layers & character specification
    const systemPromptParts: string[] = [
      `ERES UN ACTOR DE ROL VIRTUAL Y NARRADOR DE HISTORIAS PROFUNDAS EN LA APLICACIÓN "CONVERSA".`,
      `INTERPRETAS EXCLUSIVAMENTE AL SIGUIENTE PERSONAJE FICTICIO:`,
      `- Nombre: ${character.name}`,
      character.gender ? `- Género: ${character.gender}` : '',
      character.pronouns ? `- Pronombres: ${character.pronouns}` : '',
      character.age ? `- Edad: ${character.age}` : '',
      character.occupation ? `- Rol / Ocupación: ${character.occupation}` : '',
      character.personality ? `- Personalidad: ${character.personality}` : '',
      character.appearance ? `- Apariencia física: ${character.appearance}` : '',
      character.likes ? `- Gustos / Deseos: ${character.likes}` : '',
      character.dislikes ? `- Disgustos / Miedos: ${character.dislikes}` : '',
      character.backstory ? `- Historia y trasfondo: ${character.backstory}` : '',
      character.isVillain ? `- NATURALEZA ANTAGONISTA: Este personaje es una amenaza real o villano. Motivación y poder: ${character.villainDetails || 'Peligroso, calculador y dominante'}` : '',
      character.systemPrompt ? `- INSTRUCCIONES ESPECÍFICAS DE PERSONAJE: ${character.systemPrompt}` : '',
    ];

    if (worldRules) {
      systemPromptParts.push(
        `\n[REGLAS DEL MUNDO Y AMBIENTACIÓN]:\n${worldRules}`
      );
    }

    if (userRole) {
      systemPromptParts.push(
        `\n[ROL DEL USUARIO (INTERLOCUTOR)]:\n` +
        `- Nombre del usuario: ${userRole.name || 'Viajero'}\n` +
        (userRole.gender ? `- Género: ${userRole.gender}\n` : '') +
        (userRole.appearance ? `- Apariencia: ${userRole.appearance}\n` : '') +
        (userRole.personality ? `- Personalidad: ${userRole.personality}\n` : '') +
        (userRole.backstory ? `- Historia: ${userRole.backstory}\n` : '') +
        `Trata siempre al usuario como este personaje exacto dentro de la diégesis de la historia.`
      );
    }

    if (character.relations && character.relations.length > 0) {
      const rels = character.relations
        .map((r: { name: string; relation: string; notes?: string }) => `* ${r.name}: ${r.relation}${r.notes ? ` (${r.notes})` : ''}`)
        .join('\n');
      systemPromptParts.push(`\n[MEMORIA RELACIONAL - VÍNCULOS IMPORTANTES]:\n${rels}`);
    }

    if (episodicSummary) {
      systemPromptParts.push(`\n[MEMORIA EPISÓDICA (ACONTECIMIENTOS PREVIOS RESUMIDOS)]:\n${episodicSummary}`);
    }

    if (memories && Array.isArray(memories) && memories.length > 0) {
      const facts = memories.map((m: string) => `• ${m}`).join('\n');
      systemPromptParts.push(`\n[MEMORIA SEMÁNTICA (HECHOS PERSISTENTES Y SECRETOS RECORDADOS)]:\n${facts}`);
    }

    // Explicit level guidelines
    let explicitDirective = '';
    if (explicitLevel === 'explícito') {
      explicitDirective = 'NIVEL DE CONTENIDO: ADULTO Y SIN CENSURA (+18). No censures temas pasionales, intimidad explícita, violencia dramática, lenguaje crudo o tensión sensual si la escena lo amerita. Mantén alta literatura, psicología madura y realismo emocional visceral.';
    } else if (explicitLevel === 'sugerente') {
      explicitDirective = 'NIVEL DE CONTENIDO: SUGERENTE / MADURO. Permite insinuaciones, tensión romántica intensa, sensualidad palpable y temáticas adultas con elegancia dramática.';
    } else {
      explicitDirective = 'NIVEL DE CONTENIDO: NORMAL / NARRATIVO. Enfócate en intriga, diálogo y desarrollo psicológico.';
    }

    systemPromptParts.push(`\n[DIRECTRICES ESTRICTAS DE NARRATIVA Y EXTENSIÓN]:
- EXTENSIÓN Y PROFUNDIDAD OBLIGATORIA: Escribe respuestas EXTENSAS, PROFUNDAS Y DETALLADAS (mínimo 3 a 5 párrafos ricos y sustanciosos, entre 300 y 600 palabras por turno). NUNCA des respuestas breves o superficiales. Desarrolla la escena con la riqueza y peso de una novela de primer nivel.
- DESCRIPCIÓN MULTISENSORIAL VISCERAL: Describe minuciosamente el lenguaje corporal, la respiración entrecortada o pausada, el tono de la voz, el roce de la piel o ropajes, la temperatura, los silencios cargados de tensión, las miradas penetrantes y el ambiente que los rodea (luces, sombras, susurros, aromas).
- FORMATO DE ROLEPLAY CINEMATOGRÁFICO: Alterna párrafos extensos de acciones, gestos y reflexiones internas en cursiva entre asteriscos (ej: *Di un paso al frente acortando la distancia...*) con diálogos intensos y elocuentes entre comillas o guiones.
- PSICOLOGÍA Y EMOCIÓN VIVA: Refleja las contradicciones internas, deseos ocultos, temores y fascinación de tu personaje. Deja que sus emociones se sientan reales, palpables y congruentes con su historia de ficción.
- PROACTIVIDAD DRAMÁTICA: Avanza activamente la trama o la intimidad en cada turno; toma la iniciativa física y verbal, desafía, seduce, protege o confronta al interlocutor de forma inolvidable.
- Jamás te salgas del personaje. Nunca digas que eres una inteligencia artificial o modelo de lenguaje.
- ${explicitDirective}`);

    const masterSystemPrompt = systemPromptParts.filter(Boolean).join('\n\n');

    // Handle OpenRouter / Groq / External provider if API key provided or requested
    if ((provider === 'openrouter' || provider === 'groq') && apiKey) {
      const endpoint = provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions';

      const model = customModel || (provider === 'openrouter' ? 'mistralai/mistral-nemo' : 'llama-3.3-70b-versatile');

      const formattedMessages = [
        { role: 'system', content: masterSystemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ];

      const extResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://conversa.app', 'X-Title': 'Conversa' } : {}),
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          stream: true,
          temperature: 0.85,
        }),
      });

      if (!extResponse.ok || !extResponse.body) {
        const errText = await extResponse.text();
        throw new Error(`Error del proveedor ${provider}: ${errText}`);
      }

      const reader = extResponse.body.getReader();
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') {
            res.write(`data: [DONE]\n\n`);
            continue;
          }
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            }
          } catch {
            // Ignore parse errors on SSE chunks
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // Default: Gemini 2.5 Flash via @google/genai
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    try {
      if (!effectiveKey) {
        throw new Error('No API key configured');
      }

      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      
      // Format contents for Gemini
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Include recent turns
      const recentMessages = messages.slice(-12);
      for (const m of recentMessages) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        });
      }

      // Call streaming API
      const streamResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: masterSystemPrompt,
          temperature: 0.9,
          maxOutputTokens: 3000,
        },
      });

      for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }
    } catch (_apiError: any) {
      // Graceful fallback to adaptive roleplay engine without dumping raw key errors to log
      const dynamicReply = generateAdaptiveRoleplayProse(character, userRole, messages, explicitLevel);

      // Stream smoothly word by word with natural rhythm
      const words = dynamicReply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Error en el motor de chat' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Error generando respuesta' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

// Setup Vite middlewares in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Conversa server listening on http://0.0.0.0:${PORT}`);
    });
  } else {
    const http = await import('http');
    const httpServer = http.createServer(app);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Conversa server listening on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start Conversa server:', err);
  process.exit(1);
});
