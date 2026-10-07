// Client-side port of server.ts's generateDomainExpertReply().
// Used by AiSecurityCopilot as a fallback when the /api/ai/assistant backend
// is unreachable (e.g. on a static deployment like GitHub Pages, which has
// no Node server to proxy the Gemini API key).
export function generateDomainExpertReply(prompt: string, cardContext: any, deviceStatus: any): string {
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

- **Si todas las claves fueron cambiadas (a ciegas):**
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
