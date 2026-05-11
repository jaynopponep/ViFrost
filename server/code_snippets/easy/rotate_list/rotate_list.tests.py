assert rotate_list([1,2,3,4,5], 2) == [4,5,1,2,3], f"Expected [4,5,1,2,3], got {rotate_list([1,2,3,4,5], 2)}"
assert rotate_list([1,2,3], 1) == [3,1,2], f"Expected [3,1,2], got {rotate_list([1,2,3], 1)}"
assert rotate_list([1,2,3,4,5], 5) == [1,2,3,4,5], f"Expected original list for k=n, got {rotate_list([1,2,3,4,5], 5)}"
assert rotate_list([1,2,3,4], 3) == [2,3,4,1], f"Expected [2,3,4,1], got {rotate_list([1,2,3,4], 3)}"
