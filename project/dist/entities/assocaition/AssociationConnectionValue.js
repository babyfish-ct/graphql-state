"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationConnectionValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
class AssociationConnectionValue extends AssocaitionValue_1.AssociationValue {
    getAsObject() {
        return Object.assign(Object.assign({}, this.connection), { edges: this.connection.edges.map(edge => {
                return Object.assign(Object.assign({}, edge), { node: Record_1.objectWithOnlyId(edge.node) });
            }) });
    }
    get() {
        return this.connection;
    }
    set(entityManager, value) {
        var _a, _b;
        const association = this.association;
        this.validate(value);
        if (this.valueEquals(value)) {
            return;
        }
        const oldValueForTriggger = this.getAsObject();
        const oldMap = new Map();
        (_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.edges) === null || _b === void 0 ? void 0 : _b.forEach(edge => {
            oldMap.set(edge.node.id, edge.node);
        });
        const newIds = new Set();
        const newEdges = [];
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge object for the connection "${association.field.fullName}" must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge object for the connection "${association.field.fullName}" must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(association.field.targetType.name, edge.node.id);
            newIds.add(newNode.id);
            newEdges.push({
                node: newNode,
                cursor: edge.cursor
            });
        }
        for (const [id, node] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, node);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, newEdge.node);
            }
        }
        entityManager.modificationContext.set(this.association.record, association.field.name, this.args, oldValueForTriggger, this.getAsObject());
    }
    link(entityManager, target) {
        // TODO: link
    }
    unlink(entityManager, target) {
        // TODO: link
    }
    contains(target) {
        // TODO: contains
        throw new Error();
    }
    validate(value) {
        const association = this.association;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to "${association.field.fullName}" because it's connection field`);
        }
        if (typeof value.pageInfo !== 'object') {
            throw Error(`The connection object of "${association.field.fullName}" must have an object field named "pageInfo"`);
        }
        if (typeof value.pageInfo.startCursor !== 'string') {
            throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "startCursor"`);
        }
        if (typeof value.pageInfo.endCursor !== 'string') {
            throw Error(`The pageInfo object of "${association.field.fullName}.pageInfo" must have string field named "endCursor"`);
        }
        if (!Array.isArray(typeof value.edges)) {
            throw Error(`The connection object of "${association.field.fullName}" must have an array field named "edges"`);
        }
        const idFieldName = association.field.targetType.idField.name;
        for (const edge of value.edges) {
            if (edge === undefined || edge === null) {
                throw Error(`The array "${association.field.fullName}.edges" cannot contain undefined or null`);
            }
            if (typeof edge.cursor !== "string") {
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
        if (oldConnection.pageInfo.hasNextPage !== newConnection.pageInfo.hasNextPage ||
            oldConnection.pageInfo.hasPreviousPage !== newConnection.pageInfo.hasPreviousPage ||
            oldConnection.pageInfo.startCursor !== newConnection.pageInfo.startCursor ||
            oldConnection.pageInfo.endCursor !== newConnection.pageInfo.endCursor) {
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
