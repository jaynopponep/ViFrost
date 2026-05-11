assert valid_parentheses("()[]{}") == True, f"Expected True, got {valid_parentheses('()[]{}}')}"
assert valid_parentheses("(]") == False, f"Expected False, got {valid_parentheses('(]')}"
assert valid_parentheses("{[]}") == True, f"Expected True, got {valid_parentheses('{[]}')}"
assert valid_parentheses("(") == False, f"Expected False for unclosed bracket, got {valid_parentheses('(')}"
