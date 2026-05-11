assert reverse_words("hello world") == "world hello", f"Got: {reverse_words('hello world')}"
assert reverse_words("one two three") == "three two one", f"Got: {reverse_words('one two three')}"
assert reverse_words("python") == "python", f"Got: {reverse_words('python')}"
assert reverse_words("a b") == "b a", f"Got: {reverse_words('a b')}"
