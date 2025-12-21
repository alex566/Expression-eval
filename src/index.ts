export function hello(): string {
  return 'Hello, world!';
}

if (require.main === module) {
  console.log(hello());
}
