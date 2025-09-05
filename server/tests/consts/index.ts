export const INJECTION_PAYLOADS = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '"><script>alert("xss")</script>',
];

export const TEST_BOARD = {
    board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    remaining: 300000,
    increment: 5000,
}
