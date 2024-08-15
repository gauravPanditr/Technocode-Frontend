// src/types/problem.types.ts
export type CodeStub = {
    language: string;
    startSnippet: string;
    endSnippet: string;
    userSnippet: string;
    id: string;
};

export type TestCase = {
    input: string;
    output: string;
    id: string;
};

export type ProblemData = {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    testCases: TestCase[];
    codeStubs: CodeStub[];
};

