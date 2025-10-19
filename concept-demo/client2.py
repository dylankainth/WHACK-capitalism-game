import requests
import json

# Base URL of the Flask server
BASE_URL = "http://localhost:5000"
SESSION = "testsession"

# Initialize game session on server
requests.get(f"{BASE_URL}/{SESSION}/new")

# Create a player locally and send to server
player_name = "Player 1"

p1 = requests.post(f"{BASE_URL}/{SESSION}/add_player", json={"name": player_name}).json()


def get_player():
    res = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": p1["id"]})
    return res.json()


while True:
    print("""
    enter action:
    1) repay debt
    2) paycheck (100)
    3) DEBUG show transactions log
    4) move number
    5) borrow debt
    """)

    action = int(input("> "))
    p1 = get_player()  # Refresh player data

    if action == 1:
        res = requests.post(f"{BASE_URL}/{SESSION}/get_player_debts", json={"player_id": p1["id"]})
        debts = res.json()
        active_debts = [d for d in debts if d["amount"] > 0]

        if len(active_debts) == 0:
            print("no debts to repay")
        else:
            for i, d in enumerate(active_debts):
                print(f"{i + 1}) {d['amount']}")

            debt_idx = int(input("> ")) - 1
            repay_amount = min(int(input("amount: ")), active_debts[debt_idx]["amount"])
            requests.post(f"{BASE_URL}/{SESSION}/repay_debt", json={
                "debt_id": active_debts[debt_idx]["id"],
                "debtee_id": p1["id"],
                "amount": repay_amount
            })

    elif action == 2:
        bank = requests.post(f"{BASE_URL}/{SESSION}/find_player_by_name", json={"name": "__Bank"}).json()
        transaction = {
            "payment": 100,
            "sender_id": bank["id"],
            "reciever_id": p1["id"],
            "desc": "paycheck",
            "turn": p1["turns"],
            "base_from_score": 0,
            "base_to_score": 0
        }
        requests.post(f"{BASE_URL}/{SESSION}/add_transaction", json=transaction)

    elif action == 3:
        res = requests.get(f"{BASE_URL}/{SESSION}/get_transactions")
        transactions = res.json()
        for t in transactions:
            print(json.dumps(t))

    elif action == 4:
        n = int(input("enter number: "))
        pass_go = p1["location_idx"] + n >= 24

        res = requests.post(f"{BASE_URL}/{SESSION}/move_player_rel", json={
            "player_id": p1["id"],
            "n": n
        })
        location = res.json()

        if pass_go:
            statement = requests.post(
                f"{BASE_URL}/{SESSION}/player_bank_statement",
                json={"player_id": p1["id"]}
            ).json()

            print(f"player: {p1['name']}'s BANK STATEMENT")
            print(f"money (post interest): {statement['money']}")

            print("=== credit score ===")
            print(f"credit score: {statement['credit_score']}")

            print("=== debts ===")
            for d in statement["debts"]:
                print(f"debt: {d['amount']} from: {d['loaner_id']} to: {d['debtee_id']} turn: {d['start_turn']}")

            print("=== transactions ===")
            for t in statement["transactions"]:
                if t["sender_id"] == p1["id"]:
                    receiver = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": t["reciever_id"]}).json()
                    print(f"paid {t['payment']} to {receiver['name']}: {t['desc']}")
                elif t["reciever_id"] == p1["id"]:
                    sender = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": t["sender_id"]}).json()
                    print(f"received {t['payment']} from {sender['name']}: {t['desc']}")
            print()

        actions = location["actions"]
        print(f"player {p1['name']} moved to {location['idx']}: {location['name']}")

        if len(actions) > 0:
            print("choose an action:")
            for i, a in enumerate(actions):
                print(f"{i + 1}) {a['desc']}")

            action_idx = int(input("> ")) - 1
            requests.post(f"{BASE_URL}/{SESSION}/run_action", json={
                "action": actions[action_idx]["func"],
                "player_id": p1["id"]
            })

    elif action == 5:
        amount = int(input("amount: "))
        requests.post(f"{BASE_URL}/{SESSION}/borrow_debt", json={
            "player_id": p1["id"],
            "amount": amount
        })

    else:
        print("invalid action")
        continue

    money = requests.post(f"{BASE_URL}/{SESSION}/player_money", json={"id": p1["id"]}).json()["money"]
    print(f"{p1['name']} has money: {money}")

    requests.post(f"{BASE_URL}/{SESSION}/player_advance_turn", json={"player_id": p1["id"]})

