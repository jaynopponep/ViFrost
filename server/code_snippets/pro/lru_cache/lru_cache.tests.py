c = LRUCache(2)
c.put(1, 1)
c.put(2, 2)
assert c.get(1) == 1, f"Expected 1, got {c.get(1)}"
c.put(3, 3)
assert c.get(2) == -1, f"Expected -1 (evicted), got {c.get(2)}"
c.put(4, 4)
assert c.get(1) == -1, f"Expected -1 (evicted), got {c.get(1)}"
assert c.get(3) == 3, f"Expected 3, got {c.get(3)}"
assert c.get(4) == 4, f"Expected 4, got {c.get(4)}"
