import math
def credit_calc(rent, insurance, utils, groceries, direct_debit=0):
    sum = rent + insurance + utils + groceries + direct_debit
    vector = [rent, insurance, utils, groceries, direct_debit]
    normalised_vector = []
    for expense in vector:
        normalised_vector.add(expense/sum)
    

def sigmoid(rent, insurance, utils, groceries, direct_debit=0, transaction_history=None):
    transaction_weight = []
    for transaction in transaction_history:
        time_elapsed = current_turn - int(transaction['turn']) # 15 weeks
        weight = 0.0001 * (-time_elapsed) # 15 * 0.0001 = 0.0015
        transaction_weight.append(weight)
        # transaction_weight.append(int(str(0.005) + str((current_turn - int(transaction['turn'])))))
    weight = [0.004, 0.002, 0.001, 0.001, 0.001]
    bias = -4
    sum = 0
    for i, expense in enumerate([rent, insurance, utils, groceries, direct_debit]):
        sum += expense * weight[i]
    sum += bias

    if transaction_history is not None:
        for j, transaction in enumerate(transaction_history):
            sum += transaction['amount'] * transaction_weight[j]

    print(sum)
    sigmoid_num = 1 / (1 + math.exp(-sum))
    credit_score = sigmoid_num * 500 + 150
    return credit_score


if __name__ == "__main__":
    current_turn = 10
    sigma = sigmoid(1200, 0, 0, 0, 0, [{'amount': 0, 'turn': 20}, {'amount': 0, 'turn': 5}])
    print(sigma)

# FICO components:
# payment history 35%
# amounts owed 30%
# length of credit history 15%
# new credit 10%
# types of credit used 10%
# Total 100%
# FICO score range: 300-850
# Average FICO score: 711 (as of 2020)
# Excellent FICO score: 800-850
# Good FICO score: 670-799
# Fair FICO score: 580-669
# Poor FICO score: 300-579
# https://www.myfico.com/credit-education/credit-scores/what-is-a-fico-score
