export interface TutorialLevel {
  id: number
  title: string
  description: string
  hint: string
  vimCommands?: string[] // key vim commands emphasized in this level
  snippet: string
  tests: string
}

export const tutorialLevels: TutorialLevel[] = [
  // ── Section 1: Vim Navigation ──────────────────────────────────────────────
  {
    id: 1,
    title: "hjkl — Basic Movement",
    description:
      "In Vim, you never touch the arrow keys. Use h (left), j (down), k (up), l (right) to navigate. " +
      "The bug below is a single wrong character. Navigate to line 2 with j/k, then to the character with h/l, and fix it with r (replace) or x then i.",
    hint: "The loop should start from 0, not 1. Navigate there with j then l and use r0 to replace.",
    vimCommands: ["h / l", "j / k", "r<char>  replace", "x  delete char", "i  insert mode"],
    snippet: `def count_up(n):
    for i in range(1, n + 1):
        print(i)`,
    tests: `import io, sys
_out = io.StringIO()
sys.stdout = _out
count_up(3)
sys.stdout = sys.__stdout__
assert _out.getvalue().strip() == "1\\n2\\n3"`,
  },
  {
    id: 2,
    title: "w / b / e — Word Motion",
    description:
      "w jumps forward one word, b jumps back one word, e jumps to the end of the current word. " +
      "These are much faster than holding l. Use w to reach the bug and ciw (change inner word) to fix it.",
    hint: "The function returns the wrong operation. Press w to jump to 'subtract' and use ciw then type 'add'.",
    vimCommands: ["w  next word", "b  prev word", "e  end of word", "ciw  change word", "cw  change to end"],
    snippet: `def calculate(a, b, op):
    if op == "add":
        return a - b
    if op == "sub":
        return a - b
    return 0`,
    tests: `assert calculate(3, 2, "add") == 5
assert calculate(10, 4, "sub") == 6
assert calculate(5, 5, "add") == 10`,
  },
  {
    id: 3,
    title: "0 / $ / gg / G — Line & File Navigation",
    description:
      "0 jumps to the start of the line, $ to the end. gg goes to the top of the file, G to the bottom. " +
      "A$ puts you at line end in Insert mode. The bug is at the very end of the last line — use G then $ to reach it fast.",
    hint: "Go to the last line with G, jump to end with $, then use r to replace the wrong character.",
    vimCommands: ["0  line start", "$  line end", "gg  file top", "G  file bottom", "A  insert at line end"],
    snippet: `def greet(name):
    return "Hello, " + name + "?"`,
    tests: `assert greet("World") == "Hello, World!"
assert greet("Alice") == "Hello, Alice!"`,
  },
  {
    id: 4,
    title: "dd / yy / p — Delete, Yank, Paste",
    description:
      "dd deletes the current line (and copies it). yy yanks (copies) the line. p pastes below, P pastes above. " +
      "The two lines below are in the wrong order. Use dd on the first line, then p to paste it after the second.",
    hint: "Put your cursor on line 2 (the return line), dd to cut it, move down, then p to paste.",
    vimCommands: ["dd  delete line", "yy  copy line", "p  paste below", "P  paste above", "u  undo"],
    snippet: `def first_last(lst):
    return lst[0], lst[-1]
    if not lst:
        return None, None`,
    tests: `assert first_last([1, 2, 3]) == (1, 3)
assert first_last([7]) == (7, 7)
assert first_last([]) is None or first_last([]) == (None, None)`,
  },
  {
    id: 5,
    title: "/ — Search & Navigate",
    description:
      "In Normal mode, / opens a search prompt. Type a pattern and press Enter. n jumps to the next match, N goes back. " +
      "Use /return to find the return statement, then fix the off-by-one error.",
    hint: "Search for 'n -' with /n - to jump right to the bug. Change n - 1 to n + 1.",
    vimCommands: ["/<pattern>  search", "n  next match", "N  prev match", "cgn  change match", ":%s/old/new/g  replace all"],
    snippet: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def sum_to(n):
    return n * (n - 1) // 2`,
    tests: `assert factorial(5) == 120
assert factorial(1) == 1
assert sum_to(4) == 10
assert sum_to(1) == 1`,
  },

  // ── Section 2: Coding Challenges ───────────────────────────────────────────
  {
    id: 6,
    title: "Fix the Sum",
    description:
      "sum_list should return the sum of all numbers in a list. It has a subtle initialization bug. " +
      "Use your Vim skills: gg to go to the top, w to jump to the number, r to replace it.",
    hint: "What should the accumulator start at before adding anything?",
    vimCommands: ["gg  go to top", "w / b  word jump", "r<char>  replace char"],
    snippet: `def sum_list(nums):
    total = 1
    for n in nums:
        total += n
    return total`,
    tests: `assert sum_list([]) == 0
assert sum_list([1, 2, 3]) == 6
assert sum_list([10]) == 10`,
  },
  {
    id: 7,
    title: "Count Vowels",
    description:
      "count_vowels should count all vowels (a, e, i, o, u) in a string. Two vowels are missing. " +
      "Use /aei to find the string, then A to append at end of line.",
    hint: "There are 5 vowels: a, e, i, o, u. Search for the string and add the missing two.",
    vimCommands: ["A  append at line end", "/pattern  search", "a  insert after cursor"],
    snippet: `def count_vowels(s):
    count = 0
    for c in s.lower():
        if c in 'aei':
            count += 1
    return count`,
    tests: `assert count_vowels("hello") == 2
assert count_vowels("AEIOU") == 5
assert count_vowels("rhythm") == 0`,
  },
  {
    id: 8,
    title: "Fix FizzBuzz",
    description:
      "fizzbuzz returns 'FizzBuzz' for multiples of 15, but the condition order is wrong. " +
      "Use dd on the first two if-blocks, then p to paste them after the FizzBuzz check.",
    hint: "Check the most specific condition (n % 15) first. Use dd and p to reorder the lines.",
    vimCommands: ["dd  cut line", "p / P  paste", "V  visual line", "d  delete selection"],
    snippet: `def fizzbuzz(n):
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    if n % 15 == 0:
        return "FizzBuzz"
    return str(n)`,
    tests: `assert fizzbuzz(15) == "FizzBuzz"
assert fizzbuzz(9) == "Fizz"
assert fizzbuzz(10) == "Buzz"
assert fizzbuzz(7) == "7"`,
  },
  {
    id: 9,
    title: "MinStack",
    description:
      "A MinStack must support get_min in O(1). The current implementation is O(n). " +
      "You'll need to rewrite push to store (val, current_min) pairs. Use cc to change whole lines.",
    hint: "Push (val, min(val, current_min)) as a tuple. get_min returns self.stack[-1][1].",
    vimCommands: ["cc  change line", "o / O  new line below/above", "ci(  change inside parens"],
    snippet: `class MinStack:
    def __init__(self):
        self.stack = []

    def push(self, val):
        self.stack.append(val)

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1]

    def get_min(self):
        return min(self.stack)`,
    tests: `s = MinStack()
s.push(5)
s.push(3)
s.push(7)
assert s.get_min() == 3
s.pop()
assert s.get_min() == 3
s.pop()
assert s.get_min() == 5
assert s.top() == 5`,
  },
]

export const VIM_CHEATSHEET = [
  {
    category: "Motion",
    commands: [
      { keys: "h j k l", desc: "move left / down / up / right" },
      { keys: "w / b / e", desc: "next word / prev word / word end" },
      { keys: "0 / $", desc: "line start / line end" },
      { keys: "gg / G", desc: "file top / file bottom" },
      { keys: "{ / }", desc: "prev / next paragraph" },
      { keys: "f<c> / F<c>", desc: "jump to char on line" },
    ],
  },
  {
    category: "Insert Mode",
    commands: [
      { keys: "i / a", desc: "insert before / after cursor" },
      { keys: "I / A", desc: "insert at line start / end" },
      { keys: "o / O", desc: "new line below / above" },
      { keys: "Esc / Ctrl+C", desc: "back to Normal mode" },
    ],
  },
  {
    category: "Edit",
    commands: [
      { keys: "x", desc: "delete character under cursor" },
      { keys: "dd / yy", desc: "cut / copy line" },
      { keys: "p / P", desc: "paste below / above" },
      { keys: "u / Ctrl+R", desc: "undo / redo" },
      { keys: "r<c>", desc: "replace character with <c>" },
      { keys: "cw / cc", desc: "change word / change line" },
      { keys: "ciw", desc: "change inner word" },
    ],
  },
  {
    category: "Search",
    commands: [
      { keys: "/<pattern>", desc: "search forward" },
      { keys: "n / N", desc: "next / prev match" },
      { keys: ":%s/old/new/g", desc: "replace all in file" },
    ],
  },
]
