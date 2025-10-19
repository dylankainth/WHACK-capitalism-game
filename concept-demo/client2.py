import requests
import json

# Base URL of the Flask server
BASE_URL = "http://localhost:5000"
SESSION = "testsession"

# Initialize game session on server
requests.get(f"{BASE_URL}/{SESSION}/new")

# Create players
p1 = requests.post(f"{BASE_URL}/{SESSION}/add_player", json={"name": "Player 1"}).json()
p2 = requests.post(f"{BASE_URL}/{SESSION}/add_player", json={"name": "Player 2"}).json()
players = [p1, p2]

def get_player(player):
    res = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": player["id"]})
    return res.json()


while True:
    for i in range(len(players)):
        players[i] = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": players[i]["id"]}).json()
        player = players[i]
        print(f"{player["name"]}'s turn!")
        print("""
enter action:
1) repay debt
2) paycheck (100)
3) DEBUG show transactions log
4) move number
5) borrow debt
        """)

        action = int(input("> "))

        if action == 1:
            res = requests.post(f"{BASE_URL}/{SESSION}/get_player_debts", json={"player_id": player["id"]})
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
                    "debtee_id": player["id"],
                    "amount": repay_amount
                })

        elif action == 2:
            bank = requests.post(f"{BASE_URL}/{SESSION}/find_player_by_name", json={"name": "__Bank"}).json()
            transaction = {
                "payment": 100,
                "sender_id": bank["id"],
                "reciever_id": player["id"],
                "desc": "paycheck",
                "turn": player["turns"],
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
            pass_go = player["location_idx"] + n >= 24

            res = requests.post(f"{BASE_URL}/{SESSION}/move_player_rel", json={
                "player_id": player["id"],
                "n": n
            })
            location = res.json()

            if pass_go:
                statement = requests.post(
                    f"{BASE_URL}/{SESSION}/player_bank_statement",
                    json={"player_id": player["id"]}
                ).json()

                print(f"player: {player['name']}'s BANK STATEMENT")
                print(f"money (post interest): {statement['money']}")

                print("=== credit score ===")
                print(f"credit score: {statement['credit_score']}")

                print("=== debts ===")
                for d in statement["debts"]:
                    print(f"debt: {d['amount']} from: {d['loaner_id']} to: {d['debtee_id']} turn: {d['start_turn']}")

                print("=== transactions ===")
                for t in statement["transactions"]:
                    if t["sender_id"] == player["id"]:
                        receiver = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": t["reciever_id"]}).json()
                        print(f"paid {t['payment']} to {receiver['name']}: {t['desc']}")
                    elif t["reciever_id"] == player["id"]:
                        sender = requests.post(f"{BASE_URL}/{SESSION}/get_player", json={"id": t["sender_id"]}).json()
                        print(f"received {t['payment']} from {sender['name']}: {t['desc']}")
                print()

            actions = location["actions"]
            print(f"player {player['name']} moved to {location['idx']}: {location['name']}")

            if len(actions) > 0:
                print("choose an action:")
                for i, a in enumerate(actions):
                    print(f"{i + 1}) {a['desc']}")

                action_idx = int(input("> ")) - 1
                requests.post(f"{BASE_URL}/{SESSION}/run_action", json={
                    "action": actions[action_idx]["func"],
                    "player_id": player["id"]
                })

        elif action == 5:
            amount = int(input("amount: "))
            requests.post(f"{BASE_URL}/{SESSION}/borrow_debt", json={
                "player_id": player["id"],
                "amount": amount
            })

        else:
            print("invalid action")
            continue

        money = requests.post(f"{BASE_URL}/{SESSION}/player_money", json={"id": player["id"]}).json()["money"]
        print(f"{player['name']} has money: {money}")

        requests.post(f"{BASE_URL}/{SESSION}/player_advance_turn", json={"player_id": player["id"]})

