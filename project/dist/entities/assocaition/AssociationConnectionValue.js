"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationConnectionValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
const util_1 = require("./util");
class AssociationConnectionValue extends AssocaitionValue_1.AssociationValue {
    getAsObject() {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        return Object.assign(Object.assign({}, this.connection), { edges: this.connection.edges.map(edge => {
                return Object.assign(Object.assign({}, edge), { node: Record_1.objectWithOnlyId(edge.node) });
            }) });
    }
    get() {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
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
        const position = this.association.field.associationProperties.position;
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge object for the connection "${association.field.fullName}" must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge object for the connection "${association.field.fullName}" must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(association.field.targetType.name, edge.node.id);
            newIds.add(newNode.id);
            try {
                appendTo(newEdges, newNode, edge.cursor, position);
            }
            catch (ex) {
                if (!ex[" $evict"]) {
                    throw ex;
                }
                this.evict(entityManager);
                return;
            }
        }
        for (const [id, node] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, node);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        this.ids = newIds;
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, newEdge.node);
            }
        }
        entityManager.modificationContext.set(this.association.record, association.field.name, this.args, oldValueForTriggger, this.getAsObject());
    }
    link(entityManager, target) {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const nodeMap = toNodeMap(edges);
        const linkMap = util_1.toRecordMap(Array.isArray(target) ? target : [target]);
        const position = this.association.field.associationProperties.position;
        for (const record of linkMap.values()) {
            if (!nodeMap.has(record.id)) {
                try {
                    appendTo(edges, record, undefined, position);
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
    unlink(entityManager, target) {
        if (this.connection === undefined) {
            throw new Error("Internal bug: connection cannot be undefined");
        }
        const edges = [...this.connection.edges];
        const elementMap = toNodeMap(edges);
        const unlinkMap = util_1.toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = edges.findIndex(edge => edge.node.id === record.id);
                edges.splice(index, 1);
            }
        }
        if (edges.length !== this.connection.edges.length) {
            this.association.set(entityManager, this.args, Object.assign(Object.assign({}, this.connection), { edges }));
        }
    }
    contains(target) {
        var _a;
        return ((_a = this.ids) === null || _a === void 0 ? void 0 : _a.has(target.id)) === true;
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
function toNodeMap(edges) {
    const map = new Map();
    for (const edge of edges) {
        map.set(edge.node.id, edge.node);
    }
    return map;
}
function appendTo(newEdges, newNode, newCursor, position) {
    var _a;
    const pos = newEdges.length === 0 ?
        0 :
        position(newNode.toRow(), newEdges.map(e => e.node.toRow()), (_a = this.args) === null || _a === void 0 ? void 0 : _a.variables);
    if (pos === undefined) {
        throw { " $evict": true };
    }
    const index = pos === "start" ? 0 : pos === "end" ? newEdges.length : pos;
    const cursor = newCursor !== null && newCursor !== void 0 ? newCursor : "";
    if (index >= newEdges.length) {
        newEdges.push({ node: newNode, cursor });
    }
    else {
        newEdges.splice(Math.max(0, index), 0, { node: newNode, cursor });
    }
}
