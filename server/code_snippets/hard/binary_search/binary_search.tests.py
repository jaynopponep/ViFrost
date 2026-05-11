assert binary_search([1, 3, 5, 7, 9], 5) == 2, f"Expected 2, got {binary_search([1,3,5,7,9], 5)}"
assert binary_search([1, 3, 5, 7, 9], 1) == 0, f"Expected 0, got {binary_search([1,3,5,7,9], 1)}"
assert binary_search([1, 3, 5, 7, 9], 9) == 4, f"Expected 4, got {binary_search([1,3,5,7,9], 9)}"
assert binary_search([1, 3, 5, 7, 9], 4) == -1, f"Expected -1, got {binary_search([1,3,5,7,9], 4)}"
