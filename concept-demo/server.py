import json
import math
from flask import Flask
from flask import request, jsonify


# pure function
def supermarket_buy_food(db, player_id):
    supermarket = db.find_player_by_name(SUPER_MARKET_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 50
    score = cost * 0.001
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, supermarket.id, "buy food", current_turn, score, 0))


def supermarket_part_time(db, player_id):
    supermarket = db.find_player_by_name(SUPER_MARKET_NAME)
    current_turn = db.get_player(player_id).turns
    db.add_long_term(LongTerm.new(db.id_gen, player_id, supermarket.id, current_turn, current_turn + 5, "super market part time", 150, 0, 0, 0))


# pure function
def computer_shop_buy_computer(db, player_id):
    computer_shop = db.find_player_by_name(COMPUTER_SHOP_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 200
    score = cost * 0.001
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, computer_shop.id, "buy computer", current_turn, score, 0))

# pure function
def rent(db, player_id):
    accom = db.find_player_by_name(ACCOM_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 1000
    score = cost * 0.004
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, accom.id, "pay rent", current_turn, score, 0))


def income_tax(db, player_id):
    gov = db.find_player_by_name(GOV_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 200
    score = 0
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, gov.id, "pay income tax", current_turn, score, 0))


def pay_utility_bill(db, player_id):
    utility = db.find_player_by_name(UTILITY_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 50
    score = cost * 0.001
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, utility.id, "pay utility bill", current_turn, score, 0))


def pay_medical_bill(db, player_id):
    medical = db.find_player_by_name(HOSPITAL_NAME)
    current_turn = db.get_player(player_id).turns
    cost = 100
    score = 0
    db.add_transaction(Transaction.new(db.id_gen, cost, player_id, medical.id, "pay medical bill", current_turn, score, 0))


FAKE_FUNCTION_POINTERS = {
    "supermarket_buy_food": supermarket_buy_food,
    "supermarket_part_time": supermarket_part_time,
    "computer_shop_buy_computer": computer_shop_buy_computer,
    "rent": rent,
    "income_tax": income_tax,
    "pay_utility_bill": pay_utility_bill,
    "do_nothing": lambda db, player_id: None,
}


# id generator, can be replaced with supabase id gen if any
class IDGenerator:

    def __init__(self):
        self.player_id_generator = 0
        self.transaction_id_generator = 0
        self.debt_id_generator = 0


# pure player data, can be stored as record on supabase
class Player:

    def __init__(self, id, name, location_idx, interest_rate, turns):
        self.name = name
        self.location_idx = location_idx
        self.interest_rate = interest_rate
        self.turns = turns
        self.id = id

    def new(id_gen, name):
        location_idx = 0
        interest_rate = 0.01
        turns = 0

        # id generation
        id = id_gen.player_id_generator
        id_gen.player_id_generator += 1

        return Player(id, name, location_idx, interest_rate, turns)

    def json_encode(self):
        return json.dumps(self.__dict__)

    def json_decode(obj):
        return Player(**obj)


# pure transaction data, can be stored on supabase
class Transaction:

    def __init__(self, id, payment, sender_id, reciever_id, desc, turn, base_from_score, base_to_score):
        self.payment = payment
        self.sender_id = sender_id
        self.reciever_id = reciever_id
        self.desc = desc
        self.turn = turn
        self.base_from_score = base_from_score
        self.base_to_score = base_to_score

        self.id = id

    def new(id_gen, payment, sender_id, reciever_id, desc, turn, base_from_score, base_to_score):

        # id generation
        id = id_gen.transaction_id_generator
        id_gen.transaction_id_generator += 1

        return Transaction(id, payment, sender_id, reciever_id, desc, turn, base_from_score, base_to_score)

    def json_encode(self):
        return json.dumps(self.__dict__)

    def json_decode(obj):
        return Transaction(**obj)

    # internal debug, may be removed at some point
    def __str__(self):
        return f"transaction: payment: {self.payment} from: {self.sender_id} to: {self.reciever_id} desc: {self.desc} turn: {self.turn} base_from_score: {self.base_from_score} base_to_score: {self.base_to_score}"


# pure string data, can be stored on supabase
class Action:

    def __init__(self, desc, func):
        self.desc = desc
        self.func = func

    def json_encode(self):
        return json.dumps(self.__dict__)

    def json_decode(obj):
        return Action(**obj)


# pure data, can be stored on supabase
class Location:

    def __init__(self, idx, name, actions):
        self.idx = idx
        self.name = name
        self.actions = actions

    def json_encode(self):
        return json.dumps(self.__dict__, default=lambda o: o.__dict__)

    def json_decode(obj):
        return Location(obj["idx"], obj["name"], [Action.json_decode(a) for a in obj["actions"]])


class LongTerm:
    def __init__(self, id, receiver_id, sender_id, start_turn, end_turn, desc, amount, interest_rate, sender_score, receiver_score):
        self.amount = amount
        self.start_turn = start_turn
        self.end_turn = end_turn
        self.desc = desc
        self.receiver_id = receiver_id
        self.sender_id = sender_id
        self.interest_rate = interest_rate
        self.sender_score = sender_score
        self.receiver_score = receiver_score
        self.id = id

    def new(id_gen, receiver_id, sender_id, start_turn, end_turn, desc, amount, interest_rate, sender_score, receiver_score):
        id = id_gen.debt_id_generator
        id_gen.debt_id_generator += 1

        return LongTerm(id, receiver_id, sender_id, start_turn, end_turn, desc, amount, interest_rate, sender_score, receiver_score)

    def json_encode(self):
        return json.dumps(self.__dict__)

    def json_decode(obj):
        return LongTerm(**obj)

    def expired(self, db):
        return db.get_player(self.receiver_id).turns > self.end_turn

    def add_interest_and_transaction(self, db):
        self.amount += int(self.amount * self.interest_rate)
        return Transaction.new(db.id_gen, self.amount, self.sender_id, self.receiver_id, self.desc, db.get_player(self.receiver_id).turns, self.sender_score, self.receiver_score)


# pure debt data, can be stored on supabase
class Debt:
    
    def __init__(self, id, debtee_id, start_turn, amount, interest_rate, loaner_id):
        self.amount = amount
        self.start_turn = start_turn
        self.debtee_id = debtee_id
        self.loaner_id = loaner_id
        self.interest_rate = interest_rate
        self.id = id

    def new(state, debtee_id, start_turn, amount, interest_rate, loaner_id):
        id = state.debt_id_generator
        state.debt_id_generator += 1

        return Debt(id, debtee_id, start_turn, amount, interest_rate, loaner_id)

    def json_encode(self):
        return json.dumps(self.__dict__)

    def json_decode(obj):
        return Debt(**obj)

    # can be endpoint
    def score_impact(self, db):
        elapsed_turns = db.get_player(self.debtee_id).turns - self.start_turn
        impact = int(-elapsed_turns * self.amount * 0.0001)
        return impact

    # can be endpoint
    def add_interest(self):
        self.amount += int(self.amount * self.interest_rate)

    # can be endpoint
    def repay(self, amount):
        self.amount -= amount


# the current database, also contains a mess of logics
class Database:
    def __init__(self, id_gen, size):
        self.id_gen = id_gen
        self.transactions = []
        self.players = []
        self.locations = [
            Location(i, "Empty", []) for i in range(size)
        ]
        self.debts = []
        self.long_terms = []

    # can be endpoint, but used only in game init
    def set_location(self, idx, location):
        self.locations[idx] = location

    # can be endpoint
    def get_location(self, idx):
        return self.locations[idx]

    # can be endpoint
    def run_action(self, action, player_id):
        FAKE_FUNCTION_POINTERS[action](self, player_id)

    # can be endpoint
    def add_player(self, player):
        self.players.append(player)

    # can be endpoint
    def find_player_by_name(self, name):
        for player in self.players:
            if player.name == name:
                return player
        return None

    # can be endpoint
    def get_player(self, id) -> Player | None:
        for player in self.players:
            if player.id == id:
                return player
        return None

    # can be endpoint
    def add_debt(self, debt):
        self.debts.append(debt)

    # can be endpoint
    def get_debt(self, id):
        for debt in self.debts:
            if debt.id == id:
                return debt
        return None

    # can be endpoint
    def get_player_debts(self, player_id):
        return [d for d in self.debts if d.debtee_id == player_id]

    def add_long_term(self, long_term):
        self.long_terms.append(long_term)

    def get_long_term(self, id):
        for long_term in self.long_terms:
            if long_term.id == id:
                return long_term
        return None

    def get_player_long_terms(self, player_id):
        return [d for d in self.long_terms if d.receiver_id == player_id]

    # can be endpoint
    def borrow_debt(self, player_id, amount):
        bank = self.find_player_by_name(BANK_NAME)
        current_turn = self.get_player(player_id).turns
        score = amount * 0.001
        self.add_debt(Debt.new(self.id_gen, player_id, current_turn, amount, 0.05, bank.id))
        self.add_transaction(Transaction.new(self.id_gen, amount, bank.id, player_id, "borrow", current_turn, 0, -score))

    # can be endpoint
    def repay_debt(self, debt_id, debtee_id, amount):
        bank = self.find_player_by_name(BANK_NAME)
        debt = self.get_debt(debt_id)
        current_turn = self.get_player(debtee_id).turns
        score = amount * 0.001
        self.add_transaction(Transaction.new(self.id_gen, amount, debtee_id, bank.id, "repay debt", current_turn, 0, score))
        debt.repay(amount)

    # can be endpoint
    def move_player_rel(self, db, player, rel):
        location_idx = (player.location_idx + rel) % len(self.locations)
        return self.move_player_abs(db, player.id, location_idx)

    # can be endpoint
    def move_player_abs(self, db, player_id, location_idx):
        player = db.get_player(player_id)
        player.location_idx = location_idx

        location = self.locations[location_idx]
        return location

    # can be endpoint
    def add_transaction(self, transaction):
        self.transactions.append(transaction)

    # can be endpoint
    def get_transactions(self):
        return self.transactions

    # can be endpoint
    def player_score(self, id):
        sum = 0  # initial credit score
        # transactions
        for t in self.transactions:
            if t.sender_id == id:
                sum += t.base_from_score
            if t.reciever_id == id:
                sum += t.base_to_score
            
            time_elapsed = self.get_player(id).turns - int(t.turn)
            weight = 0.0001 * time_elapsed # 15 * 0.0001 = 0.0015
            sum += weight * t.payment
            print(f"transactions: {t.desc}, {sum}")
        # debts
        for d in self.get_player_debts(id):
            sum += d.score_impact(self)
            print(f"debt: {sum}")

        for l in self.get_player_long_terms(id):
            sum += l.receiver_score
            print(f"long term: {sum}")

        bias = -4
        sum += bias
        sigmoid_num = 1 / (1 + math.exp(-sum))
        credit_score = sigmoid_num * 500 + 150
        print(sum, credit_score)
        return credit_score

    # can be endpoint
    def player_money(self, id):
        money = 200  # initial starting money
        for t in self.transactions:
            if t.sender_id == id:
                money -= t.payment
            if t.reciever_id == id:
                money += t.payment
        return money

    # can be endpoint
    def player_advance_turn(self, player_id):
        player = self.get_player(player_id)
        player.turns += 1
        if player.turns % 4 == 0:
            self.four_turner(player_id)

    # can be endpoint
    def four_turner(self, player_id):
        player = self.get_player(player_id)

        # interest calculator
        money = self.player_money(player.id)
        interest = int(money * player.interest_rate)
        bank = self.find_player_by_name(BANK_NAME)
        self.add_transaction(Transaction.new(self.id_gen, interest, bank.id, player.id, "interest", player.turns, 0, 0))
        
        # process debt history
        for d in self.get_player_debts(player.id):
            d.add_interest()

        for l in self.get_player_long_terms(player.id):
            if l.expired(self):
                self.long_terms.remove(l)
            transaction = l.add_interest_and_transaction(self)
            self.add_transaction(transaction)

    # can be endpoint, returning json
    def player_bank_statement(self, player_id):
        player = self.get_player(player_id)

        # money and credit score
        money = self.player_money(player.id)

        # credit score
        score = self.player_score(player.id)

        data = {
            "player_id": player.id,
            "money": money,
            "credit_score": score,
            "debts": self.get_player_debts(player.id),
            "long_terms": self.get_player_long_terms(player.id),
            "transactions": [t for t in self.transactions if t.sender_id == player.id or t.reciever_id == player.id],
        }

        return json.dumps(data, default=lambda o: o.__dict__)


def new_game():
    # init the game, need to be moved
    id_gen = IDGenerator()
    _bank = Player.new(id_gen, BANK_NAME)
    _supermarket = Player.new(id_gen, SUPER_MARKET_NAME)
    _computer_shop = Player.new(id_gen, COMPUTER_SHOP_NAME)
    _government = Player.new(id_gen, GOV_NAME)
    __utility = Player.new(id_gen, UTILITY_NAME)
    __hospital = Player.new(id_gen, HOSPITAL_NAME)
    __housing = Player.new(id_gen, HOUSING_NAME)
    _accom = Player.new(id_gen, ACCOM_NAME)
    db = Database(id_gen, 24)
    db.add_player(_bank)
    db.add_player(_supermarket)
    db.add_player(_computer_shop)
    db.add_player(_government)
    db.add_player(__utility)
    db.add_player(__hospital)
    db.add_player(__housing)
    db.add_player(_accom)

    ACTION_DO_NOTHING = Action("do nothing", "do_nothing")

    def default_actions():
        return [
            ACTION_DO_NOTHING,
        ]

    for i in range(24):
        db.set_location(i, Location(i, "Boring Place", default_actions()))

    db.set_location(1, Location(
        1,
        "Accomodation",
        [
            Action("buy accomodation (1000 pounds)", "rent"),
        ]
    ))
    db.set_location(10, Location(
        10,
        "Supermarket",
        [
            Action("buy food (50 pounds)", "supermarket_buy_food"),
            Action("part time (150 pounds)", "supermarket_part_time"),
        ] + default_actions()
    ))
    db.set_location(12, Location(
        12,
        "Utility Company",
        [
            Action("pay utility bill(50 pounds)", "pay_utility_bill"),
        ]
    ))
    db.set_location(14, Location(
        14,
        "Gov",
        [
            Action("pay income tax", "income_tax"),
        ]
    ))
    db.set_location(16, Location(
        16,
        "Medical Company",
        [
            Action("pay medical bill(100 pounds)", "pay_medical_bill"),
        ]
    ))
    # db.set_location(18, Location(
    #     18,
    #     "Housing Company",
    #     [
    #         Action("purchase property, (500 pounds mortgage)", "pay_mortgage"),
    #     ] + default_actions()
    # ))
    db.set_location(20, Location(
        20,
        "Computer Shop",
        [
            Action("buy computer (200 pounds)", "computer_shop_buy_computer"),
        ] + default_actions()
        
    ))
    return db


BANK_NAME = "__Bank"
SUPER_MARKET_NAME = "__Super Market"
COMPUTER_SHOP_NAME = "__Computer Shop"
GOV_NAME = "__Government"
UTILITY_NAME = "__Utility Company"
HOSPITAL_NAME = "__Medical Company"
HOUSING_NAME = "__Housing Company"
ACCOM_NAME = "__Accomodation"

# server
app = Flask(__name__)
db_hashmap = {}


@app.route("/<session>/new")
def server_new(session):
    db_hashmap[session] = new_game()
    return jsonify({"status": "new game created"})


@app.route("/<session>/get_location", methods=["POST"])
def get_location(session):
    data = request.get_json()
    db = db_hashmap[session]
    location = db.get_location(data["idx"])
    return location.json_encode()


@app.route("/<session>/run_action", methods=["POST"])
def run_action(session):
    data = request.get_json()
    db = db_hashmap[session]
    db.run_action(data["action"], data["player_id"])
    return jsonify({"status": "ok"})


@app.route("/<session>/add_player", methods=["POST"])
def add_player(session):
    data = request.get_json()
    db = db_hashmap[session]
    player = Player.new(db.id_gen, data["name"])
    db.add_player(player)
    return player.json_encode()


@app.route("/<session>/find_player_by_name", methods=["POST"])
def find_player_by_name(session):
    data = request.get_json()
    db = db_hashmap[session]
    player = db.find_player_by_name(data["name"])
    return player.json_encode()


@app.route("/<session>/get_player", methods=["POST"])
def get_player(session):
    data = request.get_json()
    db = db_hashmap[session]
    player = db.get_player(data["id"])
    return player.json_encode()


@app.route("/<session>/add_debt", methods=["POST"])
def add_debt(session):
    data = request.get_json()
    db = db_hashmap[session]
    debt = Debt.new(db.id_gen, data["debtee_id"], data["start_turn"], data["amount"], data["interest_rate"], data["loaner_id"])
    db.add_debt(debt)
    return debt.json_encode()


@app.route("/<session>/get_debt", methods=["POST"])
def get_debt(session):
    data = request.get_json()
    db = db_hashmap[session]
    debt = db.get_debt(data["id"])
    return debt.json_encode()


@app.route("/<session>/get_player_debts", methods=["POST"])
def get_player_debts(session):
    data = request.get_json()
    db = db_hashmap[session]
    print(data)
    debts = db.get_player_debts(data["player_id"])
    return f"[{",".join([d.json_encode() for d in debts])}]"


@app.route("/<session>/borrow_debt", methods=["POST"])
def borrow_debt(session):
    data = request.get_json()
    db = db_hashmap[session]
    db.borrow_debt(data["player_id"], data["amount"])
    return jsonify({"status": "ok"})


@app.route("/<session>/repay_debt", methods=["POST"])
def repay_debt(session):
    data = request.get_json()
    db = db_hashmap[session]
    db.repay_debt(data["debt_id"], data["debtee_id"], data["amount"])
    return jsonify({"status": "ok"})


@app.route("/<session>/move_player_rel", methods=["POST"])
def move_player_rel(session):
    data = request.get_json()
    db = db_hashmap[session]
    player = db.get_player(data["player_id"])
    location = db.move_player_rel(db, player, data["n"])
    return location.json_encode()


@app.route("/<session>/move_player_abs", methods=["POST"])
def move_player_abs(session):
    data = request.get_json()
    db = db_hashmap[session]
    location = db.move_player_abs(db, data["player_id"], data["location_idx"])
    return location.json_encode()


@app.route("/<session>/add_transaction", methods=["POST"])
def add_transaction(session):
    data = request.get_json()
    db = db_hashmap[session]
    transaction = Transaction.new(db.id_gen, **data)
    db.add_transaction(transaction)
    return transaction.json_encode()


@app.route("/<session>/get_transactions", methods=["GET"])
def get_transactions(session):
    db = db_hashmap[session]
    return f"[{",".join([t.json_encode() for t in db.get_transactions()])}]"


@app.route("/<session>/player_score", methods=["POST"])
def player_score(session):
    data = request.get_json()
    db = db_hashmap[session]
    score = db.player_score(data["id"])
    return jsonify({"score": score})


@app.route("/<session>/player_money", methods=["POST"])
def player_money(session):
    data = request.get_json()
    db = db_hashmap[session]
    money = db.player_money(data["id"])
    return jsonify({"money": money})


@app.route("/<session>/player_bank_statement", methods=["POST"])
def player_bank_statement(session):
    data = request.get_json()
    db = db_hashmap[session]
    result = db.player_bank_statement(data["player_id"])
    return result  # Already JSON encoded

@app.route("/<session>/player_advance_turn", methods=["POST"])
def player_advance_turn(session):
    data = request.get_json()
    db = db_hashmap[session]
    db.player_advance_turn(data["player_id"])
    return jsonify({"status": "ok"})
    

