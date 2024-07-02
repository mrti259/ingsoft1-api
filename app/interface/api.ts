import { Client } from '@notionhq/client';
import axios from 'axios';

import { getContentFromBlock } from '../persistance/notion/blocks';
import { Assigner, Assignment, Config } from '../system/assigner';
import { Mailer } from '../system/mailer';
import { MailExamFeedback, MailExerciseFeedback, MailSummaryFeedback } from '../system/mailer';
import { Request } from './request';
import { Response } from './response';

type Handler = (params: unknown) => Promise<Response>;

export class Api {
    constructor(
        private _services: {
            mailer: Mailer;
            assigner: Assigner;
        },
    ) {}

    sendSummaryFeedbackHandler: Handler = async (params) => {
        try {
            const request = new Request(params);
            var { to, context }: MailSummaryFeedback = {
                to: request.parseString('to'),
                context: {
                    nombre: request.parseString('student.full_name'),
                    ejercicios: request.parseString('summary.ejercicios'), // TODO: parsear a array
                    nota_cursada_final: request.parseString('summary.grade_final_completed'),
                    promedio_ejercicios: request.parseString('summary.prom_ej'),
                    promedio_ej_primer_parcial: request.parseString('summary.prom_ej_1p'),
                    primer_parcial: request.parseString('summary.fist_parcial'),
                    segundo_parcial: request.parseString('summary.second_parcial_papers'),
                    primer_recu: request.parseString('summary.first_recu_papers'),
                    condicion_final: request.parseString('summary.final_condition'),
                    punto_adicional: request.parseString('summary.extra_point'),
                    nota_cursada: request.parseString('summary.grade_completed'),
                    segundo_recu: request.parseString('summary.second_recu'),
                },
            };
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            await this._services.mailer.sendSummaryFeedback(context, to);
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(`Correo enviado a ${to}`);
    };

    sendExerciseFeedbackHandler: Handler = async (params) => {
        try {
            const request = new Request(params);
            var { to, context }: MailExerciseFeedback = {
                to: request.parseString('to'),
                context: {
                    ejercicio: request.parseString('context.ejercicio'),
                    grupo: request.parseString('context.grupo'),
                    corrector: request.parseString('context.corrector'),
                    nota: request.parseString('context.nota'),
                    correcciones: request.parseString('context.correcciones'),
                },
            };
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            await this._services.mailer.sendExerciseFeedback(context, to);
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(`Correo enviado a ${to}`);
    };

    sendExamFeedbackHandler: Handler = async (params) => {
        try {
            const request = new Request(params);
            var { to, context }: MailExamFeedback = {
                to: request.parseString('to'),
                context: {
                    examen: request.parseString('context.examen'),
                    padron: request.parseString('context.padron'),
                    nombre: request.parseString('context.nombre'),
                    corrector: request.parseString('context.corrector'),
                    nota: request.parseString('context.nota'),
                    correcciones: request.parseString('context.correcciones'),
                    nota_final: request.parseString('context.nota_final'),
                    puntos_extras: request.parseString('context.puntos_extras'),
                },
            };
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            await this._services.mailer.sendExamFeedback(context, to);
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(`Correo enviado a ${to}`);
    };

    assignExerciseHandler: Handler = async (params) => {
        try {
            var { config, asignaciones } = this._parseAssignRequest(params);
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            await this._services.assigner.assignExercise(config, asignaciones);
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(`Fin asignación de ejercicio`);
    };

    assignExamHandler: Handler = async (params) => {
        try {
            var { config, asignaciones } = this._parseAssignRequest(params);
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            await this._services.assigner.assignExam(config, asignaciones);
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(`Fin asignación de examen`);
    };

    getExerciseFeedbacksHandler: Handler = async (params) => {
        try {
            var { config, ejercicio } = this._parseGetFeedbackRequest(params);
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            var feedbacks = await this._services.assigner.getExerciseFeedbacks(
                config,
                ejercicio,
            );
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(JSON.stringify(feedbacks));
    };

    getExamFeedbacksHandler: Handler = async (params) => {
        try {
            var { config, ejercicio } = this._parseGetFeedbackRequest(params);
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            var feedbacks = await this._services.assigner.getExamFeedbacks(
                config,
                ejercicio,
            );
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(JSON.stringify(feedbacks));
    };

    getContentFromPageHandler: Handler = async (params) => {
        try {
            const request = new Request(params);
            var token = request.parseString('notion.token');
            var blockId = request.parseString('page_id');
        } catch (error) {
            return Response.badRequest(String(error));
        }
        try {
            var content = await getContentFromBlock(
                new Client({ auth: token }),
                blockId,
            );
        } catch (error) {
            return Response.error(String(error));
        }
        return Response.ok(content);
    };

    getTeachersEmailsHandler: Handler = async () => {
        const source =
            'https://raw.githubusercontent.com/Ingenieria-de-software-I/ingenieria-de-software-i.github.io/main/_data/docentes.json';
        const results: Array<{ email?: string }> = await axios
            .get(source, {})
            .then((res) => res.data);
        const emails = results
            .map((d) => d.email)
            .filter(Boolean)
            .join(', ');
        return Response.ok(emails);
    };

    testHandler: Handler = async () => {
        return Response.ok('OK');
    };

    private _parseNotionConfig(request: Request): Config {
        return {
            notion: {
                token: request.parseString('config.notion.token'),
                db_devolucion: request.parseString(
                    'config.notion.db_devolucion',
                ),
                db_docente: request.parseString('config.notion.db_docente'),
                db_ejercicio: request.parseString('config.notion.db_ejercicio'),
            },
        };
    }

    private _parseAssignRequest(params: unknown): {
        config: Config;
        asignaciones: Array<Assignment>;
    } {
        const request = new Request(params);
        const config = this._parseNotionConfig(request);
        const asignaciones: Array<Assignment> = request.map(
            'asignaciones',
            (req) => ({
                docentes: req.map('docentes', (req) =>
                    req.parseString('toString()'),
                ),
                ejercicio: req.parseString('ejercicio'),
                nombre: req.parseString('nombre'),
            }),
        );
        return { config, asignaciones };
    }

    private _parseGetFeedbackRequest(params: unknown): {
        config: Config;
        ejercicio: string;
    } {
        const request = new Request(params);
        const config = this._parseNotionConfig(request);
        const ejercicio = request.parseString('ejercicio');
        return { config, ejercicio };
    }
}
