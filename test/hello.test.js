"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
test('hello returns Hello, world!', () => {
    expect((0, index_1.hello)()).toBe('Hello, world!');
});
