// Asignar examen
const asignarParcial1 = () => _assignExam(1);
const asignarParcial2 = () => _assignExam(2);

// Descargar devoluciones examen
const descargarDevolucionParcial1 = () => _extractExamFeedbacks(1);
const descargarDevolucionParcial2 = () => _extractExamFeedbacks(2);

// Enviar email
const enviarDevolucionParcial1 = () => _sendExamFeedbacks(1);
const enviarDevolucionParcial2 = () => _sendExamFeedbacks(2);

const exams = ['Parcial 1', 'Parcial 2'];

function _assignExam(examNumber) {
    const examName = exams[examNumber - 1];
    const teachersColumn = examNumber + 2;
    examFeedback.assign(examName, teachersColumn);
}

function _extractExamFeedbacks(examNumber) {
    const examName = exams[examNumber - 1];
    const feedbackColumn = examNumber + 2;
    examFeedback._extract(examName, feedbackColumn);
}

function _sendExamFeedbacks(examNumber) {
    const examName = exams[examNumber - 1];
}