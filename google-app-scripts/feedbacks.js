const EMAIL_DOCENTES = 'fiuba-ingsoft1-doc@googlegroups.com';
const NOMBRE_EMISOR = 'Docentes IS1 - Leveroni';

class Feedbacks {
  constructor(api, correctorsRange, feedbacksRange, notion) {
    this._api = api;
    this._correctorsRange = correctorsRange;
    this._feedbacksRange = feedbacksRange;
    this._config = { notion };

    this._correctorsOffset = 0;
    this._gradeOffset = 1;
    this._detailsOffset = 2;
    this._sentOffset = 3;
    this._sentLabel = 'YES';
    this._initialize();
  }

  _initialize() {}

  //#region Main protocol

  assign(exerciseName, correctorsColumn) {
    askForConfirmation(
      `¿Quiere cargar los correctores de ${exerciseName}?`,
      () => {
        const assignments = this._generateAssignments(
          exerciseName,
          correctorsColumn,
        );
        this._sendAssignments(this._config, assignments);
      },
    );
  }

  extract(exerciseName, feedbackColumn) {
    askForConfirmation(
      `¿Quiere descargar las correcciones de ${exerciseName}?`,
      () => {
        const rows = this._getRowsFromRange(this._feedbacksRange);
        const detailsOffset = feedbackColumn + this._detailsOffset;

        const response = this._getFeedbacks(this._config, exerciseName);
        const feedbacks = JSON.parse(response.getContentText());

        feedbacks.forEach((feedback) => {
          const row = rows.find(
            (row) => this._getAssignmentName(row) === feedback.nombre,
          );
          if (!row) return;
          const contentResponse = this._api.getContentFromPage(
            this._config.notion,
            feedback.id,
          );
          const content = contentResponse.getContentText();
          const detailsResponse = this._getEmailDetails(
            row,
            feedbackColumn,
            exerciseName,
            content,
          );
          const details = detailsResponse.getContentText();
          row[detailsOffset] = details;
        });

        this._updateColumnFromRange(this._feedbacksRange, rows, detailsOffset);
      },
    );
  }

  send(exerciseName, feedbackColumn) {
    askForConfirmation(
      `¿Quiere enviar las correcciones de ${exerciseName}?`,
      () => {
        const rows = this._getRowsFromRange(this._feedbacksRange);

        rows.forEach((row) => {
          const details = row[feedbackColumn + this._detailsOffset];
          if (!details) return;

          if (this._wasSent(row, feedbackColumn)) return;

          this._sendMail(details);
          this._markAsSent(row, feedbackColumn);
        });

        this._updateColumnFromRange(
          this._feedbacksRange,
          rows,
          feedbackColumn + this._sentOffset,
        );
      },
    );
  }

  //#endregion

  //#region Assignment

  _generateAssignments(exerciseName, correctorsColumn) {
    const rows = this._getRowsFromRange(this._correctorsRange);
    return rows.map((row) => ({
      nombre: this._getAssignmentName(row),
      docentes: this._splitNames(row[correctorsColumn]),
      ejercicio: exerciseName,
    }));
  }

  _getAssignmentName(row) {
    throw new Error('Subclass Responsibility');
  }

  _splitNames(names) {
    return names?.split(',').map((name) => name.trim()) || [];
  }

  _sendAssignments(config, assignments) {
    throw new Error('Subclass Responsibility');
  }

  //#endregion

  //#region Extraction

  _getFeedbacks(config, exerciseName) {
    throw new Error('Subclass Responsibility');
  }

  //#endregion

  //#region Mailing

  _wasSent(row, feedbackColumn) {
    return row[feedbackColumn + this._sentOffset] === this._sentLabel;
  }

  _markAsSent(row, feedbackColumn) {
    return (row[feedbackColumn + this._sentOffset] = this._sentLabel);
  }

  _getEmailDetails(row, feedbackColumn, exerciseName, content) {
    throw new Error('Subclass Responsibility');
  }

  _sendMail(details) {
    let { to, options } = JSON.parse(details);
    const { subject, text, html } = options;

    GmailApp.sendEmail(to, subject, text, {
      cc: EMAIL_DOCENTES,
      replyTo: EMAIL_DOCENTES,
      name: NOMBRE_EMISOR,
      htmlBody: html,
    });
  }

  //#endregion

  //#region Data Manipulation

  _getRowsFromRange(rangeName) {
    return SpreadsheetApp.getActiveSheet().getRange(rangeName).getValues();
  }

  _updateColumnFromRange(rangeName, rows, column) {
    const range = SpreadsheetApp.getActiveSheet().getRange(rangeName);
    const newRange = range.offset(0, column, range.getNumRows(), 1);
    const values = rows.map((row) => row.slice(column, column + 1));
    newRange.setValues(values);
  }

  //#endregion
}

class ExerciseFeedbacks extends Feedbacks {
  _initialize() {
    this._groupNumberCol = 0;
    this._emailsCol = 1;
  }

  _sendAssignments(config, assignments) {
    return this._api.assignExercise(config, assignments);
  }

  _getAssignmentName(row) {
    return `Grupo ${row[this._groupNumberCol]}`;
  }

  _getFeedbacks(config, exerciseName) {
    return this._api.getExerciseFeedbacks(config, exerciseName);
  }

  _getEmailDetails(row, feedbackColumn, exerciseName, content) {
    const to = row[this._emailsCol];
    const context = {
      ejercicio: exerciseName,
      grupo: row[this._groupNumberCol],
      corrector: row[feedbackColumn + this._correctorsOffset],
      nota: row[feedbackColumn + this._gradeOffset],
      correcciones: content,
    };
    return this._api.sendExerciseFeedback(to, context);
  }
}

class ExamFeedbacks extends Feedbacks {
  _initialize() {
    this._padronCol = 0;
    this._nameCol = 1;
    this._emailsCol = 2;
  }

  _sendAssignments(config, assignments) {
    return this._api.assignExam(config, assignments);
  }

  _getAssignmentName(row) {
    const padron = row[this._padronCol];
    const nombreCompleto = row[this._nameCol];
    return `${padron} - ${nombreCompleto}`;
  }

  _getFeedbacks(config, examName) {
    return this._api.getExamFeedbacks(config, examName);
  }

  _getEmailDetails(row, feedbackColumn, examName, content) {
    const to = row[this._emailsCol];
    const context = {
      examen: examName,
      nombre: row[this._nameCol],
      padron: row[this._padronCol],
      corrector: row[feedbackColumn + this._correctorsOffset],
      correcciones: content,
      nota: row[feedbackColumn + this._gradeOffset],
      puntos_extras: 0,
      nota_final: row[feedbackColumn + this._gradeOffset],
    };
    return this._api.sendExamFeedback(to, context);
  }
}
