import math

# 1) raw spendings
rent = 1000.0
insurance = 500.0
bills = 100.0
groceries = 50.0
# we have transaction history of how much user spends & on what turn they spent it.
# how can we use this to estimate their credit score category?
total = rent + insurance + bills + groceries

# 2) normalized features (proportions)
x = [
    rent / total,       # rent proportion
    insurance / total,  # insurance proportion
    bills / total,      # bills proportion
    groceries / total   # groceries proportion
]

# 3) weights and biases (chosen for this demo)
W = [
    [ 4.0, -2.0,  1.0,  0.5],  # class 1: poor
    [ 1.5, -0.5,  0.5,  0.2],  # class 2: fair
    [-1.0,  1.0,  0.3,  0.1],  # class 3: good
    [-2.0,  1.5,  0.2,  0.1],  # class 4: decent
    [-3.0,  2.0,  0.1,  0.05]  # class 5: excellent
]
b = [-1.0, 0.0, 0.2, 0.5, 1.0]

# 4) compute logits z_k
zs = []
for w_row, bias in zip(W, b):
    z = bias + sum(wi * xi for wi, xi in zip(w_row, x))
    zs.append(z)

# 5) softmax (stable)
def softmax(zs):
    m = max(zs)
    exps = [math.exp(z - m) for z in zs]
    s = sum(exps)
    return [e / s for e in exps]

probs = softmax(zs)

# 6) category mapping
categories = [
    ("Poor", 300, 580),
    ("Fair", 580, 670),
    ("Good", 670, 740),
    ("Decent", 740, 800),
    ("Excellent", 800, 850),
]

# argmax category
argmax_idx = max(range(len(probs)), key=lambda i: probs[i])
argmax_category = categories[argmax_idx]

# expected numeric credit score (using midpoints)
midpoints = [ (low + high) / 2.0 for (_, low, high) in categories ]
expected_score = sum(p * m for p, m in zip(probs, midpoints))

# print results
print("Features (proportions):", x)
print("Logits z:", zs)
print("Softmax probabilities:", probs)
print("Argmax category:", argmax_category[0], f"({argmax_category[1]}-{argmax_category[2]})")
print("Expected numeric credit score (weighted):", round(expected_score, 2))
