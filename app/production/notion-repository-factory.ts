import { Client } from '@notionhq/client';
import {
    Database,
    Identificable,
    RelationWithManyProperty,
    RelationWithOneProperty,
    Schema,
    TitleProperty,
} from 'dbotion';

import {
    Assignment,
    Config,
    Exercise,
    Feedback,
    Repository,
    RepositoryFactory,
    Teacher,
} from '../services/assigner.js';

export class NotionRepositoryFactory implements RepositoryFactory {
    forExercise(config: Config): Repository {
        return this._repositoryForFeedbacks(config, exerciseFeedbackSchema);
    }

    forExam(config: Config): Repository {
        return this._repositoryForFeedbacks(config, examFeedbackSchema);
    }

    private _repositoryForFeedbacks(
        config: Config,
        feedbackSchema: Schema<Feedback>,
    ): Repository {
        const client = new Client({ auth: config.notion.token });
        return new NotionRepository({
            exercises: new Database(
                client,
                config.notion.db_ejercicio,
                exerciseSchema,
            ),
            teachers: new Database(
                client,
                config.notion.db_docente,
                teacherSchema,
            ),
            feedbacks: new Database(
                client,
                config.notion.db_devolucion,
                feedbackSchema,
            ),
        });
    }
}

class NotionRepository implements Repository {
    constructor(
        private _databases: {
            exercises: Database<Exercise>;
            teachers: Database<Teacher>;
            feedbacks: Database<Feedback>;
        },
    ) {}

    getExercisesFrom(
        assignments: Assignment[],
    ): Promise<Identificable<Exercise>[]> {
        return this._databases.exercises.query({
            nombre: assignments.map((assignment) => assignment.ejercicio),
        });
    }

    getTeachersFrom(
        assignments: Assignment[],
    ): Promise<Identificable<Teacher>[]> {
        return this._databases.teachers.query({
            nombre: assignments.flatMap((assignment) => assignment.docentes),
        });
    }

    getFeedbacksFrom(
        exercises: Identificable<Exercise>[],
    ): Promise<Identificable<Feedback>[]> {
        return this._databases.feedbacks.query({
            id_ejercicio: exercises.map((exercise) => exercise.id),
        });
    }

    createFeedbacks(feedbacks: Feedback[]): Promise<Identificable<Feedback>[]> {
        return this._databases.feedbacks.create(feedbacks);
    }

    updateFeedbacks(
        feedbacks: Identificable<Feedback>[],
    ): Promise<Identificable<Feedback>[]> {
        return this._databases.feedbacks.update(feedbacks);
    }
}

const exerciseSchema = new Schema<Exercise>({
    nombre: new TitleProperty('Nombre'),
});

const teacherSchema = new Schema<Teacher>({
    nombre: new TitleProperty('Nombre'),
});

const exerciseFeedbackSchema = new Schema<Feedback>({
    nombre: new TitleProperty('Nombre'),
    id_docentes: new RelationWithManyProperty('Corrector'),
    id_ejercicio: new RelationWithOneProperty('Ejercicio'),
});

const examFeedbackSchema = new Schema<Feedback>({
    nombre: new TitleProperty('Nombre'),
    id_docentes: new RelationWithManyProperty('Corrector'),
    id_ejercicio: new RelationWithOneProperty('Examen'),
});
