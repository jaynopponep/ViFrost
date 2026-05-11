t = Trie()
t.insert("apple")
assert t.search("apple") == True, f"Expected True for 'apple'"
assert t.search("app") == False, f"Expected False for prefix 'app' (not inserted as a full word)"
assert t.starts_with("app") == True, f"Expected True for starts_with 'app'"
t.insert("app")
assert t.search("app") == True, f"Expected True after inserting 'app'"
