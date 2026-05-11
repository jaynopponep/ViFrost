s = MinStack()
s.push(5)
s.push(3)
s.push(7)
assert s.get_min() == 3, f"Expected 3, got {s.get_min()}"
s.pop()
assert s.get_min() == 3, f"Expected 3 after pop, got {s.get_min()}"
s.pop()
assert s.get_min() == 5, f"Expected 5, got {s.get_min()}"
assert s.top() == 5, f"Expected top=5, got {s.top()}"
