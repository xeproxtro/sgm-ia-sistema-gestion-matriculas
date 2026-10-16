# Configuración de Google Cloud API para Gemini AI

Este documento explica cómo configurar correctamente las credenciales de Google Cloud para usar la API de Gemini AI en el sistema de gestión de matrículas.

## Tipos de API Keys

Existen dos tipos de API keys para Google Gemini:

### 1. API Key Tradicional (Recomendada)
- **Formato**: Comienza con `AIzaSy...`
- **Ventajas**: No requiere configuración adicional en Google Cloud Console
- **Obtención**: Se crea directamente en Google AI Studio
- **Uso**: Funciona inmediatamente con el endpoint REST de Gemini

### 2. API Key de Proyecto (Problemática)
- **Formato**: Comienza con `AQ.`
- **Desventajas**: Requiere habilitación explícita de la API en Google Cloud Console
- **Problema**: Causa error 404 si la API Generative Language no está habilitada
- **Obtención**: Se crea desde Google Cloud Console

## Solución Recomendada: Usar API Key Tradicional

### Pasos para obtener una API Key tradicional:

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" o "Crear API Key"
4. Copia la API key generada (comenzará con `AIzaSy...`)
5. Añádela a tu archivo `.env`:

```env
AI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AI_MODEL=gemini-1.5-flash
```

## Alternativa: Configurar API Key de Proyecto

Si debes usar una API key de proyecto (AQ.), sigue estos pasos:

### 1. Habilitar la API Generative Language

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto (ID: 400638084244)
3. Navega a: APIs & Services > Library
4. Busca "Generative Language API"
5. Haz clic en "Enable" o "Habilitar"

### 2. Configurar IAM y Permisos

1. En Google Cloud Console, ve a: IAM & Admin > IAM
2. Asegúrate de que tu cuenta tenga el rol "Service Usage Consumer" o superior
3. Verifica que la API key tenga los permisos necesarios

### 3. Verificar la Configuración

Después de habilitar la API, puede tomar unos minutos para que los cambios se propaguen. Si el error 404 persiste:

- Verifica que el proyecto ID sea correcto
- Confirma que la API esté realmente habilitada en la consola
- Revisa los logs de errores en Google Cloud Console

## Configuración en el Sistema

El sistema ahora detecta automáticamente el tipo de API key y proporciona advertencias específicas:

```javascript
// En src/Services/AIService.js
this.isProjectKey = this.apiKey.startsWith('AQ.');

if (this.isProjectKey) {
  console.warn('⚠️  WARNING: Using project credentials (AQ.)');
  console.warn('⚠️  Ensure Generative Language API is enabled in Google Cloud project');
  console.warn('⚠️  Or use a traditional API key from https://aistudio.google.com/app/apikey');
}
```

## Manejo de Errores 404

Si recibes un error 404 al usar credenciales de proyecto, el sistema ahora proporciona un mensaje de error detallado con soluciones:

```
Error 404: La API Generative Language no está habilitada en tu proyecto de Google Cloud.
SOLUCIONES:
1. Habilita la API en: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. O usa una API key tradicional desde: https://aistudio.google.com/app/apikey
3. Las claves tradicionales comienzan con "AIzaSy..." y no requieren configuración de GCP
```

## Verificación de la Configuración

Para verificar que tu configuración funciona correctamente:

1. Inicia el servidor: `npm start`
2. Observa los logs de configuración del AI Service
3. Verifica que no haya advertencias sobre credenciales de proyecto
4. Prueba una solicitud de IA desde la aplicación

## Recursos Adicionales

- [Google AI Studio](https://aistudio.google.com/)
- [Documentación de Gemini API](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com)
- [Generative Language API](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)

## Soporte

Si tienes problemas con la configuración:

1. Verifica que la API key sea válida
2. Confirma que el modelo especificado esté disponible
3. Revisa los logs del servidor para errores detallados
4. Considera usar una API key tradicional como solución alternativa
