const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Asegurar que el directorio de uploads existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generar PDF de malla curricular
function generateCurriculumPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = path.join(uploadDir, 'malla-ingenieria-sistemas.pdf');
    const stream = fs.createWriteStream(filename);

    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('MALLA CURRICULAR', { align: 'center' });
    doc.fontSize(16).text('Ingeniería de Sistemas', { align: 'center' });
    doc.fontSize(12).text('Versión 2024-1', { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Información general
    doc.fontSize(14).font('Helvetica-Bold').text('Información General:');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total de Créditos: 160`);
    doc.text(`Duración: 10 Semestres`);
    doc.text(`Programa: Ingeniería de Sistemas`);
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Materias por semestre
    doc.fontSize(14).font('Helvetica-Bold').text('Plan de Estudios por Semestre:');
    doc.moveDown();

    const semesters = [
      {
        number: 1,
        subjects: [
          { code: 'IS101', name: 'Programación I', credits: 4, type: 'Obligatoria' },
          { code: 'MAT101', name: 'Cálculo I', credits: 4, type: 'Obligatoria' },
          { code: 'FIS101', name: 'Física General', credits: 3, type: 'Obligatoria' },
          { code: 'ING101', name: 'Inglés I', credits: 2, type: 'Obligatoria' }
        ]
      },
      {
        number: 2,
        subjects: [
          { code: 'IS102', name: 'Estructuras de Datos', credits: 4, type: 'Obligatoria' },
          { code: 'MAT102', name: 'Cálculo II', credits: 4, type: 'Obligatoria' },
          { code: 'IS103', name: 'Lógica Matemática', credits: 3, type: 'Obligatoria' },
          { code: 'ING102', name: 'Inglés II', credits: 2, type: 'Obligatoria' }
        ]
      },
      {
        number: 3,
        subjects: [
          { code: 'IS201', name: 'Bases de Datos', credits: 4, type: 'Obligatoria' },
          { code: 'IS202', name: 'Ingeniería de Software', credits: 4, type: 'Obligatoria' },
          { code: 'MAT201', name: 'Álgebra Lineal', credits: 3, type: 'Obligatoria' },
          { code: 'ING103', name: 'Inglés III', credits: 2, type: 'Obligatoria' }
        ]
      },
      {
        number: 4,
        subjects: [
          { code: 'IS203', name: 'Sistemas Operativos', credits: 4, type: 'Obligatoria' },
          { code: 'IS204', name: 'Redes de Computadores', credits: 4, type: 'Obligatoria' },
          { code: 'EST101', name: 'Estadística', credits: 3, type: 'Obligatoria' },
          { code: 'ING104', name: 'Inglés IV', credits: 2, type: 'Obligatoria' }
        ]
      },
      {
        number: 5,
        subjects: [
          { code: 'IS301', name: 'Inteligencia Artificial', credits: 4, type: 'Obligatoria' },
          { code: 'IS302', name: 'Desarrollo Web', credits: 4, type: 'Obligatoria' },
          { code: 'IS303', name: 'Seguridad Informática', credits: 3, type: 'Obligatoria' },
          { code: 'EL101', name: 'Electiva: Emprendimiento', credits: 3, type: 'Electiva' }
        ]
      },
      {
        number: 6,
        subjects: [
          { code: 'IS401', name: 'Machine Learning', credits: 4, type: 'Obligatoria' },
          { code: 'IS402', name: 'Computación en la Nube', credits: 4, type: 'Obligatoria' },
          { code: 'IS403', name: 'Gestión de Proyectos', credits: 3, type: 'Obligatoria' },
          { code: 'EL102', name: 'Electiva: Derecho Informático', credits: 3, type: 'Electiva' }
        ]
      },
      {
        number: 7,
        subjects: [
          { code: 'IS501', name: 'Big Data', credits: 4, type: 'Obligatoria' },
          { code: 'IS502', name: 'IoT y Sistemas Embebidos', credits: 4, type: 'Obligatoria' },
          { code: 'OP101', name: 'Optativa: Desarrollo Móvil', credits: 3, type: 'Optativa' },
          { code: 'OP102', name: 'Optativa: Ciberseguridad Avanzada', credits: 3, type: 'Optativa' }
        ]
      },
      {
        number: 8,
        subjects: [
          { code: 'IS601', name: 'Arquitectura de Software', credits: 4, type: 'Obligatoria' },
          { code: 'IS602', name: 'DevOps', credits: 4, type: 'Obligatoria' },
          { code: 'IS603', name: 'Ética Profesional', credits: 2, type: 'Obligatoria' },
          { code: 'EL103', name: 'Electiva: Gestión TI', credits: 3, type: 'Electiva' }
        ]
      },
      {
        number: 9,
        subjects: [
          { code: 'IS701', name: 'Proyecto de Grado I', credits: 6, type: 'Obligatoria' },
          { code: 'IS702', name: 'Blockchain', credits: 3, type: 'Obligatoria' },
          { code: 'OP103', name: 'Optativa: Realidad Aumentada', credits: 3, type: 'Optativa' }
        ]
      },
      {
        number: 10,
        subjects: [
          { code: 'IS801', name: 'Proyecto de Grado II', credits: 8, type: 'Obligatoria' },
          { code: 'IS802', name: 'Práctica Profesional', credits: 6, type: 'Obligatoria' }
        ]
      }
    ];

    semesters.forEach(semester => {
      doc.fontSize(12).font('Helvetica-Bold').text(`Semestre ${semester.number}:`);
      doc.moveDown(0.5);

      // Tabla de materias
      const tableTop = doc.y;
      const itemHeight = 25;
      
      // Encabezados de tabla
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Código', 50, tableTop);
      doc.text('Materia', 120, tableTop);
      doc.text('Créditos', 350, tableTop);
      doc.text('Tipo', 420, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      let currentY = tableTop + 20;
      semester.subjects.forEach(subject => {
        doc.fontSize(9).font('Helvetica');
        doc.text(subject.code, 50, currentY);
        doc.text(subject.name, 120, currentY);
        doc.text(subject.credits.toString(), 350, currentY);
        doc.text(subject.type, 420, currentY);
        currentY += itemHeight;
      });
      
      doc.y = currentY + 10;
      doc.moveDown();
    });

    // Pie de página
    doc.fontSize(8).text('Unidades Tecnológicas de Santander - UTS', { align: 'center' });
    doc.text('Documento generado automáticamente por el Sistema de Gestión de Matrículas', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

// Generar PDF de sílabo de materia
function generateSyllabusPDF(subjectCode, subjectName, credits, semester) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = path.join(uploadDir, `silabo-${subjectCode}.pdf`);
    const stream = fs.createWriteStream(filename);

    doc.pipe(stream);

    // Encabezado
    doc.fontSize(18).font('Helvetica-Bold').text('SÍLABO', { align: 'center' });
    doc.fontSize(14).text(subjectName, { align: 'center' });
    doc.fontSize(11).text(`Código: ${subjectCode} | Créditos: ${credits} | Semestre: ${semester}`, { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Descripción
    doc.fontSize(12).font('Helvetica-Bold').text('1. Descripción de la Asignatura:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Esta asignatura proporciona los fundamentos teóricos y prácticos de ${subjectName}.`);
    doc.text('Los estudiantes desarrollarán competencias para aplicar los conceptos en contextos reales.');
    doc.moveDown();

    // Objetivos
    doc.fontSize(12).font('Helvetica-Bold').text('2. Objetivos de Aprendizaje:');
    doc.fontSize(10).font('Helvetica');
    doc.text('• Comprender los fundamentos teóricos de la disciplina.');
    doc.text('• Aplicar metodologías y herramientas prácticas.');
    doc.text('• Desarrollar habilidades de análisis y resolución de problemas.');
    doc.text('• Fomentar el pensamiento crítico y creativo.');
    doc.moveDown();

    // Contenidos
    doc.fontSize(12).font('Helvetica-Bold').text('3. Contenidos Temáticos:');
    doc.fontSize(10).font('Helvetica');
    doc.text('Unidad 1: Fundamentos y Conceptos Básicos');
    doc.text('Unidad 2: Metodologías y Herramientas');
    doc.text('Unidad 3: Aplicaciones Prácticas');
    doc.text('Unidad 4: Proyectos Integradores');
    doc.moveDown();

    // Metodología
    doc.fontSize(12).font('Helvetica-Bold').text('4. Metodología:');
    doc.fontSize(10).font('Helvetica');
    doc.text('• Clases magistrales y exposiciones teóricas.');
    doc.text('• Laboratorios y prácticas guiadas.');
    doc.text('• Trabajos en grupo y proyectos.');
    doc.text('• Estudios de caso y resolución de problemas.');
    doc.moveDown();

    // Evaluación
    doc.fontSize(12).font('Helvetica-Bold').text('5. Sistema de Evaluación:');
    doc.fontSize(10).font('Helvetica');
    doc.text('• Primer Parcial: 25%');
    doc.text('• Segundo Parcial: 25%');
    doc.text('• Trabajos y Laboratorios: 30%');
    doc.text('• Proyecto Final: 20%');
    doc.moveDown();

    // Bibliografía
    doc.fontSize(12).font('Helvetica-Bold').text('6. Bibliografía:');
    doc.fontSize(10).font('Helvetica');
    doc.text('• Textos básicos y complementarios recomendados.');
    doc.text('• Recursos digitales y bases de datos académicas.');
    doc.text('• Artículos científicos y documentación técnica.');
    doc.moveDown();

    // Pie de página
    doc.fontSize(8).text('Unidades Tecnológicas de Santander - UTS', { align: 'center' });
    doc.text('Documento generado automáticamente por el Sistema de Gestión de Matrículas', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

// Generar todos los PDFs
async function generateAllPDFs() {
  try {
    console.log('📄 Generando PDFs de ejemplo...');
    
    // Generar malla curricular
    console.log('Generando malla curricular...');
    const curriculumPDF = await generateCurriculumPDF();
    console.log('✅ Malla curricular generada:', curriculumPDF);
    
    // Generar sílabos para las materias del seeder
    const subjects = [
      { code: 'IS101', name: 'Programación I', credits: 4, semester: 1 },
      { code: 'IS102', name: 'Estructuras de Datos', credits: 4, semester: 2 },
      { code: 'IS201', name: 'Bases de Datos', credits: 4, semester: 3 },
      { code: 'IS202', name: 'Ingeniería de Software', credits: 4, semester: 4 },
      { code: 'IS301', name: 'Inteligencia Artificial', credits: 4, semester: 5 },
      { code: 'EL101', name: 'Electiva: Emprendimiento', credits: 3, semester: 6 },
      { code: 'OP101', name: 'Optativa: Desarrollo Web', credits: 3, semester: 7 }
    ];

    for (const subject of subjects) {
      console.log(`Generando sílabo para ${subject.code}...`);
      const syllabusPDF = await generateSyllabusPDF(subject.code, subject.name, subject.credits, subject.semester);
      console.log(`✅ Sílabo generado: ${syllabusPDF}`);
    }

    console.log('🎉 Todos los PDFs han sido generados exitosamente');
    console.log('📁 Ubicación: carpeta uploads/');
    
  } catch (error) {
    console.error('❌ Error al generar PDFs:', error);
    process.exit(1);
  }
}

// Ejecutar generación
if (require.main === module) {
  generateAllPDFs();
}

module.exports = { generateCurriculumPDF, generateSyllabusPDF, generateAllPDFs };