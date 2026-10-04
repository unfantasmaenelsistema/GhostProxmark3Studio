import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || '10mb';
const isProduction = process.env.NODE_ENV === 'production';

if (HOST === '0.0.0.0') {
  console.warn('[Proxmark3 Web Studio] AVISO: el servidor escucha en 0.0.0.0 (todas las interfaces de red).');
}

app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Cuerpo de la petición demasiado grande.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON de la petición inválido.' });
  }
  return next(err);
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes al asistente IA. Inténtalo de nuevo en un minuto.' },
});

// Initialize Google GenAI
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI() : null;

// Domain-specific intelligent advisor engine for Proxmark3 & RFID/NFC
function generateDomainExpertReply(prompt: string, cardContext: any, deviceStatus: any): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('siguiente') || lowerPrompt.includes('paso') || lowerPrompt.includes('recomiendas') || lowerPrompt.includes('ahora') || lowerPrompt.includes('que hago')) {
    if (cardContext?.type?.includes('Classic') || cardContext?.uid) {
      return `### Secuencia Recomendada para Auditar tu Tarjeta **${cardContext.type || 'MIFARE Classic 1K'}** (UID: \`${cardContext.uid || 'A4 8F 2B 19'}\`):

1. **Paso 1: Verificación de diccionario de claves estándar**
   Ejecuta:
   \`\`\`bash
   hf mf chk --1k
   \`\`\`
   *Comprueba rápidamente si los sectores usan claves de fábrica por defecto (\`FFFFFFFFFFFF\`, \`A0A1A2A3A4A5\`, etc.).*

2. **Paso 2: Descifrado completo con Ataque Nested**
   Ejecuta:
   \`\`\`bash
   hf mf autopwn --1k
   \`\`\`
   *Aprovecha las claves encontradas en el paso 1 para capturar nonces de los sectores protegidos y extraer las 32 claves (Key A y Key B) de los 16 sectores en ~30 segundos.*

3. **Paso 3: Inspección forense y exportación**
   - Ve a la pestaña **Visor Hex** para revisar los bloques de datos.
   - Ve a **Auditor Seguridad** para evaluar el riesgo criptográfico de la tarjeta.
   - O usa **Conversor Flipper/PM3** si deseas exportar el volcado a tu Flipper Zero (\`.nfc\`).`;
    }

    return `### Pasos iniciales recomendados:

1. **Paso 1: Diagnóstico de resonancia y antenas**
   \`\`\`bash
   hw tune
   \`\`\`
   *Verifica que la bobina LF supere los 28V y la HF supere los 10V.*

2. **Paso 2: Detección e identificación de credencial**
   - Para baja frecuencia (125 kHz): \`lf search\`
   - Para alta frecuencia (13.56 MHz): \`hf search\` o \`hf 14a info\``;
  }

  if (lowerPrompt.includes('clonar') || lowerPrompt.includes('copiar') || lowerPrompt.includes('grabar')) {
    return `### Procedimiento de Clonación en Proxmark3:

#### A. Si la tarjeta es de Baja Frecuencia (LF 125 kHz - EM4100 / HID Prox II):
1. **Limpiar chip T5577:**
   \`\`\`bash
   lf t55xx wipe
   \`\`\`
2. **Grabar ID clonado (ejemplo EM4100):**
   \`\`\`bash
   lf em 410xclone --id 0102030405
   \`\`\`
3. **Verificar que la lectura es idéntica:**
   \`\`\`bash
   lf em 410xread
   \`\`\`

#### B. Si la tarjeta es de Alta Frecuencia (HF 13.56 MHz - MIFARE Classic):
1. Necesitas una tarjeta "Magic Card" china:
   - **Para Gen1a (Backdoor 0x40/0x43):**
     \`\`\`bash
     hf mf cload -f dump.eml
     \`\`\`
   - **Para Gen2 (CUID con escritura directa en Bloque 0):**
     \`\`\`bash
     hf mf csetuid --uid ${cardContext?.uid ? cardContext.uid.replace(/\s+/g, '') : 'A48F2B19'}
     \`\`\``;
  }

  if (lowerPrompt.includes('autopwn') || lowerPrompt.includes('nested') || lowerPrompt.includes('darkside')) {
    return `### Estrategia de Ataque Criptográfico MIFARE Classic:

- **Si conoces al menos 1 clave válida (ej: sector 0 por defecto):**
  Lanza el ataque anidado automático:
  \`\`\`bash
  hf mf autopwn --1k
  \`\`\`
  *El comando probará primero el diccionario y luego encadenará el ataque Nested sobre el PRNG débil de NXP Crypto-1.*

- **Si todas las claves fueron cambiadas (A ciegas):**
  Lanza el ataque de oráculo de paridad:
  \`\`\`bash
  hf mf darkside
  \`\`\`
  *Filtrará bytes de clave explotando las respuestas NACK \`0x5\` de la tarjeta.*`;
  }

  if (lowerPrompt.includes('antena') || lowerPrompt.includes('voltaje') || lowerPrompt.includes('tune')) {
    return `### Diagnóstico y Calibración de Antenas LC:

Ejecuta el sintonizador:
\`\`\`bash
hw tune
\`\`\`

- **Valores nominales saludables:**
  - **LF (125.00 kHz):** 28.0 V ~ 38.0 V (Estado actual: ${deviceStatus?.lfVoltage || 29.4} V)
  - **HF (13.56 MHz):** 10.0 V ~ 15.0 V (Estado actual: ${deviceStatus?.hfVoltage || 11.2} V)

**Consejo pro:** Si el voltaje cae por debajo de 18V en LF o 6V en HF, retira el lector de mesas metálicas o carcasas con blindaje conductor que provoquen desacoplamiento inductivo.`;
  }

  return `### Instrucciones del Copiloto Proxmark3:

Para tu consulta sobre **"${prompt}"**, los pasos estándar en la CLI de Iceman son:

1. **Verificar estado y versión:**
   \`\`\`bash
   hw version
   \`\`\`
2. **Sintonizar antenas:**
   \`\`\`bash
   hw tune
   \`\`\`
3. **Identificar la credencial:**
   \`\`\`bash
   hf search
   \`\`\`
   *(o \`lf search\` si se trata de un llavero o tarjeta de garaje de 125 kHz).*

*Puedes hacer clic en los botones de comando sugeridos para ejecutarlos o copiarlos directamente.*`;
}

// AI Assistant endpoint
const MAX_PROMPT_LENGTH = 2000;

app.post('/api/ai/assistant', aiRateLimiter, async (req: Request, res: Response) => {
  const { prompt, cardContext, recentCommands, deviceStatus } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'El prompt es requerido.' });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `El prompt no puede superar los ${MAX_PROMPT_LENGTH} caracteres.` });
  }

  const systemInstruction = `Eres el "Copiloto IA de Proxmark3 Web Studio" de unfantasmaenelsistema.com, un experto de élite en ciberseguridad física, análisis de señales RFID/NFC, ingeniería inversa de hardware y el repositorio oficial de Iceman para Proxmark3.
Tu misión es guiar al analista con los pasos exactos a seguir para auditar, decodificar, clonar o defender credenciales y sistemas de control de acceso.

Directrices obligatorias:
1. Brinda explicaciones técnicas pero directas y concisas.
2. Proporciona siempre el comando exacto de Proxmark3 (formato CLI de Iceman, ej: \`hf mf autopwn --1k\`, \`lf search\`, \`hw tune\`, \`lf t55xx wrbl\`).
3. Explica brevemente POR QUÉ se ejecuta ese comando y qué resultado esperar en los logs (como \`[+]\` o \`[-]\`).
4. Si el usuario te proporciona el contexto de una tarjeta (UID, SAK, tipo de tarjeta, sectores), adapta tus instrucciones exactamente a esa tarjeta.
5. Fomenta las mejores prácticas de seguridad ética y mitigación defensiva.
6. Responde siempre en español profesional y amigable.`;

  // Try live Gemini API call first with 3.5s timeout
  if (ai) {
    try {
      const fullPrompt = `Contexto del Hardware y Tarjeta en Proxmark3:
- Estado del Dispositivo: ${JSON.stringify(deviceStatus || {})}
- Tarjeta actual en antena: ${JSON.stringify(cardContext || {})}
- Últimos comandos ejecutados: ${JSON.stringify(recentCommands || [])}

Pregunta / Petición del usuario:
${prompt}

Indica la secuencia de pasos recomendada y los comandos exactos de Proxmark3 que debe ejecutar.`;

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de API Gemini')), 3500)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        return res.json({ reply: response.text });
      }
    } catch (apiError: any) {
      console.warn('Gemini API call timed out or failed, using domain fallback:', apiError.message);
    }
  }

  // Domain expert fallback response
  const domainReply = generateDomainExpertReply(prompt, cardContext, deviceStatus);
  return res.json({ reply: domainReply });
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Proxmark3 Web Studio] Servidor activo en http://${HOST}:${PORT}`);
  });
}

startServer();
