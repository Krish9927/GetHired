// Built-in question bank — seed these into DB on first run
export const QUESTION_BANK = [
    // ── JavaScript ───────────────────────────────────────────────────────────────
    {
        text: "Which method is used to add an element to the end of an array in JavaScript?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctIndex: 0, topic: "JavaScript", difficulty: "easy",
        explanation: "push() adds one or more elements to the end of an array.",
    },
    {
        text: "What is the output of: typeof null?",
        options: ["null", "undefined", "object", "string"],
        correctIndex: 2, topic: "JavaScript", difficulty: "medium",
        explanation: "typeof null returns 'object' — a well-known JavaScript quirk.",
    },
    {
        text: "Which keyword is used to declare a block-scoped variable in JavaScript?",
        options: ["var", "let", "def", "int"],
        correctIndex: 1, topic: "JavaScript", difficulty: "easy",
        explanation: "let declares a block-scoped variable introduced in ES6.",
    },
    {
        text: "What does the '===' operator check in JavaScript?",
        options: ["Only value", "Only type", "Both value and type", "Neither"],
        correctIndex: 2, topic: "JavaScript", difficulty: "easy",
        explanation: "=== is strict equality — checks both value AND type.",
    },
    {
        text: "Which of the following is NOT a JavaScript data type?",
        options: ["Symbol", "Boolean", "Float", "BigInt"],
        correctIndex: 2, topic: "JavaScript", difficulty: "medium",
        explanation: "Float is not a JS type. Numbers in JS are all 'number' type.",
    },
    // ── React ────────────────────────────────────────────────────────────────────
    {
        text: "Which hook is used to manage state in a functional React component?",
        options: ["useEffect", "useState", "useContext", "useRef"],
        correctIndex: 1, topic: "React", difficulty: "easy",
        explanation: "useState is the primary hook for state management in functional components.",
    },
    {
        text: "What does useEffect with an empty dependency array [] do?",
        options: ["Runs on every render", "Runs only on unmount", "Runs only once after mount", "Never runs"],
        correctIndex: 2, topic: "React", difficulty: "medium",
        explanation: "Empty [] means the effect runs only once after the initial render.",
    },
    {
        text: "In React, what is the correct way to render a list of items?",
        options: ["Using for loops", "Using map() with a key prop", "Using forEach()", "Using while loops"],
        correctIndex: 1, topic: "React", difficulty: "easy",
        explanation: "map() with a unique key prop is the standard React way to render lists.",
    },
    // ── DSA ──────────────────────────────────────────────────────────────────────
    {
        text: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctIndex: 1, topic: "DSA", difficulty: "medium",
        explanation: "Binary search halves the search space each step, giving O(log n).",
    },
    {
        text: "Which data structure uses LIFO (Last In First Out)?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correctIndex: 1, topic: "DSA", difficulty: "easy",
        explanation: "A stack follows LIFO — the last element added is the first to be removed.",
    },
    {
        text: "What is the worst-case time complexity of bubble sort?",
        options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
        correctIndex: 2, topic: "DSA", difficulty: "medium",
        explanation: "Bubble sort has O(n²) in the worst case due to nested comparisons.",
    },
    {
        text: "Which traversal of a BST gives nodes in sorted order?",
        options: ["Preorder", "Postorder", "Inorder", "Level order"],
        correctIndex: 2, topic: "DSA", difficulty: "medium",
        explanation: "Inorder traversal (left → root → right) of a BST yields sorted order.",
    },
    // ── Python ───────────────────────────────────────────────────────────────────
    {
        text: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctIndex: 1, topic: "Python", difficulty: "easy",
        explanation: "def is the keyword for function definition in Python.",
    },
    {
        text: "What is the output of: len('hello')?",
        options: ["4", "5", "6", "Error"],
        correctIndex: 1, topic: "Python", difficulty: "easy",
        explanation: "len() returns the number of characters. 'hello' has 5 characters.",
    },
    {
        text: "Which of these is a mutable data structure in Python?",
        options: ["tuple", "string", "list", "frozenset"],
        correctIndex: 2, topic: "Python", difficulty: "medium",
        explanation: "Lists are mutable — they can be modified after creation.",
    },
    // ── System Design ────────────────────────────────────────────────────────────
    {
        text: "What does REST stand for?",
        options: ["Remote Execution Service Transfer", "Representational State Transfer", "Request-Response Socket Transfer", "Real-time Event Streaming Technology"],
        correctIndex: 1, topic: "System Design", difficulty: "medium",
        explanation: "REST = Representational State Transfer, an architectural style for APIs.",
    },
    {
        text: "Which HTTP status code means 'Not Found'?",
        options: ["200", "401", "404", "500"],
        correctIndex: 2, topic: "System Design", difficulty: "easy",
        explanation: "404 is the standard HTTP status code for 'Resource Not Found'.",
    },
    {
        text: "What is the purpose of an index in a database?",
        options: ["To encrypt data", "To speed up query performance", "To backup data", "To normalize tables"],
        correctIndex: 1, topic: "System Design", difficulty: "medium",
        explanation: "Indexes improve read query performance by allowing faster lookups.",
    },
    // ── Node.js ──────────────────────────────────────────────────────────────────
    {
        text: "Which module in Node.js is used to create an HTTP server?",
        options: ["fs", "http", "path", "os"],
        correctIndex: 1, topic: "Node.js", difficulty: "easy",
        explanation: "The 'http' module provides utilities to create HTTP servers.",
    },
    {
        text: "What is npm?",
        options: ["Node Programming Manager", "Node Package Manager", "Network Protocol Module", "Native Process Manager"],
        correctIndex: 1, topic: "Node.js", difficulty: "easy",
        explanation: "npm stands for Node Package Manager — used to install packages.",
    },
];

export const AVAILABLE_TOPICS = [...new Set(QUESTION_BANK.map((q) => q.topic))];
