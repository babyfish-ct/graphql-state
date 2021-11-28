import { FlatRow } from "../..";
import { PositionType } from "../../meta/Configuration";
import { EntityManager } from "../EntityManager";
import { GRAPHQL_STATE_PAGINATION_INFO } from "../PaginationFetcherProcessor";
import { Pagination, PaginationInfo } from "../QueryArgs";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { positionToIndex, toRecordMap } from "./util";
import { ConnectionRange } from "../../meta/Configuration";

export class AssociationConnectionValue extends AssociationValue {

    private connection?: RecordConnection;

    private indexMap?: Map<any, number>;

    getAsObject(): ObjectConnection | undefined {
        if (this.connection === undefined) {
            return undefined;
        }
        return {
            ...this.connection,
            edges: this.connection.edges.map(edge => {
                return {
                    ...edge,
                    node: objectWithOnlyId(edge.node)
                };
            })
        };
    }

    get(): RecordConnection {
        return this.connection ?? { edges: [] };
    }

    set(
        entityManager: EntityManager, 
        value: ObjectConnection,
        pagination?: Pagination
    ) {
        const oldValueForTriggger = this.getAsObject();
        const oldIndexMap = this.indexMap;
        const arr = this.newValue(entityManager, value, pagination);
        if (arr === undefined) {
            return;
        }
        const [newEdges, newIndexMap] = arr;

        if (this.connection !== undefined) {
            for (const oldEdge of this.connection.edges) {
                if (!newIndexMap.has(oldEdge.node.id)) {
                    this.releaseOldReference(entityManager, oldEdge.node);
                }
            }
        }
        
        this.connection = {
            ...value,
            edges: newEdges
        };
        this.indexMap = newIndexMap.size !== 0 ? newIndexMap : undefined;
        
        for (const newEdge of newEdges) {
            if (oldIndexMap?.has(newEdge.node.id) !== true) {
                this.retainNewReference(entityManager, newEdge.node);
            }
        }

        entityManager.modificationContext.set(
            this.association.record, 
            this.association.field.name, 
            this.args, 
            oldValueForTriggger, 
            this.getAsObject()
        );
    }

    private newValue(
        entityManager: EntityManager,
        value: ObjectConnection, 
        pagination?: Pagination
    ): [ReadonlyArray<RecordEdge>, Map<any, number>] | undefined {

        let loadMode: "initial" | "next" | "previous" = "initial";
        if (pagination?.connName === this.association.field.name) {
            const variables = this.args?.variables ?? {};
            const paginationInfo = variables[GRAPHQL_STATE_PAGINATION_INFO] as PaginationInfo | undefined;
            if (paginationInfo !== undefined && 
                pagination.windowId === paginationInfo.windowId &&
                pagination.style === paginationInfo.style &&
                pagination.initialSize === paginationInfo.initialSize
            ) {
                loadMode = pagination.loadMode;
            }
        }

        const connection = value ?? { edges: [] };
        const association = this.association;
        const idFieldName = association.field.targetType!.idField.name;

        this.validate(connection);
        if (loadMode === "initial" && this.valueEquals(connection)) {
            return undefined;
        }
        
        const oldEdges = this.connection?.edges ?? [];
        
        const newEdges: Array<RecordEdge> = [];
        const newIndexMap: Map<any, number> = new Map<any, number>();

        if (loadMode === "next") {
            for (const edge of oldEdges) {
                const node = edge.node;
                if (!newIndexMap.has(node.id)) {
                    newEdges.push({node, cursor: edge.cursor});
                    newIndexMap.set(node.id, newIndexMap.size);
                }
            }
        }
        for (let edge of connection.edges) {
            const node = edge.node;
            if (!newIndexMap.has(node.id)) {
                const recordNode = entityManager.saveId(
                    node["__typename"] ?? association.field.targetType!.name, 
                    node[idFieldName]
                );
                newEdges.push({node: recordNode, cursor: edge.cursor});
                newIndexMap.set(node.id, newIndexMap.size);
            }
        }
        if (loadMode === "previous") {
            for (const edge of oldEdges) {
                const node = edge.node;
                if (!newIndexMap.has(node.id)) {
                    newEdges.push({node, cursor: edge.cursor});
                    newIndexMap.set(node.id, newIndexMap.size);
                }
            }
        }
        return [newEdges, newIndexMap];
    }

    link(
        entityManager: EntityManager, 
        targets: ReadonlyArray<Record>
    ): void {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const indexMap = this.indexMap;
        const linkMap = toRecordMap(targets);
        const appender = new Appender(this);
        try {
            for (const record of linkMap.values()) {
                if (indexMap?.has(record.id) !== true) {
                    appender.appendTo(edges, record);
                }
            }
            if (edges.length !== this.connection.edges.length) {
                let newConnection: any = {
                    ...this.connection,
                    edges
                };
                this.standardizeValueForNewLink(newConnection);
                this.association.set(entityManager, this.args, newConnection);
            }
        } catch (ex) {
            if (!ex[" $evict"]) {
                throw ex;
            }
            this.evict(entityManager);
            return;
        }
    }

    unlink(
        entityManager: EntityManager, 
        targets: ReadonlyArray<Record>
    ) {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const indexMap = this.indexMap;
        const unlinkMap = toRecordMap(targets);
        for (const record of unlinkMap.values()) {
            const index = indexMap?.get(record.id);
            if (index !== undefined) {
                edges.splice(index, 1);
            }
        }
        try {
            if (edges.length !== this.connection.edges.length) {
                let newConnection: any = {
                    ...this.connection,
                    edges
                };
                this.standardizeValueForNewLink(newConnection);
                this.association.set(entityManager, this.args, newConnection);
            }
        } catch (ex) {
            if (!ex[" $evict"]) {
                throw ex;
            }
            this.evict(entityManager);
            return;
        }
    }

    private standardizeValueForNewLink(newConnection: any): void {
        if (this.args?.paginationInfo === undefined) {
            return;
        }
        const style = this.args.paginationInfo.style;
        if (style === "page") {
            throw { " $evict": true };
        }
        const changeRange = this.association.field.associationProperties?.range;
        if (changeRange === undefined) {
            throw { " $evict": true };
        }
        const oldConnection = this.connection!;
        let range: ConnectionRange = {
            endCursor: oldConnection.pageInfo!.endCursor 
        };
        for (const key in newConnection) {
            if (key !== "edges" && key !== "pageInfo") {
                range[key] = newConnection[key];
            }
        }
        changeRange(range, newConnection.edges.length - oldConnection.edges.length, style);
        if (range["pageInfo"] || range["edges"]) {
            throw new Error(
                `User optimizer "${this.association.field.fullName}.associationProperties.range" ` +
                `cannot set 'pageInfo' and 'edges' of its argument`
            );
        }
        for (const key in range) {
            if (key !== "startCursor" && key !== "endCursor") {
                newConnection[key] = range[key];
            }
        }
        newConnection.pageInfo = {
            ...newConnection.pageInfo,
            endCursor: range.endCursor
        }
    }

    contains(target: Record): boolean {
        return this.indexMap?.has(target.id) === true;
    }

    protected reorder(entityManager: EntityManager, target: Record) {
        const index = this.indexMap?.get(target.id);
        if (index === undefined) {
            throw new Error("Internal bug: cannot non-existing record");
        }
        if (this.connection?.edges!.length === 1) {
            return;
        }
        const newEdeges = [...this.connection!.edges!];
        newEdeges.splice(index, 1);
        try {
            const newIndex = new Appender(this).appendTo(newEdeges, target);
            if (newIndex !== index) {
                let newConnection: any = {
                    ...this.connection,
                    edges: newEdeges
                };
                this.standardizeValueForNewLink(newConnection);
                this.set(entityManager, newConnection);
            }
        } catch (ex) {
            if (!ex[" $evict"]) {
                throw ex;
            }
            this.evict(entityManager);
            return;
        }
    }

    private validate(value: ObjectConnection) {
        const association = this.association;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to "${association.field.fullName}" because it's connection field`);
        }
        if (value.pageInfo !== undefined) {
            if (typeof value.pageInfo !== 'object') {
                throw Error(`The connection object of "${association.field.fullName}" must have an object field named "pageInfo"`);
            }
            if (typeof value.pageInfo.startCursor !== 'string') {
                console.log(value);
                throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "startCursor"`);
            }
            if (typeof value.pageInfo.endCursor !== 'string') {
                throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "endCursor"`);
            }
        }
        if (!Array.isArray(value.edges)) {
            throw Error(`The connection object of "${association.field.fullName}" must have an array field named "edges"`);
        }
        const idFieldName = association.field.targetType!.idField.name;
        for (const edge of value.edges) {
            if (edge === undefined || edge === null) {
                throw Error(`The array "${association.field.fullName}.edges" cannot contain undefined or null`);
            }
            if (value.cursor !== undefined && typeof edge.cursor !== "string") {
                throw Error(`The edge object in th array "${association.field.fullName}.edges" must support string field "cursor"`);
            }
            if (typeof edge.node !== "object") {
                throw Error(`The edge object in th array "${association.field.fullName}.edges" must support object field "node"`);
            }
            if (edge.node[idFieldName] === undefined || edge.node[idFieldName] === null) {
                throw Error(`The edge node object in th array "${association.field.fullName}.edges[].node" must support id field "${idFieldName}"`);
            }
        }
    }

    private valueEquals(
        newConnection: ObjectConnection
    ): boolean {
        const oldConnection = this.connection;
        if (oldConnection === undefined) {
            return false;
        }
        if (oldConnection.edges.length !== newConnection.edges.length) {
            return false;
        }
        const oldFields = new Set<string>();
        for (const name in oldConnection) {
            if (name !== "pageInfo" && name !== "edges") {
                oldFields.add(name);
                if (oldConnection[name] !== newConnection[name]) {
                    return false;
                }
            }
        }
        for (const name in newConnection) {
            if (name !== "pageInfo" && name !== "edges" && !oldFields.has(name)) {
                if (oldConnection[name] !== newConnection[name]) {
                    return false;
                }
            }
        }
        if (oldConnection.pageInfo?.hasNextPage !== newConnection.pageInfo?.hasNextPage ||
            oldConnection.pageInfo?.hasPreviousPage !== newConnection.pageInfo?.hasPreviousPage ||
            oldConnection.pageInfo?.startCursor !== newConnection.pageInfo?.startCursor ||
            oldConnection.pageInfo?.endCursor !== newConnection.pageInfo?.endCursor
        ) {
            return false;
        }
        const idFieldName = this.association.field.targetType!.idField.name;
        for (let i = oldConnection.edges.length - 1; i >= 0; --i) {
            const oldEdge = oldConnection.edges[i];
            const newEdge = newConnection.edges[i];
            if (oldEdge.cursor !== newEdge.cursor) {
                return false;
            }
            if (oldEdge.node.id !== newEdge.node[idFieldName]) {
                return false;
            }
        }
        return true;
    }
}

export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly pageInfo?: PageInfo;
    readonly [key: string]: any;
}

export interface RecordEdge {
    readonly node: Record;
    readonly cursor?: string;
}

export interface ObjectConnection {
    readonly edges: ReadonlyArray<ObjectEdge>;
    readonly pageInfo?: PageInfo;
    readonly [key: string]: any;
}

export interface ObjectEdge {
    readonly node: any;
    readonly cursor?: string;
}

export interface PageInfo {
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
    readonly startCursor: string;
    readonly endCursor: string;
}

class Appender {

    private position: (
        row: FlatRow<any>,
        rows: ReadonlyArray<FlatRow<any>>,
        paginationDirection?: "forward" | "backward",
        variables?: any
    ) => PositionType | undefined;

    private direction?: "forward" | "backward";

    private filterVariables?: any;

    private hasMore?: boolean;

    constructor(owner: AssociationConnectionValue) {
        this.position = owner.association.field.associationProperties!.position;
        const style = owner.args?.paginationInfo?.style;
        if (style === "forward") {
            this.direction = "forward";
            this.hasMore = owner.get().pageInfo?.hasNextPage;
        } else if (style === "backward") {
            this.direction = "backward";
            this.hasMore = owner.get().pageInfo?.hasPreviousPage;
        }
        this.filterVariables = owner.args?.filterVariables;
    }

    appendTo(
        newEdges: Array<RecordEdge>, 
        newNode: Record
    ): number {
        const pos = newEdges.length === 0 ? 
            0 : 
            this.position(
                newNode.toRow(), 
                newEdges.map(e => e.node.toRow()), 
                this.direction,
                this.filterVariables
            );
        if (pos === undefined) {
            throw { " $evict": true };
        }
        const index = positionToIndex(pos, newEdges.length);
        if (index === 0 && this.direction === "backward" && this.hasMore !== false) {
            throw { " $evict": true };
        }
        if (index === newEdges.length && this.direction === "forward" && this.hasMore !== false) {
            throw { " $evict": true };
        }
        const cursor = "";
        if (index === newEdges.length) {
            newEdges.push({node: newNode, cursor });
        } else {
            newEdges.splice(Math.max(0, index), 0, { node: newNode, cursor });
        }
        return index;
    }
}