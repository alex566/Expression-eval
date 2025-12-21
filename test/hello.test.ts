import { hello } from '../src/index';

test('hello returns Hello, world!', () => {
  expect(hello()).toBe('Hello, world!');
});
