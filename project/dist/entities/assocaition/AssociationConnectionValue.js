"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationConnectionValue = void 0;
const AssocaitionValue_1 = require("./AssocaitionValue");
class AssociationConnectionValue extends AssocaitionValue_1.AssociationValue {
    get() {
        return this.connection;
    }
    set(entityManager, record, association, value) {
        var _a, _b;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to ${association.field.fullName} because it's connection field`);
        }
        if (!Array.isArray(typeof value.edges)) {
            throw Error(`The connection object of ${association.field.fullName} must have an array field named "edges"`);
        }
        const oldMap = new Map();
        (_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.edges) === null || _b === void 0 ? void 0 : _b.forEach(edge => {
            oldMap.set(edge.node.id, edge.node);
        });
        const newIds = new Set();
        const newEdges = [];
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge of the connection object of ${association.field.fullName} must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge of the connection object of ${association.field.fullName} must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(association.field.targetType.name, edge.node.id);
            newEdges.push({
                node: newNode,
                cursor: edge.cursor
            });
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, record, association.field, element);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, record, association.field, newEdge.node);
            }
        }
        // TODO: Trigger
    }
    link(entityManager, self, association, target) {
        // TODO: link
    }
    unlink(entityManager, self, association, target) {
        // TODO: link
    }
}
exports.AssociationConnectionValue = AssociationConnectionValue;
