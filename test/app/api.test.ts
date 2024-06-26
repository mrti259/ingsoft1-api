import { Api } from '../../app/interface/api';
import { Request } from '../../app/interface/request';
import { Response } from '../../app/interface/response';
import { Assigner } from '../../app/system/assigner';
import { Mailer } from '../../app/system/mailer';
import * as constants from '../constants';
import { MailerClientStub } from '../helpers/mailer-client-stub';
import { RepositoryFactoryStub } from '../helpers/repository-factory-stub';
import { assert, createTestSuite } from '../utils';

const [test, xtest] = createTestSuite('Api');

let api: Api;
let mailerClientStub: MailerClientStub;
let repositoryFactory: RepositoryFactoryStub;

test.before(() => {
    mailerClientStub = new MailerClientStub();
    repositoryFactory = new RepositoryFactoryStub();
    api = new Api({
        mailer: new Mailer(mailerClientStub),
        assigner: new Assigner(repositoryFactory),
    });
});

const assertCode = (res: Response, c: number) => assert.equal(res.code, c);
const assertBadResponse = (res: Response) => assertCode(res, 400);
const assertErrorResponse = (res: Response) => assertCode(res, 500);
const assertOkResponse = (res: Response) => assertCode(res, 200);

test('Parse request', () => {
    const params = {
        prueba: 'exito',
        data: {
            message: 'hi!',
        },
    };
    const request = new Request({ ...params });

    // Simple
    assert.equal(request.parseString('prueba'), 'exito');

    // Nested
    assert.equal(request.parseString('data.message'), 'hi!');

    // Missing
    const missingProperty = 'data.message_missing';
    assert.throws(() => request.parseString(missingProperty), {
        message: Request.missingPropertyErrorMessage(
            missingProperty,
            JSON.stringify(params),
        ),
    });

    const anotherMissingProperty = 'data_missing.message';
    assert.throws(() => request.parseString(anotherMissingProperty), {
        message: Request.missingPropertyErrorMessage(
            anotherMissingProperty,
            JSON.stringify(params),
        ),
    });
});

test('Send exercise feedback', async () => {
    const badResponse = await api.sendExerciseFeedbackHandler({});
    assertBadResponse(badResponse);

    const params = {
        to: 'to',
        context: {
            ejercicio: 'context.ejercicio',
            grupo: 'context.grupo',
            corrector: 'context.corrector',
            nota: 'context.nota',
            correcciones: 'context.correcciones',
        },
    };

    const errorResponse = await api.sendExerciseFeedbackHandler({
        ...params,
    });
    assertErrorResponse(errorResponse);

    mailerClientStub.changeBehaviour(async () => {});
    const okResponse = await api.sendExerciseFeedbackHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Send exam feedback', async () => {
    const badResponse = await api.sendExamFeedbackHandler({});
    assertBadResponse(badResponse);

    const params = {
        to: 'to',
        context: {
            examen: 'context.examen',
            padron: 'context.padron',
            nombre: 'context.nombre',
            corrector: 'context.corrector',
            nota: 'context.nota',
            correcciones: 'context.correcciones',
            nota_final: 'context.nota_final',
            puntos_extras: 'context.puntos_extras',
        },
    };

    const errorResponse = await api.sendExamFeedbackHandler({ ...params });
    assertErrorResponse(errorResponse);

    mailerClientStub.changeBehaviour(async () => {});
    const okResponse = await api.sendExamFeedbackHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Assign exercise', async () => {
    const badResponse = await api.assignExerciseHandler({});
    assertBadResponse(badResponse);

    const config = {
        notion: {
            token: 'notion.token',
            db_devolucion: 'notion.db_devolucion',
            db_docente: 'notion.db_docente',
            db_ejercicio: 'notion.db_ejercicio',
        },
    };
    const asignaciones = [
        {
            docentes: ['docente 1', 'docente 2'],
            ejercicio: 'ejercicio 1',
            nombre: 'grupo 1',
        },
    ];
    const params = { config, asignaciones };

    const errorResponse = await api.assignExerciseHandler({ ...params });
    assertErrorResponse(errorResponse);

    repositoryFactory.changeBehaviour({
        getExercisesFrom(assigments) {
            return Promise.resolve([]);
        },
        getTeachersFrom(assignments) {
            return Promise.resolve([]);
        },
        getFeedbacksFrom(exercises) {
            return Promise.resolve([]);
        },
        createFeedbacks(feedbacks) {
            return Promise.resolve([]);
        },
        updateFeedbacks(feedbacks) {
            return Promise.resolve([]);
        },
    });
    const okResponse = await api.assignExerciseHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Assign exam', async () => {
    const badResponse = await api.assignExamHandler({});
    assertBadResponse(badResponse);

    const config = {
        notion: {
            token: 'notion.token',
            db_devolucion: 'notion.db_devolucion',
            db_docente: 'notion.db_docente',
            db_ejercicio: 'notion.db_ejercicio',
        },
    };
    const asignaciones = [
        {
            docentes: ['docente 1', 'docente 2'],
            ejercicio: 'examen 1',
            nombre: 'estudiante 1',
        },
    ];
    const params = { config, asignaciones };

    const errorResponse = await api.assignExamHandler({ ...params });
    assertErrorResponse(errorResponse);

    repositoryFactory.changeBehaviour({
        getExercisesFrom(assigments) {
            return Promise.resolve([]);
        },
        getTeachersFrom(assignments) {
            return Promise.resolve([]);
        },
        getFeedbacksFrom(exercises) {
            return Promise.resolve([]);
        },
        createFeedbacks(feedbacks) {
            return Promise.resolve([]);
        },
        updateFeedbacks(feedbacks) {
            return Promise.resolve([]);
        },
    });
    const okResponse = await api.assignExamHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Get exercise feedbacks', async () => {
    const badResponse = await api.getExerciseFeedbacksHandler({});
    assertBadResponse(badResponse);

    const config = {
        notion: {
            token: 'notion.token',
            db_devolucion: 'notion.db_devolucion',
            db_docente: 'notion.db_docente',
            db_ejercicio: 'notion.db_ejercicio',
        },
    };
    const ejercicio = 'ejercicio 1';
    const params = { config, ejercicio };
    const errorResponse = await api.getExerciseFeedbacksHandler({ ...params });
    assertErrorResponse(errorResponse);

    repositoryFactory.changeBehaviour({
        getExercisesFrom(assigments) {
            return Promise.resolve([{ id: '1', nombre: ejercicio }]);
        },
        getFeedbacksFrom(exercises) {
            return Promise.resolve([
                {
                    id: '1',
                    nombre: 'grupo 1',
                    id_ejercicio: '1',
                    id_docentes: [],
                },
            ]);
        },
    });
    const okResponse = await api.getExerciseFeedbacksHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Get exam feedbacks', async () => {
    const badResponse = await api.getExamFeedbacksHandler({});
    assertBadResponse(badResponse);

    const config = {
        notion: {
            token: 'notion.token',
            db_devolucion: 'notion.db_devolucion',
            db_docente: 'notion.db_docente',
            db_ejercicio: 'notion.db_ejercicio',
        },
    };
    const ejercicio = 'examen 1';
    const params = { config, ejercicio };
    const errorResponse = await api.getExamFeedbacksHandler({ ...params });
    assertErrorResponse(errorResponse);

    repositoryFactory.changeBehaviour({
        getExercisesFrom(assigments) {
            return Promise.resolve([{ id: '1', nombre: ejercicio }]);
        },
        getFeedbacksFrom(exercises) {
            return Promise.resolve([
                {
                    id: '1',
                    nombre: 'alumno 1',
                    id_ejercicio: '1',
                    id_docentes: [],
                },
            ]);
        },
    });
    const okResponse = await api.getExamFeedbacksHandler({ ...params });
    assertOkResponse(okResponse);
});

test('Get content from page', async () => {
    const response = await api.getContentFromPageHandler({
        notion: {
            token: constants.TEST_NOTION_TOKEN,
        },
        page_id: constants.TEST_NOTION_BLOCK_ID,
    });
    //assertOkResponse(response);
    //assert(response.message.length > 0);
});

test("Get teachers' emails", async () => {
    const okResponse = await api.getTeachersEmailsHandler({});
    assertOkResponse(okResponse);
    assert(okResponse.message.length > 0);
});
