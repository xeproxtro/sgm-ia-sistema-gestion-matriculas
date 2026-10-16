const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    // Usar enrutador gratuito universal de OpenRouter
    this.modelName = 'openrouter/free';
    
    // Usar API key desde variable de entorno
    this.apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
    
    // Usar endpoint de OpenRouter
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    console.log('=== AI Service Configuration ===');
    console.log('Model:', this.modelName);
    console.log('Using OpenRouter API');
    console.log('Endpoint URL:', this.openRouterUrl);
    console.log('API Key (hardcoded):', apiKey.substring(0, 20) + '...');
    console.log('==============================');
    console.log('✅ AI Service initialized successfully');
  }

  async optimizeSchedule(studentData, availableCourses) {
    try {
      const prompt = this.buildScheduleOptimizationPrompt(studentData, availableCourses);
      
      console.log('📤 Sending request to OpenRouter for schedule optimization...');
      
      // Usar endpoint de OpenRouter con formato de chat
      const response = await axios.post(this.openRouterUrl, {
        model: this.modelName,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SGM-IA'
        }
      });

      const content = response.data.choices[0].message.content;
      console.log('✅ OpenRouter response received:', content.substring(0, 100) + '...');
      
      return this.parseGeminiTextResponse(content);
    } catch (error) {
      console.error('=== ERROR COMPLETO DE OPENROUTER (optimizeSchedule) ===');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Headers:', error.response?.headers);
      console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('======================================================');
      throw error;
    }
  }

  async getAcademicAdvice(studentData, query = '') {
    try {
      const prompt = this.buildAcademicAdvicePrompt(studentData, query);
      
      console.log('📤 Sending request to OpenRouter for academic advice...');
      
      // Usar endpoint de OpenRouter con formato de chat
      const response = await axios.post(this.openRouterUrl, {
        model: this.modelName,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SGM-IA'
        }
      });

      const content = response.data.choices[0].message.content;
      console.log('✅ OpenRouter response received for academic advice:', content.substring(0, 100) + '...');
      console.log('📝 Full content type:', typeof content);
      console.log('📝 Content length:', content.length);
      
      // Asegurarse de que content sea un string limpio
      const cleanContent = typeof content === 'string' ? content : JSON.stringify(content);
      
      return {
        success: true,
        advice: cleanContent
      };
    } catch (error) {
      console.error('=== ERROR COMPLETO DE OPENROUTER (getAcademicAdvice) ===');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Headers:', error.response?.headers);
      console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('======================================================');
      throw error;
    }
  }

  buildScheduleOptimizationPrompt(studentData, availableCourses) {
    const {
      program,
      currentSemester,
      academicRecord,
      gpa,
      creditsCompleted
    } = studentData;

    const failedSubjects = academicRecord.filter(r => r.status === 'failed').map(r => r.subject_name);
    const cancelledSubjects = academicRecord.filter(r => r.status === 'cancelled').map(r => r.subject_name);
    const approvedSubjects = academicRecord.filter(r => r.status === 'approved').map(r => r.subject_name);

    // Fecha actual dinámica con día de la semana
    const currentDate = new Date().toLocaleDateString('es-CO', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let prompt = `Estudiante del programa ${program}, semestre ${currentSemester}, promedio ${gpa}, créditos completados ${creditsCompleted}.\n`;
    prompt += `Fecha actual: ${currentDate}.\n\n`;
    
    prompt += `Materias reprobadas (prioridad alta): ${failedSubjects.join(', ') || 'Ninguna'}\n`;
    prompt += `Materias canceladas (prioridad alta): ${cancelledSubjects.join(', ') || 'Ninguna'}\n`;
    prompt += `Materias aprobadas: ${approvedSubjects.join(', ') || 'Ninguna'}\n\n`;
    
    prompt += `Materias disponibles:\n`;
    availableCourses.forEach(course => {
      prompt += `- ${course.subject_name} (${course.code}): Grupo ${course.group_number}, Créditos ${course.credits}\n`;
      prompt += `  Horario: ${this.formatSchedule(course.schedule)}\n`;
      prompt += `  Cupos disponibles: ${course.capacity - course.enrolled}\n\n`;
    });

    prompt += `Instrucciones:\n`;
    prompt += `1. Prioriza materias reprobadas y canceladas\n`;
    prompt += `2. Evita cruces de horario\n`;
    prompt += `3. Minimiza tiempos muertos mayores a 3 horas\n`;
    prompt += `4. Considera la carga adecuada según el semestre\n`;
    prompt += `5. Retorna las sugerencias en formato JSON con la siguiente estructura:\n`;
    prompt += `{\n`;
    prompt += `  "suggestions": [\n`;
    prompt += `    {\n`;
    prompt += `      "name": "Nombre de la sugerencia",\n`;
    prompt += `      "courses": ["código1", "código2"],\n`;
    prompt += `      "total_credits": número,\n`;
    prompt += `      "reasoning": "explicación",\n`;
    prompt += `      "schedule_conflicts": [],\n`;
    prompt += `      "dead_time_hours": número\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}`;

    return prompt;
  }

  formatSchedule(schedule) {
    if (typeof schedule === 'string') {
      return schedule;
    }
    
    if (Array.isArray(schedule)) {
      return schedule.map(day => 
        `${day.day}: ${day.start_time} - ${day.end_time}`
      ).join(', ');
    }
    
    return JSON.stringify(schedule);
  }

  parseGeminiTextResponse(content) {
    try {
      // Intentar parsear JSON si la respuesta contiene datos estructurados
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions: parsed.suggestions || [],
          rawResponse: content
        };
      }
      
      // Si no es JSON, parsear manualmente
      return {
        success: true,
        suggestions: this.parseTextToSuggestions(content),
        rawResponse: content
      };
    } catch (error) {
      console.error('Error al parsear respuesta de Gemini:', error);
      return {
        success: false,
        error: 'Error al procesar la respuesta de la IA',
        rawResponse: content
      };
    }
  }
  
  parseTextToSuggestions(text) {
    // Parsear texto simple a formato de sugerencias
    return [{
      name: "Sugerencia basada en análisis",
      courses: [],
      total_credits: 0,
      reasoning: text.substring(0, 200),
      schedule_conflicts: [],
      dead_time_hours: 0
    }];
  }

  buildAcademicAdvicePrompt(studentData, query = '') {
    const { program, currentSemester, gpa, academicRecord } = studentData;
    
    const failedCount = academicRecord.filter(r => r.status === 'failed').length;
    const approvedCount = academicRecord.filter(r => r.status === 'approved').length;
    const failedSubjects = academicRecord.filter(r => r.status === 'failed').map(r => r.subject_name);
    
    // Fecha actual dinámica con día de la semana
    const currentDate = new Date().toLocaleDateString('es-CO', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let prompt = `Eres un asistente académico para estudiantes del programa ${program}.\n`;
    prompt += `Fecha actual: ${currentDate}.\n`;
    prompt += `Estudiante: semestre ${currentSemester}, promedio ${gpa}, ${approvedCount} materias aprobadas, ${failedCount} reprobadas.\n`;
    
    if (failedSubjects.length > 0) {
      prompt += `Materias reprobadas: ${failedSubjects.join(', ')}.\n`;
    }
    
    if (query) {
      prompt += `\nPregunta: ${query}\n\n`;
    }
    
    prompt += `Responde de forma directa y concisa. Sé breve y específico. No incluyas metadatos ni análisis innecesarios. Solo responde lo que el estudiante pregunta.`;
    
    return prompt;
  }
}

module.exports = new AIService();
