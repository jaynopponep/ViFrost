assert merge_intervals([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]], f"Got {merge_intervals([[1,3],[2,6],[8,10],[15,18]])}"
assert merge_intervals([[1,4],[4,5]]) == [[1,5]], f"Got {merge_intervals([[1,4],[4,5]])}"
assert merge_intervals([[2,6],[1,3]]) == [[1,6]], f"Got {merge_intervals([[2,6],[1,3]])}"
assert merge_intervals([[1,2]]) == [[1,2]], f"Got {merge_intervals([[1,2]])}"
