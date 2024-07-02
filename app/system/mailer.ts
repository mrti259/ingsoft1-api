import { marked } from 'marked';
import { default as nunjucks } from 'nunjucks';

export type Options = {
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
};

export interface MailerClient {
    sendMail(to: string, options: Options): Promise<void>;
}

type ExerciseFeedbackContext = {
    ejercicio: string;
    grupo: string;
    corrector: string;
    nota: string;
    correcciones: string;
};

type ExamFeedbackContext = {
    examen: string;
    nombre: string;
    padron: string;
    corrector: string;
    correcciones: string;
    nota: string;
    puntos_extras: string;
    nota_final: string;
};

type Ejercicio = { 
    nota: string;
    nombre: string;
}

type SummaryFeedbackContext = {
    nombre: string;
    padron: string;
    ejercicios: Ejercicio[];
    nota_cursada_final: string;
    promedio_ejercicios: string;
    promedio_ej_primer_parcial: string;
    primer_parcial: string;
    segundo_parcial: string;
    primer_recu: string;
    condicion_final: string;
    punto_adicional: string;
    nota_cursada: string;
    segundo_recu: string;
};

type Mail<Context> = { to: string; context: Context };

export type MailExerciseFeedback = Mail<ExerciseFeedbackContext>;

export type MailExamFeedback = Mail<ExamFeedbackContext>;

export type MailSummaryFeedback = Mail<SummaryFeedbackContext>;

const env = nunjucks
    .configure('templates')
    .addFilter('md', marked.parse)
    .addFilter('as_grade_str', (grade) => {
        const grade_as_number = Number(grade);
        if (Number.isNaN(grade_as_number)) {
            return grade;
        }
        return grade_as_number.toFixed(2);
    });

export class Mailer {
    constructor(
        private _mailerClient: MailerClient,
        private _replyTo?: string,
    ) {}

    private async _sendMail(to: string, options: Options) {
        await this._mailerClient.sendMail(to, options);
    }

    private _render(name: string, context: object) {
        return env.render(name, context);
    }

    private _buildMailOptionsForExerciseFeedback(
        context: ExerciseFeedbackContext,
    ): Options {
        const subject = `Correción de ejercicio ${context.ejercicio} - Grupo ${context.grupo}`;
        const text = this._render(`emails/notas_ejercicio_plain.html`, context);
        const html = this._render(`emails/notas_ejercicio.html`, context);
        const replyTo = this._replyTo;
        return { subject, text, html, replyTo };
    }

    async sendExerciseFeedback(context: ExerciseFeedbackContext, to: string) {
        const options = this._buildMailOptionsForExerciseFeedback(context);
        await this._sendMail(to, options);
    }

    private _buildMailOptionsForExamFeedback(
        context: ExamFeedbackContext,
    ): Options {
        const subject = `Corrección de ${context.examen} - Padrón ${context.padron}`;
        const text = this._render(`emails/notas_examen_plain.html`, context);
        const html = this._render(`emails/notas_examen.html`, context);
        const replyTo = this._replyTo;
        return { subject, text, html, replyTo };
    }

    async sendExamFeedback(context: ExamFeedbackContext, to: string) {
        const options = this._buildMailOptionsForExamFeedback(context);
        await this._sendMail(to, options);
    }

    private _buildMailOptionsForSummaryFeedback(
        context: SummaryFeedbackContext,
    ): Options {
        const subject = `Resumen de cursada - Padrón ${context.padron}`;
        const text = this._render(`emails/notas_examen_plain.html`, context);
        const html = this._render(`emails/notas_examen.html`, context);
        const replyTo = this._replyTo;
        return { subject, text, html, replyTo };
    }

    async sendSummaryFeedback(context: SummaryFeedbackContext, to: string) {
        const options = this._buildMailOptionsForSummaryFeedback(context);
        await this._sendMail(to, options);
    }
}
