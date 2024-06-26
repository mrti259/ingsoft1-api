import { Filter, PageProperty } from '../types';
import Property from './Property';

export default class RelationWithOneProperty extends Property<string> {
    protected _filter(value: string): Filter {
        return {
            property: this.name,
            relation: value ? { contains: value } : { is_empty: true },
        };
    }

    mapValue(value: string): PageProperty {
        return { relation: [{ id: value }] };
    }

    mapPageProperty(pageProperty: PageProperty): string | undefined {
        return pageProperty.relation?.[0]?.id;
    }
}
