"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationConnectionValue = void 0;
const PaginationFetcherProcessor_1 = require("../PaginationFetcherProcessor");
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
const util_1 = require("./util");
class AssociationConnectionValue extends AssocaitionValue_1.AssociationValue {
    getAsObject() {
        if (this.connection === undefined) {
            return undefined;
        }
        return Object.assign(Object.assign({}, this.connection), { edges: this.connection.edges.map(edge => {
                return Object.assign(Object.assign({}, edge), { node: Record_1.objectWithOnlyId(edge.node) });
            }) });
    }
    get() {
        var _a;
        return (_a = this.connection) !== null && _a !== void 0 ? _a : { edges: [] };
    }
    set(entityManager, value, pagination) {
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
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        this.indexMap = newIndexMap.size !== 0 ? newIndexMap : undefined;
        for (const newEdge of newEdges) {
            if ((oldIndexMap === null || oldIndexMap === void 0 ? void 0 : oldIndexMap.has(newEdge.node.id)) !== true) {
                this.retainNewReference(entityManager, newEdge.node);
            }
        }
        entityManager.modificationContext.set(this.association.record, this.association.field.name, this.args, oldValueForTriggger, this.getAsObject());
    }
    newValue(entityManager, value, pagination) {
        var _a, _b, _c, _d, _e;
        let loadMode = "initial";
        if ((pagination === null || pagination === void 0 ? void 0 : pagination.connName) === this.association.field.name) {
            const variables = (_b = (_a = this.args) === null || _a === void 0 ? void 0 : _a.variables) !== null && _b !== void 0 ? _b : {};
            const paginationInfo = variables[PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO];
            if (paginationInfo !== undefined &&
                pagination.windowId === paginationInfo.windowId &&
                pagination.style === paginationInfo.style &&
                pagination.initialSize === paginationInfo.initialSize) {
                loadMode = pagination.loadMode;
            }
        }
        const connection = value !== null && value !== void 0 ? value : { edges: [] };
        const association = this.association;
        const idFieldName = association.field.targetType.idField.name;
        this.validate(connection);
        if (loadMode === "initial" && this.valueEquals(connection)) {
            return undefined;
        }
        const oldEdges = (_d = (_c = this.connection) === null || _c === void 0 ? void 0 : _c.edges) !== null && _d !== void 0 ? _d : [];
        const newEdges = [];
        const newIndexMap = new Map();
        if (loadMode === "next") {
            for (const edge of oldEdges) {
                const node = edge.node;
                if (!newIndexMap.has(node.id)) {
                    newEdges.push({ node, cursor: edge.cursor });
                    newIndexMap.set(node.id, newIndexMap.size);
                }
            }
        }
        for (let edge of connection.edges) {
            const node = edge.node;
            if (!newIndexMap.has(node.id)) {
                const recordNode = entityManager.saveId((_e = node["__typename"]) !== null && _e !== void 0 ? _e : association.field.targetType.name, node[idFieldName]);
                newEdges.push({ node: recordNode, cursor: edge.cursor });
                newIndexMap.set(node.id, newIndexMap.size);
            }
        }
        if (loadMode === "previous") {
            for (const edge of oldEdges) {
                const node = edge.node;
                if (!newIndexMap.has(node.id)) {
                    newEdges.push({ node, cursor: edge.cursor });
                    newIndexMap.set(node.id, newIndexMap.size);
                }
            }
        }
        return [newEdges, newIndexMap];
    }
    link(entityManager, targets) {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const indexMap = this.indexMap;
        const linkMap = util_1.toRecordMap(targets);
        const appender = new Appender(this);
        for (const record of linkMap.values()) {
            if ((indexMap === null || indexMap === void 0 ? void 0 : indexMap.has(record.id)) !== true) {
                try {
                    appender.appendTo(edges, record);
                }
                catch (ex) {
                    if (!ex[" $evict"]) {
                        throw ex;
                    }
                    this.evict(entityManager);
                    return;
                }
            }
        }
        if (edges.length !== this.connection.edges.length) {
            this.association.set(entityManager, this.args, Object.assign(Object.assign({}, this.connection), { edges }));
        }
    }
    unlink(entityManager, targets) {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const indexMap = this.indexMap;
        const unlinkMap = util_1.toRecordMap(targets);
        for (const record of unlinkMap.values()) {
            const index = indexMap === null || indexMap === void 0 ? void 0 : indexMap.get(record.id);
            if (index !== undefined) {
                edges.splice(index, 1);
            }
        }
        if (edges.length !== this.connection.edges.length) {
            this.association.set(entityManager, this.args, Object.assign(Object.assign({}, this.connection), { edges }));
        }
    }
    contains(target) {
        var _a;
        return ((_a = this.indexMap) === null || _a === void 0 ? void 0 : _a.has(target.id)) === true;
    }
    validate(value) {
        const association = this.association;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to "${association.field.fullName}" because it's connection field`);
        }
        if (value.pageInfo !== undefined) {
            if (typeof value.pageInfo !== 'object') {
                throw Error(`The connection object of "${association.field.fullName}" must have an object field named "pageInfo"`);
            }
            if (typeof value.pageInfo.startCursor !== 'string') {
                throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "startCursor"`);
            }
            if (typeof value.pageInfo.endCursor !== 'string') {
                throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "endCursor"`);
            }
        }
        if (!Array.isArray(value.edges)) {
            throw Error(`The connection object of "${association.field.fullName}" must have an array field named "edges"`);
        }
        const idFieldName = association.field.targetType.idField.name;
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
    valueEquals(newConnection) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const oldConnection = this.connection;
        if (oldConnection === undefined) {
            return false;
        }
        if (oldConnection.edges.length !== newConnection.edges.length) {
            return false;
        }
        const oldFields = new Set();
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
        if (((_a = oldConnection.pageInfo) === null || _a === void 0 ? void 0 : _a.hasNextPage) !== ((_b = newConnection.pageInfo) === null || _b === void 0 ? void 0 : _b.hasNextPage) ||
            ((_c = oldConnection.pageInfo) === null || _c === void 0 ? void 0 : _c.hasPreviousPage) !== ((_d = newConnection.pageInfo) === null || _d === void 0 ? void 0 : _d.hasPreviousPage) ||
            ((_e = oldConnection.pageInfo) === null || _e === void 0 ? void 0 : _e.startCursor) !== ((_f = newConnection.pageInfo) === null || _f === void 0 ? void 0 : _f.startCursor) ||
            ((_g = oldConnection.pageInfo) === null || _g === void 0 ? void 0 : _g.endCursor) !== ((_h = newConnection.pageInfo) === null || _h === void 0 ? void 0 : _h.endCursor)) {
            return false;
        }
        const idFieldName = this.association.field.targetType.idField.name;
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
exports.AssociationConnectionValue = AssociationConnectionValue;
class Appender {
    constructor(owner) {
        var _a, _b, _c, _d;
        this.position = owner.association.field.associationProperties.position;
        this.ctx = {
            paginationInfo: (_a = owner.args) === null || _a === void 0 ? void 0 : _a.paginationInfo,
            variables: (_b = owner.args) === null || _b === void 0 ? void 0 : _b.filterArgs
        };
        this.paginationStyle = (_d = (_c = owner.args) === null || _c === void 0 ? void 0 : _c.paginationInfo) === null || _d === void 0 ? void 0 : _d.style;
    }
    appendTo(newEdges, newNode) {
        const pos = newEdges.length === 0 ?
            0 :
            this.position(newNode.toRow(), newEdges.map(e => e.node.toRow()), this.ctx);
        if (pos === undefined) {
            throw { " $evict": true };
        }
        const index = pos === "start" ? 0 : pos === "end" ? newEdges.length : pos;
        if (index <= 0 && this.paginationStyle === "backward") {
            throw { " $evict": true };
        }
        if (index >= newEdges.length && this.paginationStyle === "forward") {
            throw { " $evict": true };
        }
        const cursor = "";
        if (index >= newEdges.length) {
            newEdges.push({ node: newNode, cursor });
        }
        else {
            newEdges.splice(Math.max(0, index), 0, { node: newNode, cursor });
        }
    }
}
