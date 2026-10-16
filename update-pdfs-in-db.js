const { sequelize } = require('./src/whatever/Config/database');
const { models } = require('./src/Model');
const { Curriculum, Subject } = models;
const path = require('path');

const updatePDFsInDatabase = async () => {
  try {
    console.log('🔄 Actualizando base de datos con PDFs generados...');
    
    // Obtener el directorio actual
    const currentDir = __dirname;
    const uploadsDir = path.join(currentDir, 'uploads');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');
    
    // Actualizar malla curricular de Ingeniería de Sistemas
    const curriculum = await Curriculum.findOne({
      where: { 
        program: 'Ingeniería de Sistemas',
        is_active: true
      }
    });
    
    if (curriculum) {
      const curriculumPDFPath = path.join(uploadsDir, 'malla-ingenieria-sistemas.pdf');
      await curriculum.update({
        file_path: curriculumPDFPath,
        file_type: 'application/pdf',
        file_name: 'Malla Curricular - Ingeniería de Sistemas.pdf'
      });
      console.log('✅ Malla curricular actualizada con PDF');
    } else {
      console.log('⚠️ No se encontró malla curricular de Ingeniería de Sistemas');
    }
    
    // Actualizar materias con sus sílabos
    const subjectsData = [
      { code: 'IS101', pdf: 'silabo-IS101.pdf', name: 'Sílabo - Programación I.pdf' },
      { code: 'IS102', pdf: 'silabo-IS102.pdf', name: 'Sílabo - Estructuras de Datos.pdf' },
      { code: 'IS201', pdf: 'silabo-IS201.pdf', name: 'Sílabo - Bases de Datos.pdf' },
      { code: 'IS202', pdf: 'silabo-IS202.pdf', name: 'Sílabo - Ingeniería de Software.pdf' },
      { code: 'IS301', pdf: 'silabo-IS301.pdf', name: 'Sílabo - Inteligencia Artificial.pdf' },
      { code: 'EL101', pdf: 'silabo-EL101.pdf', name: 'Sílabo - Emprendimiento.pdf' },
      { code: 'OP101', pdf: 'silabo-OP101.pdf', name: 'Sílabo - Desarrollo Web.pdf' }
    ];
    
    for (const subjectData of subjectsData) {
      const subject = await Subject.findOne({
        where: { code: subjectData.code }
      });
      
      if (subject) {
        const subjectPDFPath = path.join(uploadsDir, subjectData.pdf);
        await subject.update({
          file_path: subjectPDFPath,
          file_type: 'application/pdf',
          file_name: subjectData.name
        });
        console.log(`✅ Materia ${subjectData.code} actualizada con PDF`);
      } else {
        console.log(`⚠️ No se encontró materia con código ${subjectData.code}`);
      }
    }
    
    console.log('🎉 Base de datos actualizada exitosamente');
    console.log('');
    console.log('📋 Resumen de PDFs asociados:');
    console.log('=====================================');
    console.log('📄 Malla Curricular: Ingeniería de Sistemas');
    console.log('📄 Sílabos: 7 materias');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Error al actualizar base de datos:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar actualización
if (require.main === module) {
  updatePDFsInDatabase();
}

module.exports = updatePDFsInDatabase;