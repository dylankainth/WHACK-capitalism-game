import server
import json

db = server.new_game()
p1 = server.Player.new(db.id_gen, "Player 1")
db.add_player(p1)


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

    if action == 1:
        debts = db.get_player_debts(p1.id)
        active_debts = [d for d in debts if d.amount > 0]
        if len(active_debts) == 0:
            print("no debts to repay")

        else:
            for i, d in enumerate(active_debts):
                print(f"{i + 1}) {d.amount}")

            debt_idx = int(input("> ")) - 1
            repay_amount = min(int(input("amount: ")), active_debts[debt_idx].amount)
            db.repay_debt(active_debts[debt_idx].id, p1.id, repay_amount)

    elif action == 2:
        bank = db.find_player_by_name(server.BANK_NAME)
        db.add_transaction(server.Transaction.new(db.id_gen, 100, bank.id, p1.id, "paycheck", p1.turns, 0, 10))
    elif action == 3:
        transactions = db.get_transactions()
        for t in transactions:
            print(t)
    elif action == 4:
        player = p1
        n = int(input("enter number: "))
        pass_go = player.location_idx + n >= 24
        location = db.move_player_rel(db, p1, n)
        if pass_go:
            statement = json.loads(db.player_bank_statement(player.id))
            # money and credit score
            print(f"player: {player.name}'s BANK STATEMENT")
            print(f"money (post interest): {statement["money"]}")

            # interest calculator
            print("=== interest ===")
            print(f"interest: {statement["interest"]}")

            # credit score
            print("=== credit score ===")
            print(f"credit score: {statement["credit_score"]}")

            # debt history
            print("=== debts ===")
            for d in statement["debts"]:
                print(f"debt: {d["amount"]} from: {d["loaner_id"]} to: {d["debtee_id"]} turn: {d["start_turn"]}")

            # transaction log
            print("=== transactions ===")
            for t in statement["transactions"]:
                if t["sender_id"] == player.id:
                    reciever = db.get_player(t["reciever_id"])
                    print(f"sent {t["payment"]} to {reciever.name}: {t["desc"]}")
                if t["reciever_id"] == player.id:
                    sender = db.get_player(t["sender_id"])
                    print(f"recieved {t["payment"]} from {sender.name}: {t["desc"]}")
            print()
        actions = location.actions
        print(f"player {player.name} moved to {location.idx}: {location.name}")
        if len(actions) != 0:
            print("choose an action:")
            for i, a in enumerate(actions):
                print(f"{i + 1}) {a.desc}")

            action = int(input("> "))
            db.run_action(actions[action - 1].func, player.id)
    elif action == 5:
        amount = int(input("amount: "))
        db.borrow_debt(p1.id, amount)
    else:
        print("invalid action")
        continue

    money = db.player_money(p1.id)
    print(f"{p1.name} has money: {money}")
    p1.turns += 1


