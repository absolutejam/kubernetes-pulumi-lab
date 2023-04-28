"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
const http_1 = __importDefault(require("k6/http"));
exports.options = {
    vus: 10,
    duration: '5s',
};
function default_1() {
    http_1.default.get('http://localhost:8090/production');
}
exports.default = default_1;
