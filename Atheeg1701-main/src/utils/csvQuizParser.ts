import { Test, TestLevel, Question } from '../types';

/**
 * Robust CSV parser that correctly handles:
 * - Commas inside quoted strings (e.g. "What is 2+2, and why?")
 * - Escaped double quotes ("")
 * - Windows (\r\n) and Unix (\n) line breaks
 * - Semicolon or comma delimiters
 */
export function parseCSVToRows(csvText: string): string[][] {
  const cleanText = csvText.trim().replace(/^\uFEFF/, ''); // Remove UTF-8 BOM if present
  if (!cleanText) return [];

  // Detect delimiter: comma vs semicolon
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        // Closing quote
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Filter out empty rows
  return rows.filter((row) => row.some((field) => field.length > 0));
}

export interface CSVParseResult {
  success: boolean;
  test: Test | null;
  totalQuestions: number;
  levelsCount: number;
  levelNames: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Normalizes header string to match standard column types
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Converts parsed CSV rows into a structured Test with dynamic TestLevels and Questions
 */
export function convertCSVToQuiz(
  csvText: string,
  options?: {
    customTitle?: string;
    customDescription?: string;
    customCode?: string;
    defaultTimePerQuestionMinutes?: number;
  }
): CSVParseResult {
  const rows = parseCSVToRows(csvText);

  if (rows.length < 2) {
    return {
      success: false,
      test: null,
      totalQuestions: 0,
      levelsCount: 0,
      levelNames: [],
      warnings: [],
      errors: ['The uploaded CSV file is empty or does not contain a header and data rows.']
    };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column index identification
  const findColumn = (...candidates: string[]): number => {
    for (const candidate of candidates) {
      const idx = normalizedHeaders.findIndex((h) => h.includes(candidate));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const levelIdx = findColumn('level', 'tier', 'stage', 'section', 'category');
  const levelTimeIdx = findColumn('leveltime', 'timelimit', 'duration', 'time');
  const questionIdx = findColumn('question', 'prompt', 'problem', 'text', 'query', 'q');
  
  // Option column indices
  let optAIdx = findColumn('optiona', 'option1', 'opta', 'choicea');
  let optBIdx = findColumn('optionb', 'option2', 'optb', 'choiceb');
  let optCIdx = findColumn('optionc', 'option3', 'optc', 'choicec');
  let optDIdx = findColumn('optiond', 'option4', 'optd', 'choiced');

  // Fallback if headers were just "A", "B", "C", "D" or "1", "2", "3", "4"
  if (optAIdx === -1) optAIdx = normalizedHeaders.indexOf('a');
  if (optAIdx === -1) optAIdx = normalizedHeaders.indexOf('1');
  if (optBIdx === -1) optBIdx = normalizedHeaders.indexOf('b');
  if (optBIdx === -1) optBIdx = normalizedHeaders.indexOf('2');
  if (optCIdx === -1) optCIdx = normalizedHeaders.indexOf('c');
  if (optCIdx === -1) optCIdx = normalizedHeaders.indexOf('3');
  if (optDIdx === -1) optDIdx = normalizedHeaders.indexOf('d');
  if (optDIdx === -1) optDIdx = normalizedHeaders.indexOf('4');

  const answerIdx = findColumn('correctanswer', 'correctoption', 'correctindex', 'correct', 'answer', 'ans', 'key');
  const explanationIdx = findColumn('explanation', 'solution', 'rationale', 'reason', 'notes');
  const difficultyIdx = findColumn('difficulty', 'diff', 'leveldifficulty');

  const errors: string[] = [];
  const warnings: string[] = [];

  if (questionIdx === -1) {
    errors.push('Could not detect a "Question" column. Please ensure header includes "Question", "Problem", or "Prompt".');
  }
  if (optAIdx === -1 || optBIdx === -1) {
    errors.push('Could not detect option columns. Please include "Option A", "Option B", "Option C", "Option D".');
  }
  if (answerIdx === -1) {
    errors.push('Could not detect a "Correct Answer" column (e.g. "Correct Answer", "Answer", "Correct Option").');
  }

  if (errors.length > 0) {
    return {
      success: false,
      test: null,
      totalQuestions: 0,
      levelsCount: 0,
      levelNames: [],
      warnings,
      errors
    };
  }

  // Structure to collect questions grouped by level
  // Map preserves insertion order of levels
  const levelsMap = new Map<
    string,
    {
      name: string;
      timeLimitMinutes: number;
      questions: Question[];
    }
  >();

  const dataRows = rows.slice(1);
  let totalParsedQuestions = 0;

  dataRows.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2; // 1-based index in file including header
    const questionText = row[questionIdx]?.trim();
    if (!questionText) {
      warnings.push(`Row ${rowNum}: Skipped because question text is empty.`);
      return;
    }

    // Determine Level Name
    let rawLevelName = levelIdx !== -1 ? row[levelIdx]?.trim() : '';
    if (!rawLevelName) {
      rawLevelName = 'Level 1: General';
    }

    // Clean up level name if user just provided a number e.g. "1" or "2"
    let levelName = rawLevelName;
    if (/^\d+$/.test(rawLevelName)) {
      levelName = `Level ${rawLevelName}`;
    }

    // Determine options
    const optA = row[optAIdx]?.trim() || 'Option A';
    const optB = row[optBIdx]?.trim() || 'Option B';
    const optC = optCIdx !== -1 && row[optCIdx]?.trim() ? row[optCIdx].trim() : 'Option C';
    const optD = optDIdx !== -1 && row[optDIdx]?.trim() ? row[optDIdx].trim() : 'Option D';
    const options: [string, string, string, string] = [optA, optB, optC, optD];

    // Determine correct answer index (0, 1, 2, or 3)
    const rawAnswer = row[answerIdx]?.trim() || '';
    let correctIndex = 0;

    const lowerAns = rawAnswer.toLowerCase();
    if (lowerAns === 'a' || lowerAns === 'option a' || lowerAns === '1' || lowerAns === 'opt a') {
      correctIndex = 0;
    } else if (lowerAns === 'b' || lowerAns === 'option b' || lowerAns === '2' || lowerAns === 'opt b') {
      correctIndex = 1;
    } else if (lowerAns === 'c' || lowerAns === 'option c' || lowerAns === '3' || lowerAns === 'opt c') {
      correctIndex = 2;
    } else if (lowerAns === 'd' || lowerAns === 'option d' || lowerAns === '4' || lowerAns === 'opt d') {
      correctIndex = 3;
    } else if (rawAnswer === '0') {
      correctIndex = 0;
    } else {
      // Check if rawAnswer text matches one of the options directly
      const matchIdx = options.findIndex((opt) => opt.toLowerCase() === lowerAns);
      if (matchIdx !== -1) {
        correctIndex = matchIdx;
      } else {
        warnings.push(
          `Row ${rowNum}: Answer "${rawAnswer}" could not be matched directly to A, B, C, D or option text. Defaulted to Option A.`
        );
        correctIndex = 0;
      }
    }

    // Explanation
    const explanation =
      explanationIdx !== -1 && row[explanationIdx]?.trim()
        ? row[explanationIdx].trim()
        : `The correct answer is Option ${String.fromCharCode(65 + correctIndex)}: ${options[correctIndex]}.`;

    // Difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (difficultyIdx !== -1 && row[difficultyIdx]?.trim()) {
      const diffStr = row[difficultyIdx].trim().toLowerCase();
      if (diffStr.includes('easy') || diffStr === 'e') difficulty = 'Easy';
      else if (diffStr.includes('hard') || diffStr === 'h') difficulty = 'Hard';
      else difficulty = 'Medium';
    } else {
      // Infer difficulty from level name if present
      const lowerLvl = levelName.toLowerCase();
      if (lowerLvl.includes('easy') || lowerLvl.includes('basic') || lowerLvl.includes('level 1')) {
        difficulty = 'Easy';
      } else if (lowerLvl.includes('hard') || lowerLvl.includes('advanced') || lowerLvl.includes('level 3')) {
        difficulty = 'Hard';
      } else {
        difficulty = 'Medium';
      }
    }

    // Level time limit if specified in row
    let rowTime = 0;
    if (levelTimeIdx !== -1 && row[levelTimeIdx]?.trim()) {
      const parsedNum = parseFloat(row[levelTimeIdx].trim().replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        rowTime = parsedNum;
      }
    }

    // Question object
    const question: Question = {
      id: `q_csv_${Date.now()}_${rowIndex + 1}`,
      text: questionText,
      options,
      correctIndex,
      explanation,
      difficulty
    };

    // Add to level group
    if (!levelsMap.has(levelName)) {
      levelsMap.set(levelName, {
        name: levelName,
        timeLimitMinutes: rowTime > 0 ? rowTime : 0,
        questions: []
      });
    }

    const group = levelsMap.get(levelName)!;
    group.questions.push(question);
    if (rowTime > 0 && group.timeLimitMinutes === 0) {
      group.timeLimitMinutes = rowTime;
    }

    totalParsedQuestions++;
  });

  if (totalParsedQuestions === 0) {
    return {
      success: false,
      test: null,
      totalQuestions: 0,
      levelsCount: 0,
      levelNames: [],
      warnings,
      errors: ['No valid questions could be extracted from the CSV file.']
    };
  }

  // Convert map to TestLevel array
  const timePerQ = options?.defaultTimePerQuestionMinutes || 1.5;
  const testLevels: TestLevel[] = [];
  let totalDurationMinutes = 0;

  let levelCounter = 1;
  for (const [, group] of levelsMap.entries()) {
    // If no explicit time limit was provided in the CSV, calculate a reasonable limit
    let timeLimit = group.timeLimitMinutes;
    if (timeLimit <= 0) {
      const estimated = Math.ceil(group.questions.length * timePerQ);
      timeLimit = Math.max(5, Math.ceil(estimated / 5) * 5); // round to nearest 5 minutes
    }

    testLevels.push({
      id: `lvl_${Date.now()}_${levelCounter}`,
      name: group.name,
      timeLimit,
      questions: group.questions
    });

    totalDurationMinutes += timeLimit;
    levelCounter++;
  }

  // Generate test code: e.g. ATH-CSV829
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const testCode = options?.customCode || `ATH-CSV${randomSuffix}`;
  const testTitle = options?.customTitle || `Assessment (${testLevels.length} Levels, ${totalParsedQuestions} Questions)`;
  const testDesc =
    options?.customDescription ||
    `Auto-generated multi-level assessment imported from CSV file with ${testLevels.length} progressive levels and ${totalParsedQuestions} questions.`;

  const finalTest: Test = {
    id: `test_csv_${Date.now()}`,
    title: testTitle,
    description: testDesc,
    code: testCode,
    duration: totalDurationMinutes,
    levels: testLevels,
    published: true,
    createdAt: new Date().toISOString()
  };

  return {
    success: true,
    test: finalTest,
    totalQuestions: totalParsedQuestions,
    levelsCount: testLevels.length,
    levelNames: testLevels.map((l) => `${l.name} (${l.questions.length} Qs)`),
    warnings,
    errors: []
  };
}

/**
 * Returns a ready-to-download sample CSV template string
 */
export function getSampleQuizCSV(): string {
  return `Level,Question,Option A,Option B,Option C,Option D,Correct Answer,Difficulty,Explanation,Time Limit
Level 1: Fundamentals,What is the primary function of RAM in a computer system?,Long-term storage of files,Temporary working memory for active tasks,Displaying graphics on screen,Regulating power voltage,B,Easy,RAM provides high-speed volatile storage for currently executing instructions and data.,10
Level 1: Fundamentals,Which protocol is used to securely browse websites?,HTTP,FTP,HTTPS,SSH,C,Easy,HTTPS encrypts communication between the browser and web server using TLS.,10
Level 1: Fundamentals,What does CPU stand for?,Central Processing Unit,Computer Power Utility,Central Program Unit,Core Processor Utility,A,Easy,CPU stands for Central Processing Unit and executes instructions.,10
Level 1: Fundamentals,Which data structure operates on a First-In First-Out (FIFO) principle?,Stack,Queue,Tree,Graph,B,Easy,A queue processes elements in FIFO order where first element added is first removed.,10
Level 2: Intermediate Concepts,What is the worst-case time complexity of QuickSort?,O(n),O(n log n),O(n^2),O(log n),C,Medium,QuickSort worst-case time complexity is O(n^2) when pivot choice is unbalanced.,15
Level 2: Intermediate Concepts,In relational databases what does ACID stand for?,Atomicity Consistency Isolation Durability,Accuracy Control Integration Data,Automated Column Index Distribution,Access Control Identity Domain,A,Medium,ACID represents the four essential properties of reliable database transactions.,15
Level 2: Intermediate Concepts,Which HTTP status code indicates that a resource was not found?,200,301,404,500,C,Medium,404 Not Found is returned when the requested server endpoint does not exist.,15
Level 2: Intermediate Concepts,What design pattern restricts the instantiation of a class to one single instance?,Factory,Observer,Singleton,Decorator,C,Medium,Singleton pattern ensures only one instance of a class exists across the runtime.,15
Level 3: Advanced Architecture,In distributed systems what does CAP theorem state you can guarantee simultaneously?,All three: Consistency Availability Partition tolerance,Only two: Consistency and Availability or Partition tolerance,Only one: Either Consistency or Availability,None under network partition,B,Hard,CAP theorem demonstrates that a distributed data store can only provide two of the three guarantees simultaneously.,15
Level 3: Advanced Architecture,Which consensus algorithm is specifically designed to be easily understood and implemented?,Paxos,Raft,Proof of Stake,Two-Phase Commit,B,Hard,Raft was designed by Ongaro and Ousterhout to provide equivalent fault-tolerant consensus to Paxos with better understandability.,15
Level 3: Advanced Architecture,What is the main purpose of a database write-ahead log (WAL)?,To cache read queries for low latency,To ensure durability by logging changes before applying to data pages,To compress historical data backups,To enforce foreign key constraints,B,Hard,WAL logs transaction operations to durable storage before modifying actual data pages, ensuring crash recovery.,15
Level 3: Advanced Architecture,In microservices architecture what problem does the Saga pattern solve?,Load balancing across service replicas,Distributed transactions across multiple database services,API gateway request routing,Container orchestration scheduling,B,Hard,Saga pattern coordinates distributed transactions through a sequence of local transactions with compensating actions.,15`;
}
