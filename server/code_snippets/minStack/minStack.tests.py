import json as _json

_results = []

def _run(fn):
    try:
        fn()
        _results.append(True)
    except Exception:
        _results.append(False)

def _t1():
    # __init__: minStack should be a list, not a dict
    ms = MinStack()
    assert isinstance(ms.minStack, list)

def _t2():
    # push: should store (val, minVal) tuple, not bare val
    ms = MinStack()
    ms.push(5)
    assert ms.minStack == [(5, 5)]

def _t3():
    # pop: should remove the last element, not append
    ms = MinStack()
    ms.push(3)
    ms.pop()
    assert len(ms.minStack) == 0

def _t4():
    # top: should always return the most recently pushed value
    ms = MinStack()
    for v in [9, 5, 6, 7, 4]:
        ms.push(v)
    assert ms.top() == 4

def _t5():
    # getMin: should track the running minimum after every push
    ms = MinStack()
    ms.push(9); assert ms.getMin() == 9
    ms.push(5); assert ms.getMin() == 5
    ms.push(6); assert ms.getMin() == 5
    ms.push(7); assert ms.getMin() == 5
    ms.push(4); assert ms.getMin() == 4

for _t in [_t1, _t2, _t3, _t4, _t5]:
    _run(_t)

print(_json.dumps(_results))
