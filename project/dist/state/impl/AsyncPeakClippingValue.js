"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncPeakClippingValue = void 0;
class AsyncPeakClippingValue {
    constructor() {
        this._invalid = true;
        this._executing = false;
        this._moreInvalidations = false;
    }
    invalidate() {
        if (!this._invalid) {
            if (this._executing) {
                this._moreInvalidations = true;
            }
            else {
                this.onInvalidate();
                this._invalid = true;
            }
        }
    }
    get promise() {
        if (this._invalid) {
            this._promise = this.execute();
            this._invalid = false;
        }
        return this._promise;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this._executing = true;
            try {
                return yield this.onExecute();
            }
            finally {
                this._executing = false;
                this.onComplete();
                if (this._moreInvalidations) {
                    console.log("more..............");
                }
            }
        });
    }
}
exports.AsyncPeakClippingValue = AsyncPeakClippingValue;
